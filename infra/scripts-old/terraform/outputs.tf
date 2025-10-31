output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "Private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "Public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "Database subnets"
  value       = module.vpc.database_subnets
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.mariia-cluster.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.mariia-cluster.endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "EKS cluster certificate authority data"
  value       = aws_eks_cluster.mariia-cluster.certificate_authority[0].data
}

output "eks_node_group_main_name" {
  description = "EKS main node group name"
  value       = aws_eks_node_group.main_nodes.node_group_name
}

output "eks_node_group_frontend_name" {
  description = "EKS frontend node group name"
  value       = aws_eks_node_group.frontend_nodes.node_group_name
}

output "eks_node_group_database_name" {
  description = "EKS database node group name"
  value       = aws_eks_node_group.database_nodes.node_group_name
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds_postgres.db_instance_endpoint
}

output "rds_instance_hosted_zone_id" {
  description = "RDS instance hosted zone ID"
  value       = module.rds_postgres.db_instance_hosted_zone_id
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = module.rds_postgres.db_instance_port
}

output "rds_replica_endpoint" {
  description = "RDS replica endpoint"
  value       = aws_db_instance.postgres_replica.endpoint
}

output "elasticache_primary_endpoint" {
  description = "ElastiCache primary endpoint"
  value       = module.elasticache_redis.primary_endpoint_address
}

output "elasticache_replica_endpoint" {
  description = "ElastiCache replica endpoint"
  value       = module.elasticache_redis.replica_endpoint_address
}

output "elasticache_port" {
  description = "ElastiCache port"
  value       = module.elasticache_redis.port
}

output "s3_bucket_static_assets_name" {
  description = "S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "s3_bucket_static_assets_arn" {
  description = "S3 bucket for static assets ARN"
  value       = aws_s3_bucket.static_assets.arn
}

output "s3_bucket_backups_name" {
  description = "S3 bucket for backups"
  value       = aws_s3_bucket.backups.bucket
}

output "s3_bucket_backups_arn" {
  description = "S3 bucket for backups ARN"
  value       = aws_s3_bucket.backups.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.cdn.arn
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "application_load_balancer_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "application_load_balancer_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "kms_key_arn" {
  description = "KMS key ARN for EKS encryption"
  value       = aws_kms_key.eks_encryption.arn
}

output "cloudwatch_log_group_eks_name" {
  description = "CloudWatch log group for EKS"
  value       = aws_cloudwatch_log_group.eks_logs.name
}

output "cloudwatch_log_group_redis_name" {
  description = "CloudWatch log group for Redis"
  value       = aws_cloudwatch_log_group.redis.name
}

output "cloudwatch_log_group_cloudfront_name" {
  description = "CloudWatch log group for CloudFront"
  value       = aws_s3_bucket.cloudfront_logs.bucket
}

output "security_group_rds_id" {
  description = "Security group for RDS"
  value       = aws_security_group.rds.id
}

output "security_group_redis_id" {
  description = "Security group for Redis"
  value       = aws_security_group.redis.id
}

output "security_group_eks_nodes_id" {
  description = "Security group for EKS nodes"
  value       = aws_security_group.eks_nodes.id
}