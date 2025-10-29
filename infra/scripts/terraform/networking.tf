# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.cloudfront_logs.bucket
    prefix  = "alb-logs/"
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "networking"
  }
}

# ALB Target Groups
resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-${var.environment}-main-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  target_type = "ip"

  deregistration_delay = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "networking"
  }
}

resource "aws_lb_target_group" "api" {
  name     = "${var.project_name}-${var.environment}-api-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 15
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  target_type = "ip"

  deregistration_delay = 10

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "networking"
  }
}

# ALB Listeners
resource "aws_lb_listener" "main_http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = 443
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "main_https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.id
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "networking"
  }
}

resource "aws_lb_listener_rule" "api_routing" {
  listener_arn = aws_lb_listener.main_https.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.id
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  condition {
    path_pattern {
      values = ["/auth/*"]
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "networking"
  }
}

# Route 53
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "networking"
  }
}

resource "aws_route53_record" "main" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "cdn" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "cdn.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count  = length(module.vpc.public_subnets)
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    Component   = "networking"
  }

  depends_on = [module.vpc]
}

resource "aws_nat_gateway" "main" {
  count         = length(module.vpc.public_subnets)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = module.vpc.public_subnets[count.index]

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    Component   = "networking"
  }

  depends_on = [module.vpc]
}