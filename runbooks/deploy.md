# Runbook — deploying explore.dig.net

## Overview

Static site on **S3 (private, OAC) + CloudFront** with Route53 DNS + ACM TLS, all in AWS account
`873139760123`, region `us-east-1`. Infrastructure is Terraform in [`terraform/`](../terraform/);
state persists in the shared ecosystem backend (S3 bucket `dighub-tfstate`, key
`explore.dig.net/prod/terraform.tfstate`, DynamoDB lock table `dighub-tflock`).

- Domain: `explore.dig.net` — a record in the **dig.net** hosted zone `Z09143862Q3QQA5P9F8QY`
  (the zone already exists; Terraform only writes records into it).
- S3 site bucket: `explore-dig-net-site`.
- A CloudFront viewer-request function rewrites extensionless `/app/<slug>` (and any `…/`) to
  `…/index.html` so the prerendered per-app pages are served to crawlers; any other miss falls
  back to `/index.html` (SPA routing).

## Normal deploys — push to main (CI)

`.github/workflows/deploy.yml` runs on every push to `main`:

1. **terraform job** — OIDC-assumes the shared deploy role, `terraform init` against the remote
   backend, `terraform apply`. Skipped cleanly (with a notice) when the `CI_DEPLOY_ROLE_ARN` repo
   var is unset.
2. **deploy job** — `npm ci && npm run build` (which re-validates every listing per SPEC.md),
   then `aws s3 sync dist s3://$EXPLORE_S3_BUCKET --delete` + a CloudFront `/*` invalidation.
   Skipped cleanly when the infra repo vars are unset (the build is still verified).

### Required GitHub configuration (org/repo admin, one-time)

- **IAM trust:** add `repo:DIG-Network/explore.dig.net` to the trust policy of the shared deploy
  role `arn:aws:iam::873139760123:role/dighub-ci-deploy` (same pattern as the other DIG sites).
- **Repo variables:** `CI_DEPLOY_ROLE_ARN` = the role ARN above; `EXPLORE_S3_BUCKET` =
  `explore-dig-net-site`; `EXPLORE_CLOUDFRONT_DISTRIBUTION_ID` = the distribution id (terraform
  output `cloudfront_distribution_id`). Optional overrides: `TF_STATE_BUCKET`, `TF_LOCK_TABLE`.
- **Environment:** create the `production` environment (both jobs bind to it).

No repo secrets are required — the store has no build-time secrets.

## Manual terraform (bootstrap or break-glass)

With AWS credentials for account 873139760123:

```bash
cd terraform
terraform init -input=false \
  -backend-config="bucket=dighub-tfstate" \
  -backend-config="dynamodb_table=dighub-tflock" \
  -backend-config="region=us-east-1" \
  -backend-config="key=explore.dig.net/prod/terraform.tfstate"
terraform apply
```

ACM validation records are written into the dig.net zone automatically; the cert validates within
minutes because the zone is live.

## Manual deploy (break-glass)

```bash
npm ci && npm run build
aws s3 sync dist "s3://explore-dig-net-site" --delete
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths '/*'
```

## Verify a deploy went live

```bash
curl -s https://explore.dig.net/ | grep -o "<title>[^<]*"        # store title
curl -s https://explore.dig.net/catalog.json | head -c 300        # machine catalog fresh
curl -s https://explore.dig.net/app/xchtip | grep -o 'rel="canonical" href="[^"]*"'
                                                                  # prerender rewrite works
curl -s https://explore.dig.net/llms.txt | head -3
```

The `catalog.json` `generatedAt` timestamp identifies the build; the page footer + the
`app-version` meta carry the deployed semver+sha.
