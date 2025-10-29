#!/usr/bin/env python3
"""
Auto-scaling Monitor and Controller
Intelligent auto-scaling based on multiple metrics and patterns
Author: Production Infrastructure Team
Version: 1.0.0
"""

import sys
import json
import time
import logging
import argparse
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import requests
import boto3
from kubernetes import client, config
from prometheus_api_client import PrometheusConnect, PrometheusApiClientException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class ScalingMetrics:
    """Container for scaling metrics"""
    cpu_utilization: float
    memory_utilization: float
    request_rate: float
    response_time_p95: float
    error_rate: float
    queue_depth: int
    active_connections: int
    timestamp: datetime

@dataclass
class ScalingDecision:
    """Container for scaling decisions"""
    action: str  # 'scale_up', 'scale_down', 'no_action'
    reason: str
    confidence: float
    target_replicas: int
    current_replicas: int
    metrics_used: List[str]

class AutoScaleMonitor:
    """Main auto-scaling monitor class"""

    def __init__(self, config_file: str = None):
        """Initialize the auto-scaling monitor"""
        self.load_configuration(config_file)
        self.setup_clients()

    def load_configuration(self, config_file: str):
        """Load configuration from file or use defaults"""
        self.config = {
            "prometheus_url": "http://prometheus:9090",
            "namespace": "mariia-platform",
            "deployment_name": "mariia-app",
            "min_replicas": 3,
            "max_replicas": 20,
            "scale_up_threshold": 70.0,
            "scale_down_threshold": 30.0,
            "scale_up_cooldown": 300,  # 5 minutes
            "scale_down_cooldown": 600,  # 10 minutes
            "evaluation_interval": 60,  # 1 minute
            "metrics_window": "5m",
            "response_time_threshold": 1000,  # milliseconds
            "error_rate_threshold": 5.0,  # percentage
            "request_rate_threshold": 100,  # requests per second per replica
            "queue_depth_threshold": 100,
        }

        if config_file:
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                self.config.update(user_config)
                logger.info(f"Configuration loaded from {config_file}")
            except Exception as e:
                logger.error(f"Failed to load config file {config_file}: {e}")
                sys.exit(1)

    def setup_clients(self):
        """Setup API clients"""
        try:
            # Kubernetes client
            config.load_incluster_config()  # For running in cluster
            # config.load_kube_config()  # For local development
            self.k8s_apps = client.AppsV1Api()
            self.k8s_autoscaling = client.AutoscalingV1Api()

            # Prometheus client
            self.prometheus = PrometheusConnect(
                url=self.config["prometheus_url"],
                disable_ssl=True
            )

            # AWS CloudWatch client
            self.cloudwatch = boto3.client('cloudwatch', region_name='eu-west-1')

            logger.info("All API clients initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize clients: {e}")
            sys.exit(1)

    def get_current_replicas(self) -> int:
        """Get current number of replicas"""
        try:
            deployment = self.k8s_apps.read_namespaced_deployment(
                name=self.config["deployment_name"],
                namespace=self.config["namespace"]
            )
            return deployment.spec.replicas

        except Exception as e:
            logger.error(f"Failed to get current replicas: {e}")
            return 0

    def collect_metrics(self) -> ScalingMetrics:
        """Collect current metrics from various sources"""
        try:
            queries = {
                "cpu_utilization": (
                    f'avg(rate(container_cpu_usage_seconds_total{{namespace="{self.config["namespace"]}",'
                    f'pod=~"{self.config["deployment_name"]}-.*"}}[{self.config["metrics_window"]}])) * 100'
                ),
                "memory_utilization": (
                    f'avg(container_memory_usage_bytes{{namespace="{self.config["namespace"]}",'
                    f'pod=~"{self.config["deployment_name"]}-.*"}} / container_spec_memory_limit_bytes) * 100'
                ),
                "request_rate": (
                    f'sum(rate(http_requests_total{{job="mariia-app"}}[{self.config["metrics_window"]}]))'
                ),
                "response_time_p95": (
                    f'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{{job="mariia-app"}}[{self.config["metrics_window"]}])) * 1000'
                ),
                "error_rate": (
                    f'sum(rate(http_requests_total{{job="mariia-app",status=~"5.."}}[{self.config["metrics_window"]}])) / '
                    f'sum(rate(http_requests_total{{job="mariia-app"}}[{self.config["metrics_window"]}])) * 100'
                ),
                "queue_depth": (
                    f'sum(nginx_http_pending_requests_total{{job="nginx-ingress"}})'
                ),
                "active_connections": (
                    f'avg(nginx_http_active_connections_total{{job="nginx-ingress"}})'
                )
            }

            metrics_data = {}
            for metric_name, query in queries.items():
                try:
                    result = self.prometheus.custom_query(query=query)
                    if result and len(result) > 0:
                        metrics_data[metric_name] = float(result[0]['value'][1])
                    else:
                        metrics_data[metric_name] = 0.0
                except PrometheusApiClientException as e:
                    logger.warning(f"Failed to query {metric_name}: {e}")
                    metrics_data[metric_name] = 0.0

            return ScalingMetrics(
                cpu_utilization=metrics_data.get("cpu_utilization", 0.0),
                memory_utilization=metrics_data.get("memory_utilization", 0.0),
                request_rate=metrics_data.get("request_rate", 0.0),
                response_time_p95=metrics_data.get("response_time_p95", 0.0),
                error_rate=metrics_data.get("error_rate", 0.0),
                queue_depth=int(metrics_data.get("queue_depth", 0)),
                active_connections=int(metrics_data.get("active_connections", 0)),
                timestamp=datetime.now()
            )

        except Exception as e:
            logger.error(f"Failed to collect metrics: {e}")
            return None

    def analyze_patterns(self, metrics: List[ScalingMetrics]) -> Dict[str, float]:
        """Analyze patterns in metrics over time"""
        if len(metrics) < 2:
            return {}

        cpu_trend = (metrics[-1].cpu_utilization - metrics[0].cpu_utilization) / len(metrics)
        request_trend = (metrics[-1].request_rate - metrics[0].request_rate) / len(metrics)
        response_time_trend = (metrics[-1].response_time_p95 - metrics[0].response_time_p95) / len(metrics)

        return {
            "cpu_trend": cpu_trend,
            "request_trend": request_trend,
            "response_time_trend": response_time_trend,
            "volatility": self._calculate_volatility([m.cpu_utilization for m in metrics])
        }

    def _calculate_volatility(self, values: List[float]) -> float:
        """Calculate volatility (standard deviation) of values"""
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5

    def make_scaling_decision(self, metrics: ScalingMetrics, current_replicas: int, patterns: Dict[str, float]) -> ScalingDecision:
        """Make intelligent scaling decision based on metrics and patterns"""

        # Initialize decision with no action
        decision = ScalingDecision(
            action="no_action",
            reason="All metrics within normal range",
            confidence=0.5,
            target_replicas=current_replicas,
            current_replicas=current_replicas,
            metrics_used=[]
        )

        reasons = []
        metrics_used = []
        confidence_factors = []

        # CPU utilization check
        if metrics.cpu_utilization > self.config["scale_up_threshold"]:
            target = min(current_replicas + 2, self.config["max_replicas"])
            reasons.append(f"High CPU utilization: {metrics.cpu_utilization:.1f}%")
            metrics_used.append("cpu_utilization")
            confidence_factors.append(0.8)

            if target > current_replicas:
                decision.action = "scale_up"
                decision.target_replicas = target

        elif metrics.cpu_utilization < self.config["scale_down_threshold"]:
            target = max(current_replicas - 1, self.config["min_replicas"])
            reasons.append(f"Low CPU utilization: {metrics.cpu_utilization:.1f}%")
            metrics_used.append("cpu_utilization")
            confidence_factors.append(0.6)

            if target < current_replicas:
                decision.action = "scale_down"
                decision.target_replicas = target

        # Response time check
        if metrics.response_time_p95 > self.config["response_time_threshold"]:
            target = min(current_replicas + 1, self.config["max_replicas"])
            reasons.append(f"High response time: {metrics.response_time_p95:.1f}ms")
            metrics_used.append("response_time_p95")
            confidence_factors.append(0.7)

            if target > current_replicas:
                decision.action = "scale_up"
                decision.target_replicas = max(decision.target_replicas, target)

        # Error rate check
        if metrics.error_rate > self.config["error_rate_threshold"]:
            target = min(current_replicas + 2, self.config["max_replicas"])
            reasons.append(f"High error rate: {metrics.error_rate:.1f}%")
            metrics_used.append("error_rate")
            confidence_factors.append(0.9)

            if target > current_replicas:
                decision.action = "scale_up"
                decision.target_replicas = max(decision.target_replicas, target)

        # Request rate per replica check
        requests_per_replica = metrics.request_rate / max(current_replicas, 1)
        if requests_per_replica > self.config["request_rate_threshold"]:
            target = min(current_replicas + 2, self.config["max_replicas"])
            reasons.append(f"High request rate per replica: {requests_per_replica:.1f} r/s")
            metrics_used.append("request_rate")
            confidence_factors.append(0.6)

            if target > current_replicas:
                decision.action = "scale_up"
                decision.target_replicas = max(decision.target_replicas, target)

        # Consider trends
        if patterns.get("cpu_trend", 0) > 5:  # CPU trending up
            if decision.action == "scale_up":
                decision.target_replicas = min(decision.target_replicas + 1, self.config["max_replicas"])
                reasons.append("CPU utilization trending upward")
                metrics_used.append("cpu_trend")
                confidence_factors.append(0.4)

        # Check cooldown periods
        if self._is_in_cooldown("scale_up"):
            if decision.action == "scale_up":
                decision.action = "no_action"
                decision.reason = "Scale up action blocked by cooldown period"
                decision.confidence = 0.9

        if self._is_in_cooldown("scale_down"):
            if decision.action == "scale_down":
                decision.action = "no_action"
                decision.reason = "Scale down action blocked by cooldown period"
                decision.confidence = 0.9

        # Update decision properties
        if reasons:
            decision.reason = "; ".join(reasons)
            decision.metrics_used = metrics_used
            decision.confidence = sum(confidence_factors) / len(confidence_factors)

        return decision

    def _is_in_cooldown(self, action: str) -> bool:
        """Check if action is in cooldown period"""
        # This would check a database or persistent storage for last action timestamps
        # For simplicity, returning False here
        return False

    def execute_scaling_decision(self, decision: ScalingDecision) -> bool:
        """Execute the scaling decision"""
        if decision.action == "no_action":
            logger.info(f"No scaling action needed: {decision.reason}")
            return True

        try:
            deployment = self.k8s_apps.read_namespaced_deployment(
                name=self.config["deployment_name"],
                namespace=self.config["namespace"]
            )

            current_replicas = deployment.spec.replicas
            if decision.target_replicas == current_replicas:
                logger.info("Target replicas same as current, no action needed")
                return True

            # Update deployment
            deployment.spec.replicas = decision.target_replicas
            self.k8s_apps.patch_namespaced_deployment(
                name=self.config["deployment_name"],
                namespace=self.config["namespace"],
                body=deployment
            )

            logger.info(
                f"Scaling {decision.action}: {current_replicas} -> {decision.target_replicas} replicas. "
                f"Reason: {decision.reason} (Confidence: {decision.confidence:.2f})"
            )

            # Record the action for cooldown tracking
            self._record_scaling_action(decision)

            return True

        except Exception as e:
            logger.error(f"Failed to execute scaling decision: {e}")
            return False

    def _record_scaling_action(self, decision: ScalingDecision):
        """Record scaling action for audit and cooldown tracking"""
        # This would store in a database or persistent storage
        # For now, just log the action
        action_data = {
            "timestamp": datetime.now().isoformat(),
            "action": decision.action,
            "from_replicas": decision.current_replicas,
            "to_replicas": decision.target_replicas,
            "reason": decision.reason,
            "confidence": decision.confidence,
            "metrics_used": decision.metrics_used
        }

        logger.info(f"Scaling action recorded: {json.dumps(action_data, indent=2)}")

        # Also send to CloudWatch for monitoring
        try:
            self.cloudwatch.put_metric_data(
                Namespace='Mariia/AutoScaling',
                MetricData=[
                    {
                        'MetricName': 'ScalingAction',
                        'Dimensions': [
                            {'Name': 'Deployment', 'Value': self.config["deployment_name"]},
                            {'Name': 'Action', 'Value': decision.action}
                        ],
                        'Value': 1,
                        'Unit': 'Count'
                    }
                ]
            )
        except Exception as e:
            logger.warning(f"Failed to record scaling action in CloudWatch: {e}")

    def run_monitoring_cycle(self):
        """Run one monitoring and scaling cycle"""
        logger.info("Starting monitoring cycle...")

        # Collect current metrics
        metrics = self.collect_metrics()
        if not metrics:
            logger.error("Failed to collect metrics, skipping this cycle")
            return

        # Get current replicas
        current_replicas = self.get_current_replicas()
        if current_replicas == 0:
            logger.error("Failed to get current replicas, skipping this cycle")
            return

        # Analyze patterns (using historical data)
        # In production, this would load from a time series database
        patterns = {}

        # Make scaling decision
        decision = self.make_scaling_decision(metrics, current_replicas, patterns)

        # Log current state
        logger.info(
            f"Current state: {current_replicas} replicas, "
            f"CPU: {metrics.cpu_utilization:.1f}%, "
            f"Memory: {metrics.memory_utilization:.1f}%, "
            f"Request rate: {metrics.request_rate:.1f} r/s, "
            f"Response time: {metrics.response_time_p95:.1f}ms, "
            f"Error rate: {metrics.error_rate:.1f}%"
        )

        # Execute decision
        self.execute_scaling_decision(decision)

        logger.info("Monitoring cycle completed")

    def run_continuous(self):
        """Run continuous monitoring"""
        logger.info("Starting continuous auto-scaling monitor")

        try:
            while True:
                self.run_monitoring_cycle()
                time.sleep(self.config["evaluation_interval"])

        except KeyboardInterrupt:
            logger.info("Monitoring stopped by user")
        except Exception as e:
            logger.error(f"Monitoring stopped due to error: {e}")
            raise

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Auto-scaling monitor for Mariia platform")
    parser.add_argument("--config", help="Configuration file path")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode (no actual scaling)")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    monitor = AutoScaleMonitor(args.config)

    if args.dry_run:
        # Override execute_scaling_decision to just log
        original_execute = monitor.execute_scaling_decision
        monitor.execute_scaling_decision = lambda decision: (
            logger.info(f"DRY RUN: Would execute {decision.action} from {decision.current_replicas} to {decision.target_replicas} replicas")
        )

    if args.once:
        monitor.run_monitoring_cycle()
    else:
        monitor.run_continuous()

if __name__ == "__main__":
    main()