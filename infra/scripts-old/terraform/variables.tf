variable "project_name" {
  type        = string
  default     = "mariia-hub"
  description = "Name of the project"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Environment name"
}

variable "aws_region" {
  type        = string
  default     = "eu-west-1"
  description = "AWS region"
}

variable "kubernetes_version" {
  type        = string
  default     = "1.28"
  description = "Kubernetes version"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "CIDR block for VPC"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  description = "CIDR blocks for public subnets"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  description = "CIDR blocks for private subnets"
}

variable "database_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
  description = "CIDR blocks for database subnets"
}

variable "ssh_key_name" {
  type        = string
  default     = "mariia-prod-key"
  description = "SSH key name for EC2 instances"
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token for DNS management"
}

variable "redis_auth_token" {
  type        = string
  sensitive   = true
  description = "Redis authentication token"
}

variable "domain_name" {
  type        = string
  default     = "mariia.pl"
  description = "Primary domain name"
}

variable "additional_domains" {
  type        = list(string)
  default     = ["www.mariia.pl", "api.mariia.pl"]
  description = "Additional domain names"
}

variable "notification_email" {
  type        = string
  default     = "admin@mariia.pl"
  description = "Email for notifications"
}