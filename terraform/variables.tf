# Input variables. Defaults target the explore.dig.net deploy (AWS acct 873139760123, us-east-1,
# a subdomain record in the EXISTING dig.net hosted zone). Every environment-specific value is a
# var.

variable "aws_region" {
  description = "AWS region. Must be us-east-1 for the CloudFront/ACM pairing."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Primary public hostname the store is served at."
  type        = string
  default     = "explore.dig.net"
}

variable "s3_bucket" {
  description = "S3 bucket holding the built static site (dist/)."
  type        = string
  default     = "explore-dig-net-site"
}

variable "hosted_zone_id" {
  description = <<-EOT
    Route53 hosted zone id for dig.net. The zone ALREADY EXISTS (shared by every *.dig.net
    service) — this stack reads it as a data source and NEVER creates a zone; it only writes the
    explore.dig.net records (+ ACM validation CNAMEs) into it.
  EOT
  type        = string
  default     = "Z09143862Q3QQA5P9F8QY"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_All = every edge PoP worldwide."
  type        = string
  default     = "PriceClass_All"
}

variable "tags" {
  description = "Tags applied to every taggable resource."
  type        = map(string)
  default = {
    Project   = "explore.dig.net"
    ManagedBy = "terraform"
    System    = "DIG Network"
  }
}
