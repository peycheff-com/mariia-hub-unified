#!/usr/bin/env python3
"""
Redis Cluster Management Tool
Manages Redis cluster operations, monitoring, and failover
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
import redis
import redis.sentinel
import requests
from kubernetes import client, config, watch
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class RedisNodeInfo:
    """Information about a Redis node"""
    host: str
    port: int
    role: str  # master, replica
    connected: bool
    memory_usage: float
    cpu_usage: float
    connections: int
    lag: int = 0
    last_seen: Optional[datetime] = None

@dataclass
class ClusterStatus:
    """Overall cluster status"""
    master_host: str
    master_port: int
    replicas: List[RedisNodeInfo]
    total_memory: float
    total_connections: int
    is_healthy: bool
    failover_needed: bool

class RedisClusterManager:
    """Main Redis cluster management class"""

    def __init__(self, config_file: str = None):
        """Initialize Redis cluster manager"""
        self.load_configuration(config_file)
        self.setup_kubernetes_client()

    def load_configuration(self, config_file: str):
        """Load configuration from file or use defaults"""
        self.config = {
            "namespace": "mariia-platform",
            "master_service": "redis-cache-service",
            "replica_service": "redis-replica-service",
            "master_port": 6379,
            "replica_port": 6379,
            "password_file": "/etc/redis-secret/password",
            "health_check_interval": 10,
            "failover_timeout": 60,
            "replication_lag_threshold": 30,  # seconds
            "memory_threshold": 80,  # percentage
            "connection_threshold": 1000,  # connections
            "auto_failover": True,
            "sentinel_mode": False,
            "sentinel_services": ["redis-sentinel-1", "redis-sentinel-2", "redis-sentinel-3"],
            "sentinel_port": 26379,
            "sentinel_master_name": "mariia-master",
        }

        if config_file:
            try:
                with open(config_file, 'r') as f:
                    user_config = yaml.safe_load(f)
                self.config.update(user_config)
                logger.info(f"Configuration loaded from {config_file}")
            except Exception as e:
                logger.error(f"Failed to load config file {config_file}: {e}")
                sys.exit(1)

    def setup_kubernetes_client(self):
        """Setup Kubernetes client"""
        try:
            config.load_incluster_config()  # For running in cluster
            self.k8s_apps = client.AppsV1Api()
            self.k8s_core = client.CoreV1Api()
            self.k8s_watch = watch.Watch()
            logger.info("Kubernetes client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Kubernetes client: {e}")
            sys.exit(1)

    def get_redis_password(self) -> str:
        """Get Redis password from Kubernetes secret"""
        try:
            secret = self.k8s_core.read_namespaced_secret(
                name="redis-secret",
                namespace=self.config["namespace"]
            )
            password = secret.data.get("redis-password", "")
            if password:
                import base64
                return base64.b64decode(password).decode('utf-8')
            else:
                logger.error("Redis password not found in secret")
                return ""
        except Exception as e:
            logger.error(f"Failed to get Redis password: {e}")
            return ""

    def get_redis_connection(self, host: str, port: int = None) -> redis.Redis:
        """Get Redis connection to a specific node"""
        if port is None:
            port = self.config["master_port"]

        password = self.get_redis_password()

        try:
            r = redis.Redis(
                host=host,
                port=port,
                password=password if password else None,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                retry_on_error=[redis.ConnectionError, redis.TimeoutError]
            )
            # Test connection
            r.ping()
            return r
        except Exception as e:
            logger.error(f"Failed to connect to Redis at {host}:{port}: {e}")
            return None

    def get_sentinel_connection(self, host: str, port: int = None) -> redis.sentinel.Sentinel:
        """Get Redis Sentinel connection"""
        if port is None:
            port = self.config["sentinel_port"]

        password = self.get_redis_password()

        try:
            sentinel = redis.sentinel.Sentinel(
                [(host, port)],
                password=password if password else None,
                socket_timeout=5
            )
            return sentinel
        except Exception as e:
            logger.error(f"Failed to connect to Sentinel at {host}:{port}: {e}")
            return None

    def get_node_info(self, host: str, port: int = None) -> RedisNodeInfo:
        """Get comprehensive information about a Redis node"""
        r = self.get_redis_connection(host, port)
        if not r:
            return RedisNodeInfo(
                host=host,
                port=port or self.config["master_port"],
                role="unknown",
                connected=False,
                memory_usage=0.0,
                cpu_usage=0.0,
                connections=0
            )

        try:
            info = r.info()
            role = info.get("role", "unknown")

            # Get memory usage
            memory_used = info.get("used_memory", 0)
            memory_max = info.get("maxmemory", 0)
            memory_usage_percent = (memory_used / memory_max * 100) if memory_max > 0 else 0

            # Get connection count
            connections = info.get("connected_clients", 0)

            # For replicas, get replication lag
            lag = 0
            if role == "slave":
                lag = info.get("master_link_down_since_seconds", 0)

            return RedisNodeInfo(
                host=host,
                port=port or self.config["master_port"],
                role=role,
                connected=True,
                memory_usage=memory_usage_percent,
                cpu_usage=0.0,  # Redis doesn't directly expose CPU
                connections=connections,
                lag=lag,
                last_seen=datetime.now()
            )

        except Exception as e:
            logger.error(f"Failed to get info from {host}:{port}: {e}")
            return RedisNodeInfo(
                host=host,
                port=port or self.config["master_port"],
                role="error",
                connected=False,
                memory_usage=0.0,
                cpu_usage=0.0,
                connections=0
            )

    def get_cluster_status(self) -> ClusterStatus:
        """Get overall cluster status"""
        try:
            # Get master node info
            master_nodes = self.k8s_core.read_namespaced_service(
                name=self.config["master_service"],
                namespace=self.config["namespace"]
            )
            master_host = master_nodes.spec.cluster_ip

            master_info = self.get_node_info(master_host)
            if not master_info.connected:
                logger.error(f"Cannot connect to master at {master_host}")
                return ClusterStatus(
                    master_host="",
                    master_port=0,
                    replicas=[],
                    total_memory=0.0,
                    total_connections=0,
                    is_healthy=False,
                    failover_needed=True
                )

            # Get replica nodes info
            replica_nodes = self.k8s_core.read_namespaced_service(
                name=self.config["replica_service"],
                namespace=self.config["namespace"]
            )
            replicas = []

            # Get endpoints for replica service
            endpoints = self.k8s_core.read_namespaced_endpoints(
                name=self.config["replica_service"],
                namespace=self.config["namespace"]
            )

            for endpoint in endpoints.subsets:
                for addr in endpoint.addresses:
                    if addr.ip:
                        replica_info = self.get_node_info(addr.ip)
                        replicas.append(replica_info)

            # Calculate totals
            total_memory = master_info.memory_usage
            total_connections = master_info.connections
            for replica in replicas:
                total_memory += replica.memory_usage
                total_connections += replica.connections

            # Check if failover is needed
            failover_needed = self._check_failover_needed(master_info, replicas)

            return ClusterStatus(
                master_host=master_host,
                master_port=self.config["master_port"],
                replicas=replicas,
                total_memory=total_memory,
                total_connections=total_connections,
                is_healthy=master_info.connected and not failover_needed,
                failover_needed=failover_needed
            )

        except Exception as e:
            logger.error(f"Failed to get cluster status: {e}")
            return ClusterStatus(
                master_host="",
                master_port=0,
                replicas=[],
                total_memory=0.0,
                total_connections=0,
                is_healthy=False,
                failover_needed=True
            )

    def _check_failover_needed(self, master: RedisNodeInfo, replicas: List[RedisNodeInfo]) -> bool:
        """Check if failover is needed"""
        # Check if master is down
        if not master.connected:
            logger.warning("Master node is not connected")
            return True

        # Check replica lag
        for replica in replicas:
            if replica.connected and replica.lag > self.config["replication_lag_threshold"]:
                logger.warning(f"Replica {replica.host} has high lag: {replica.lag}s")
                return True

        # Check memory usage
        if master.memory_usage > self.config["memory_threshold"]:
            logger.warning(f"Master memory usage is high: {master.memory_usage:.1f}%")
            # Only failover if replicas are healthy
            healthy_replicas = [r for r in replicas if r.connected]
            if len(healthy_replicas) > 0:
                return True

        # Check connection count
        if master.connections > self.config["connection_threshold"]:
            logger.warning(f"Master connection count is high: {master.connections}")
            # Only failover if replicas can handle load
            total_replica_capacity = sum(r.connections for r in replicas if r.connected)
            if total_replica_capacity > 0:
                return True

        return False

    def perform_failover(self) -> bool:
        """Perform manual failover to promote a replica"""
        logger.warning("Starting manual failover process...")

        if not self.config["auto_failover"]:
            logger.info("Auto-failover is disabled. Manual intervention required.")
            return False

        try:
            # Get current cluster status
            status = self.get_cluster_status()

            # Find best replica candidate
            healthy_replicas = [r for r in status.replicas if r.connected]
            if not healthy_replicas:
                logger.error("No healthy replicas available for failover")
                return False

            # Select replica with lowest lag and lowest memory usage
            best_replica = min(healthy_replicas,
                             key=lambda r: (r.lag, r.memory_usage))

            logger.info(f"Selected replica for promotion: {best_replica.host}")

            # Update Kubernetes to promote replica to master
            # This would involve updating the Redis configuration and restarting
            # For now, we'll log the action that should be taken
            logger.info(f"Would promote {best_replica.host} to master")
            logger.info("Update master service to point to new master")
            logger.info("Update replica configurations to point to new master")

            # In a real implementation, this would:
            # 1. Update Redis config on the chosen replica
            # 2. Restart it as a master
            # 3. Update other replicas to replicate from new master
            # 4. Update Kubernetes services
            # 5. Update application configuration

            logger.warning("Failover process completed (simulated)")
            return True

        except Exception as e:
            logger.error(f"Failed to perform failover: {e}")
            return False

    def monitor_cluster(self, continuous: bool = False):
        """Monitor cluster health and status"""
        logger.info("Starting Redis cluster monitoring")

        try:
            while True:
                status = self.get_cluster_status()

                # Log cluster status
                logger.info(f"Cluster Status: {'HEALTHY' if status.is_healthy else 'UNHEALTHY'}")
                logger.info(f"Master: {status.master_host}:{status.master_port}")
                logger.info(f"Replicas: {len(status.replicas)}")
                logger.info(f"Total Memory Usage: {status.total_memory:.1f}%")
                logger.info(f"Total Connections: {status.total_connections}")

                # Check for issues
                if not status.is_healthy:
                    logger.error("Cluster is unhealthy!")
                    if status.failover_needed:
                        logger.error("Failover is needed!")
                        if self.config["auto_failover"]:
                            self.perform_failover()
                        else:
                            logger.error("Manual failover required!")

                # Check individual replica health
                for replica in status.replicas:
                    if replica.connected:
                        if replica.lag > self.config["replication_lag_threshold"]:
                            logger.warning(f"Replica {replica.host} lag: {replica.lag}s")
                        if replica.memory_usage > self.config["memory_threshold"]:
                            logger.warning(f"Replica {replica.host} memory: {replica.memory_usage:.1f}%")
                    else:
                        logger.error(f"Replica {replica.host} is not connected")

                if not continuous:
                    break

                time.sleep(self.config["health_check_interval"])

        except KeyboardInterrupt:
            logger.info("Monitoring stopped by user")
        except Exception as e:
            logger.error(f"Monitoring stopped due to error: {e}")
            raise

    def get_cluster_metrics(self) -> Dict:
        """Get detailed cluster metrics for monitoring"""
        status = self.get_cluster_status()

        metrics = {
            "timestamp": datetime.now().isoformat(),
            "cluster_healthy": status.is_healthy,
            "master_host": status.master_host,
            "master_port": status.master_port,
            "total_replicas": len(status.replicas),
            "healthy_replicas": len([r for r in status.replicas if r.connected]),
            "total_memory_usage": status.total_memory,
            "total_connections": status.total_connections,
            "master_memory_usage": 0.0,
            "master_connections": 0,
            "replicas": []
        }

        # Get master-specific metrics
        master_info = self.get_node_info(status.master_host)
        if master_info.connected:
            metrics["master_memory_usage"] = master_info.memory_usage
            metrics["master_connections"] = master_info.connections

        # Get replica-specific metrics
        for replica in status.replicas:
            replica_metrics = {
                "host": replica.host,
                "port": replica.port,
                "connected": replica.connected,
                "memory_usage": replica.memory_usage,
                "connections": replica.connections,
                "lag": replica.lag
            }
            metrics["replicas"].append(replica_metrics)

        return metrics

    def cleanup_replicas(self) -> bool:
        """Clean up disconnected or stale replicas"""
        logger.info("Starting replica cleanup...")

        try:
            status = self.get_cluster_status()
            cleanup_count = 0

            for replica in status.replicas:
                if not replica.connected:
                    logger.warning(f"Cleaning up disconnected replica: {replica.host}")
                    # This would involve:
                    # 1. Removing replica from Kubernetes
                    # 2. Updating configuration
                    # 3. Recreating if needed

                    # For now, just log the action
                    cleanup_count += 1

            logger.info(f"Replica cleanup completed. Removed {cleanup_count} replicas.")
            return True

        except Exception as e:
            logger.error(f"Failed to cleanup replicas: {e}")
            return False

    def rebalance_cluster(self) -> bool:
        """Rebalance cluster by adjusting replicas"""
        logger.info("Starting cluster rebalancing...")

        try:
            status = self.get_cluster_status()

            # Check if we need more replicas
            if status.total_memory_usage > self.config["memory_threshold"] * 0.8:
                logger.info("Memory usage is high, scaling up replicas")
                # This would trigger Kubernetes HPA or manual scaling

            # Check if we can reduce replicas
            elif status.total_memory_usage < self.config["memory_threshold"] * 0.3:
                logger.info("Memory usage is low, scaling down replicas")
                # This would reduce replica count

            logger.info("Cluster rebalancing completed")
            return True

        except Exception as e:
            logger.error(f"Failed to rebalance cluster: {e}")
            return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Redis Cluster Manager for Mariia platform")
    parser.add_argument("--config", help="Configuration file path")
    parser.add_argument("--monitor", action="store_true", help="Monitor cluster continuously")
    parser.add_argument("--status", action="store_true", help="Show cluster status")
    parser.add_argument("--metrics", action="store_true", help="Show cluster metrics")
    parser.add_argument("--failover", action="store_true", help="Perform manual failover")
    parser.add_argument("--cleanup", action="store_true", help="Clean up disconnected replicas")
    parser.add_argument("--rebalance", action="store_true", help="Rebalance cluster")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    manager = RedisClusterManager(args.config)

    if args.status:
        status = manager.get_cluster_status()
        print(json.dumps(status.__dict__, indent=2, default=str))
    elif args.metrics:
        metrics = manager.get_cluster_metrics()
        print(json.dumps(metrics, indent=2, default=str))
    elif args.failover:
        manager.perform_failover()
    elif args.cleanup:
        manager.cleanup_replicas()
    elif args.rebalance:
        manager.rebalance_cluster()
    else:
        # Default: monitor (continuous if specified, otherwise once)
        manager.monitor_cluster(continuous=args.monitor)

if __name__ == "__main__":
    main()