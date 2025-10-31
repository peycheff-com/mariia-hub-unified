terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket = "mariia-terraform-state"
    key    = "production/terraform.tfstate"
    region = "eu-west-1"
    encrypt = true
    dynamodb_table = "mariia-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "mariia-hub"
      Environment = var.environment
      ManagedBy   = "terraform"
      Team        = "platform"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
  host        = aws_eks_cluster.mariia-cluster.endpoint
  token       = data.aws_eks_cluster_auth.mariia-cluster.token
  cluster_ca_certificate = base64decode(
    aws_eks_cluster.mariia-cluster.certificate_authority[0].data
  )
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
    host        = aws_eks_cluster.mariia-cluster.endpoint
    token       = data.aws_eks_cluster_auth.mariia-cluster.token
    cluster_ca_certificate = base64decode(
      aws_eks_cluster.mariia-cluster.certificate_authority[0].data
    )
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Data sources
data "aws_eks_cluster" "mariia-cluster" {
  name = aws_eks_cluster.mariia-cluster.name
}

data "aws_eks_cluster_auth" "mariia-cluster" {
  name = aws_eks_cluster.mariia-cluster.name
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Random resources
resource "random_pet" "suffix" {
  length = 2
}

# TLS certificate for internal services
resource "tls_private_key" "cluster_tls" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "${var.project_name}-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  database_subnets = var.database_subnet_cidrs

  enable_nat_gateway = true
  single_nat_gateway = false
  one_nat_gateway_per_az = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    Type = "public"
    "kubernetes.io/cluster/${aws_eks_cluster.mariia-cluster.name}" = "shared"
  }

  private_subnet_tags = {
    Type = "private"
    "kubernetes.io/cluster/${aws_eks_cluster.mariia-cluster.name}" = "shared"
  }

  database_subnet_tags = {
    Type = "database"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# EKS Cluster
resource "aws_eks_cluster" "mariia-cluster" {
  name     = "${var.project_name}-${var.environment}-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids = module.vpc.private_subnets
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  encryption_config {
    resources = ["secrets"]
    provider {
      key_arn = aws_kms_key.eks_encryption.arn
    }
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_cloudwatch_log_group.eks_logs
  ]
}

# EKS Node Groups
resource "aws_eks_node_group" "main_nodes" {
  cluster_name    = aws_eks_cluster.mariia-cluster.name
  node_group_name = "${var.project_name}-${var.environment}-main-nodes"
  node_role_arn   = aws_iam_role.eks_node_role.arn

  subnet_ids = module.vpc.private_subnets

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 3
  }

  instance_types = ["t3.large", "t3.xlarge"]

  capacity_type  = "ON_DEMAND"

  disk_size = 50

  remote_access {
    ec2_ssh_key = var.ssh_key_name
  }

  labels = {
    role = "main"
    node-type = "general"
  }

  taint {
    key    = "workload"
    value  = "general"
    effect = "NO_SCHEDULE"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy_attachment.eks_autoscaling_policy
  ]
}

resource "aws_eks_node_group" "frontend_nodes" {
  cluster_name    = aws_eks_cluster.mariia-cluster.name
  node_group_name = "${var.project_name}-${var.environment}-frontend-nodes"
  node_role_arn   = aws_iam_role.eks_node_role.arn

  subnet_ids = module.vpc.private_subnets

  scaling_config {
    desired_size = 2
    max_size     = 5
    min_size     = 2
  }

  instance_types = ["t3.medium"]

  capacity_type  = "ON_DEMAND"

  disk_size = 30

  labels = {
    role = "frontend"
    node-type = "frontend"
  }

  taint {
    key    = "workload"
    value  = "frontend"
    effect = "NO_SCHEDULE"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy_attachment.eks_autoscaling_policy
  ]
}

resource "aws_eks_node_group" "database_nodes" {
  cluster_name    = aws_eks_cluster.mariia-cluster.name
  node_group_name = "${var.project_name}-${var.environment}-database-nodes"
  node_role_arn   = aws_iam_role.eks_node_role.arn

  subnet_ids = module.vpc.database_subnets

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 2
  }

  instance_types = ["r5.large", "r5.xlarge"]

  capacity_type  = "ON_DEMAND"

  disk_size = 100

  labels = {
    role = "database"
    node-type = "database"
  }

  taint {
    key    = "workload"
    value  = "database"
    effect = "NO_SCHEDULE"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
    aws_iam_role_policy_attachment.eks_autoscaling_policy
  ]
}

# RDS for PostgreSQL
module "rds_postgres" {
  source = "terraform-aws-modules/rds/aws"
  version = "5.0.0"

  identifier = "${var.project_name}-${var.environment}-postgres"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.r6g.large"

  allocated_storage     = 200
  max_allocated_storage = 1000
  storage_encrypted     = true
  storage_type          = "gp3"
  iops                  = 3000

  db_name  = "mariia_production"
  username = "mariia_admin"
  port     = 5432

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name

  maintenance_window = "Mon:03:00-Mon:04:00"
  backup_window      = "03:00-04:00"

  backup_retention_period = 30
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot"

  deletion_protection = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  monitoring_interval = "60"
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "database"
  }
}

# RDS Read Replica
resource "aws_db_instance" "postgres_replica" {
  identifier = "${var.project_name}-${var.environment}-postgres-replica"

  replicate_source_db = module.rds_postgres.db_instance_identifier
  instance_class      = "db.r6g.medium"

  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name

  performance_insights_enabled = false
  monitoring_interval          = "60"
  monitoring_role_arn         = aws_iam_role.rds_enhanced_monitoring.arn

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "database-replica"
  }

  depends_on = [module.rds_postgres]
}

# ElastiCache for Redis
module "elasticache_redis" {
  source = "terraform-aws-modules/elasticache/aws"
  version = "1.0.0"

  cluster_id = "${var.project_name}-${var.environment}-redis"

  engine_version = "7.0"
  node_type      = "cache.r6g.large"

  num_cache_nodes = 2
  parameter_group_name = "default.redis7"

  port = 6379

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token

  automatic_failover_enabled = true
  multi_az_enabled          = true

  snapshot_retention_limit = 30
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:06:00"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "cache"
  }
}

# S3 Buckets
resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.project_name}-${var.environment}-assets"

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "storage"
  }
}

resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-${var.environment}-backups"

  lifecycle_rule {
    id      = "backup_lifecycle"
    enabled = true

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555 # 7 years
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "backup"
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "backups" {
  bucket = aws_s3_bucket.backups.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled = true
  is_ipv6_enabled = true

  comment = "Mariia Hub CDN Distribution"
  default_root_object = "index.html"

  price_class = "PriceClass_100" # US, Canada, Europe

  aliases = ["mariia.pl", "www.mariia.pl", "cdn.mariia.pl"]

  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static_assets.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.cloudfront_oai.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${aws_lb.main.name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${aws_lb.main.name}"
    compress              = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }

      headers = [
        "Origin",
        "Access-Control-Request-Headers",
        "Access-Control-Request-Method"
      ]
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  cache_behavior {
    path_pattern           = "/static/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.static_assets.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400
    default_ttl = 604800
    max_ttl     = 31536000
  }

  ordered_cache_behavior {
    path_pattern           = "/sw.js"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.static_assets.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn            = aws_acm_certificate.main.arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version        = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket
    prefix          = "cloudfront-logs/"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "cdn"
  }
}