# explore.dig.net infrastructure — a private S3 bucket served via CloudFront (Origin Access
# Control), fronted by Route53 + a per-domain ACM cert (see dns.tf). Pattern-matched from the
# xchtip.app / dig.net static-site deploys.
#
# Serving model:
#   • Content-hashed build assets (/assets/*) — long/immutable edge + browser cache.
#   • Everything else (HTML shell, prerendered /app/<slug> pages, catalog.json, llms.txt,
#     sitemap.xml, /catalog/<slug>/ listing art) lives at STABLE urls whose content changes on
#     deploy — SHORT revalidating cache so a deploy propagates quickly even without the
#     invalidation.
#   • Permissive CORS (*) site-wide: the machine catalog + listing assets are public data meant
#     to be consumed cross-origin by agents and tools.
#   • A viewer-request CloudFront Function rewrites directory/extensionless URIs to the
#     prerendered objects (cloudfront-function.js); true misses fall back to /index.html (SPA).

locals {
  s3_origin_id = "s3-${var.s3_bucket}"
}

# --- S3 bucket (private; CloudFront-only via OAC) -----------------------------------------------

resource "aws_s3_bucket" "site" {
  bucket = var.s3_bucket
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration {
    status = "Enabled"
  }
}

# --- CloudFront Origin Access Control (sign requests to the private bucket) ---------------------

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.s3_bucket}-oac"
  description                       = "OAC for ${var.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# AWS-managed long cache for the content-hashed assets.
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

# Short-TTL edge cache for the stable-url content (HTML, catalog, agent files): CloudFront
# revalidates with the origin after 5 minutes, so deploys propagate even without an invalidation.
resource "aws_cloudfront_cache_policy" "short" {
  name        = "${var.s3_bucket}-short"
  comment     = "Short revalidating cache for stable-url content that changes on deploy."
  min_ttl     = 0
  default_ttl = 300
  max_ttl     = 3600

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# --- Response headers: permissive CORS (*) + nosniff --------------------------------------------
# Stable-url content: short browser cache + revalidation.
resource "aws_cloudfront_response_headers_policy" "stable" {
  name    = "${var.s3_bucket}-stable"
  comment = "CORS (*), short revalidating browser cache for stable-url content."

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }
    access_control_allow_origins {
      items = ["*"]
    }
    origin_override = true
  }

  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=300, must-revalidate, stale-while-revalidate=86400"
      override = true
    }
  }

  security_headers_config {
    content_type_options {
      override = true
    }
  }
}

# Content-hashed assets: long immutable browser cache.
resource "aws_cloudfront_response_headers_policy" "immutable" {
  name    = "${var.s3_bucket}-immutable"
  comment = "CORS (*), long-immutable cache for CONTENT-HASHED build assets."

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }
    access_control_allow_origins {
      items = ["*"]
    }
    origin_override = true
  }

  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=31536000, immutable"
      override = true
    }
  }

  security_headers_config {
    content_type_options {
      override = true
    }
  }
}

# --- The viewer-request rewrite (prerendered /app/<slug> pages + directory indexes) -------------

resource "aws_cloudfront_function" "rewrite" {
  name    = "${replace(var.s3_bucket, ".", "-")}-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite /app/<slug> + trailing-slash URIs to their prerendered index.html objects."
  publish = true
  code    = file("${path.module}/cloudfront-function.js")
}

# --- CloudFront distribution ---------------------------------------------------------------------

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "explore.dig.net — the DIG Network dApp store"
  default_root_object = "index.html"
  aliases             = [var.domain_name]
  price_class         = var.price_class
  http_version        = "http2and3"

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  # Default: the HTML shell, prerendered pages, catalog(.json), agent files — short revalidating.
  default_cache_behavior {
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    cache_policy_id            = aws_cloudfront_cache_policy.short.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.stable.id
    compress                   = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.rewrite.arn
    }
  }

  # Hashed build assets: long-immutable cache.
  ordered_cache_behavior {
    path_pattern               = "/assets/*"
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.immutable.id
    compress                   = true
  }

  # SPA routing: a miss (S3/OAC answers 403 for absent keys) serves the shell, which renders the
  # store's own not-found state client-side. Short error TTL so fresh deploys surface quickly.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# --- S3 bucket policy: allow only this CloudFront distribution (via OAC) -------------------------

data "aws_iam_policy_document" "site" {
  statement {
    sid       = "AllowCloudFrontServicePrincipalReadOnly"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site.json
}
