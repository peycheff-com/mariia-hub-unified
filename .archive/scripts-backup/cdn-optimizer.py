#!/usr/bin/env python3
"""
CDN Asset Optimization Tool
Optimizes and uploads assets to CDN with proper caching headers
Author: Production Infrastructure Team
Version: 1.0.0
"""

import sys
import os
import json
import logging
import argparse
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime, timedelta
import boto3
from PIL import Image
import tinify
import subprocess
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class AssetInfo:
    """Information about a processed asset"""
    source_path: str
    dest_path: str
    content_type: str
    size_original: int
    size_optimized: int
    compression_ratio: float
    cache_control: str
    etag: str
    last_modified: datetime

class CDNOptimizer:
    """Main CDN optimization class"""

    def __init__(self, config_file: str = None):
        """Initialize CDN optimizer"""
        self.load_configuration(config_file)
        self.setup_clients()

    def load_configuration(self, config_file: str):
        """Load configuration from file or use defaults"""
        self.config = {
            "aws_region": "eu-west-1",
            "bucket_name": "mariia-production-assets",
            "cloudfront_distribution_id": "E1234567890ABC",
            "cdn_domain": "cdn.mariia.pl",
            "local_assets_dir": "./public",
            "optimization_level": "medium",  # low, medium, high
            "image_quality": 85,
            "enable_webp": True,
            "enable_avif": True,
            "enable_gzip": True,
            "enable_brotli": True,
            "max_file_size_mb": 50,
            "cache_ttl_images": 31536000,  # 1 year
            "cache_ttl_assets": 2592000,   # 30 days
            "cache_ttl_html": 600,        # 10 minutes
            "cache_ttl_api": 0,          # no cache
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
        """Setup AWS clients"""
        try:
            self.s3 = boto3.client('s3', region_name=self.config["aws_region"])
            self.cloudfront = boto3.client('cloudfront', region_name=self.config["aws_region"])
            self.polly = boto3.client('polly', region_name=self.config["aws_region"])
            logger.info("AWS clients initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AWS clients: {e}")
            sys.exit(1)

    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate MD5 hash of file"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def optimize_image(self, source_path: str, dest_path: str) -> Tuple[str, int, int]:
        """Optimize an image file"""
        try:
            # Open original image
            with Image.open(source_path) as img:
                original_size = os.path.getsize(source_path)
                width, height = img.size

                # Resize based on optimization level
                if self.config["optimization_level"] == "high":
                    max_dimension = 1920
                elif self.config["optimization_level"] == "medium":
                    max_dimension = 2560
                else:  # low
                    max_dimension = 4096

                if max(width, height) > max_dimension:
                    ratio = max_dimension / max(width, height)
                    new_width = int(width * ratio)
                    new_height = int(height * ratio)
                    img = img.resize((new_width, new_height), Image.LANCZOS)

                # Convert and save with optimization
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background

                # Save optimized version
                img.save(dest_path, 'JPEG', quality=self.config["image_quality"], optimize=True)
                optimized_size = os.path.getsize(dest_path)

                return "image/jpeg", original_size, optimized_size

        except Exception as e:
            logger.error(f"Failed to optimize image {source_path}: {e}")
            return None, 0, 0

    def create_webp_version(self, source_path: str, dest_path: str) -> int:
        """Create WebP version of image"""
        try:
            if not self.config["enable_webp"]:
                return 0

            with Image.open(source_path) as img:
                # Convert to WebP
                img.save(dest_path, 'WEBP', quality=90, method=6)
                return os.path.getsize(dest_path)

        except Exception as e:
            logger.error(f"Failed to create WebP version {source_path}: {e}")
            return 0

    def create_avif_version(self, source_path: str, dest_path: str) -> int:
        """Create AVIF version of image"""
        try:
            if not self.config["enable_avif"]:
                return 0

            # Use cwebp if available, fallback to Pillow
            try:
                # Try using cwebp command
                subprocess.run([
                    'cwebp', '-q', '90', source_path, '-o', dest_path
                ], check=True, capture_output=True)
                return os.path.getsize(dest_path)
            except (subprocess.CalledProcessError, FileNotFoundError):
                # Fallback to Pillow (limited AVIF support)
                with Image.open(source_path) as img:
                    img.save(dest_path, 'AVIF', quality=90)
                    return os.path.getsize(dest_path)

        except Exception as e:
            logger.error(f"Failed to create AVIF version {source_path}: {e}")
            return 0

    def compress_text_file(self, source_path: str, dest_path: str) -> Tuple[str, int, int]:
        """Compress text files (CSS, JS, HTML)"""
        try:
            original_size = os.path.getsize(source_path)

            # Read original content
            with open(source_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Minimize content
            if source_path.endswith('.js'):
                # Simple JavaScript minification
                import jsmin
                content = jsmin.jsmin(content)
                content_type = 'application/javascript'
            elif source_path.endswith('.css'):
                # Simple CSS minification
                content = self._minify_css(content)
                content_type = 'text/css'
            elif source_path.endswith('.html'):
                # Simple HTML minification
                content = self._minify_html(content)
                content_type = 'text/html'
            else:
                content_type = 'text/plain'

            # Write compressed content
            with open(dest_path, 'w', encoding='utf-8') as f:
                f.write(content)

            optimized_size = os.path.getsize(dest_path)
            return content_type, original_size, optimized_size

        except Exception as e:
            logger.error(f"Failed to compress text file {source_path}: {e}")
            return None, 0, 0

    def _minify_css(self, css: str) -> str:
        """Simple CSS minification"""
        # Remove comments
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
        # Remove whitespace
        css = re.sub(r'\s+', ' ', css)
        css = re.sub(r';\s*}', '}', css)
        css = re.sub(r'}\s*', '}\n', css)
        css = re.sub(r'\s*{\s*', '{', css)
        css = re.sub(r':\s*', ':', css)
        css = re.sub(r',\s*', ',', css)
        return css.strip()

    def _minify_html(self, html: str) -> str:
        """Simple HTML minification"""
        # Remove comments
        html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
        # Remove extra whitespace
        html = re.sub(r'>\s+<', '><', html)
        html = re.sub(r'\s+', ' ', html)
        return html.strip()

    def get_cache_control_header(self, file_path: str) -> str:
        """Get appropriate Cache-Control header for file type"""
        file_ext = Path(file_path).suffix.lower()

        if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif']:
            return f"public, max-age={self.config['cache_ttl_images']}, immutable"
        elif file_ext in ['.css', '.js']:
            return f"public, max-age={self.config['cache_ttl_assets']}, immutable"
        elif file_ext in ['.html', '.htm']:
            return f"public, max-age={self.config['cache_ttl_html']}, must-revalidate"
        else:
            return f"public, max-age={self.config['cache_ttl_assets']}"

    def upload_to_s3(self, file_path: str, dest_path: str, content_type: str, cache_control: str) -> str:
        """Upload file to S3 with proper metadata"""
        try:
            # Calculate ETag
            file_hash = self.calculate_file_hash(file_path)
            etag = f'"{file_hash}"'

            # Upload to S3
            extra_args = {
                'ContentType': content_type,
                'CacheControl': cache_control,
                'ETag': etag,
                'Metadata': {
                    'original_size': str(os.path.getsize(file_path)),
                    'optimized_date': datetime.now().isoformat(),
                    'optimization_level': self.config["optimization_level"]
                }
            }

            # Add compression encoding for text files
            if content_type.startswith('text/') or content_type.startswith('application/'):
                extra_args['ContentEncoding'] = 'gzip'

            self.s3.upload_file(
                file_path,
                self.config["bucket_name"],
                dest_path,
                ExtraArgs=extra_args
            )

            return etag

        except Exception as e:
            logger.error(f"Failed to upload {file_path} to S3: {e}")
            return ""

    def process_asset(self, source_path: str, relative_path: str) -> List[AssetInfo]:
        """Process a single asset"""
        assets = []
        file_ext = Path(source_path).suffix.lower()
        file_name = Path(source_path).stem

        # Skip large files
        file_size_mb = os.path.getsize(source_path) / (1024 * 1024)
        if file_size_mb > self.config["max_file_size_mb"]:
            logger.warning(f"Skipping large file: {source_path} ({file_size_mb:.1f}MB)")
            return assets

        # Create temporary directory for optimized files
        temp_dir = f"/tmp/mariia-cdn-opt/{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        os.makedirs(temp_dir, exist_ok=True)

        try:
            if file_ext in ['.jpg', '.jpeg', '.png', '.gif']:
                # Process images
                optimized_file = f"{temp_dir}/{file_name}_optimized.jpg"
                content_type, original_size, optimized_size = self.optimize_image(source_path, optimized_file)

                if content_type:
                    cache_control = self.get_cache_control_header(source_path)
                    etag = self.upload_to_s3(optimized_file, relative_path, content_type, cache_control)

                    assets.append(AssetInfo(
                        source_path=source_path,
                        dest_path=relative_path,
                        content_type=content_type,
                        size_original=original_size,
                        size_optimized=optimized_size,
                        compression_ratio=1 - (optimized_size / original_size) if original_size > 0 else 0,
                        cache_control=cache_control,
                        etag=etag,
                        last_modified=datetime.now()
                    ))

                    # Create WebP version
                    if self.config["enable_webp"]:
                        webp_file = f"{temp_dir}/{file_name}.webp"
                        webp_size = self.create_webp_version(optimized_file, webp_file)
                        if webp_size > 0:
                            webp_path = f"{relative_path}.webp"
                            webp_etag = self.upload_to_s3(webp_file, webp_path, "image/webp", cache_control)
                            logger.info(f"Created WebP version: {webp_path} ({webp_size} bytes)")

                    # Create AVIF version
                    if self.config["enable_avif"]:
                        avif_file = f"{temp_dir}/{file_name}.avif"
                        avif_size = self.create_avif_version(optimized_file, avif_file)
                        if avif_size > 0:
                            avif_path = f"{relative_path}.avif"
                            avif_etag = self.upload_to_s3(avif_file, avif_path, "image/avif", cache_control)
                            logger.info(f"Created AVIF version: {avif_path} ({avif_size} bytes)")

            elif file_ext in ['.css', '.js', '.html']:
                # Process text files
                optimized_file = f"{temp_dir}/{file_name}_min{file_ext}"
                content_type, original_size, optimized_size = self.compress_text_file(source_path, optimized_file)

                if content_type:
                    cache_control = self.get_cache_control_header(source_path)
                    etag = self.upload_to_s3(optimized_file, relative_path, content_type, cache_control)

                    assets.append(AssetInfo(
                        source_path=source_path,
                        dest_path=relative_path,
                        content_type=content_type,
                        size_original=original_size,
                        size_optimized=optimized_size,
                        compression_ratio=1 - (optimized_size / original_size) if original_size > 0 else 0,
                        cache_control=cache_control,
                        etag=etag,
                        last_modified=datetime.now()
                    ))

            else:
                # Upload other files as-is
                content_type = self._get_content_type(file_ext)
                cache_control = self.get_cache_control_header(source_path)
                etag = self.upload_to_s3(source_path, relative_path, content_type, cache_control)

                original_size = os.path.getsize(source_path)
                assets.append(AssetInfo(
                    source_path=source_path,
                    dest_path=relative_path,
                    content_type=content_type,
                    size_original=original_size,
                    size_optimized=original_size,
                    compression_ratio=0.0,
                    cache_control=cache_control,
                    etag=etag,
                    last_modified=datetime.now()
                ))

        except Exception as e:
            logger.error(f"Failed to process {source_path}: {e}")
        finally:
            # Clean up temporary directory
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)

        return assets

    def _get_content_type(self, file_ext: str) -> str:
        """Get content type for file extension"""
        content_types = {
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.txt': 'text/plain',
            '.ico': 'image/x-icon',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject'
        }
        return content_types.get(file_ext, 'application/octet-stream')

    def process_directory(self, directory: str) -> List[AssetInfo]:
        """Process all assets in a directory"""
        logger.info(f"Processing assets in directory: {directory}")

        all_assets = []
        processed_count = 0

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.startswith('.'):  # Skip hidden files
                    continue

                source_path = os.path.join(root, file)
                relative_path = os.path.relpath(source_path, directory).replace('\\', '/')

                assets = self.process_asset(source_path, relative_path)
                all_assets.extend(assets)

                processed_count += 1
                if processed_count % 10 == 0:
                    logger.info(f"Processed {processed_count} files...")

        logger.info(f"Completed processing {processed_count} files")
        return all_assets

    def invalidate_cloudfront_cache(self, paths: List[str]) -> bool:
        """Invalidate CloudFront cache for specific paths"""
        if not paths:
            logger.info("No paths to invalidate")
            return True

        try:
            # Create invalidation batch
            invalidation_batch = {
                'DistributionId': self.config["cloudfront_distribution_id"],
                'InvalidationBatch': {
                    'Paths': {
                        'Quantity': len(paths),
                        'Items': paths
                    },
                    'CallerReference': f"cdn-optimizer-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                }
            }

            # Create invalidation
            response = self.cloudfront.create_invalidation(**invalidation_batch)
            invalidation_id = response['Invalidation']['Id']

            logger.info(f"Created CloudFront invalidation: {invalidation_id}")
            logger.info(f"Invalidated {len(paths)} paths")

            return True

        except Exception as e:
            logger.error(f"Failed to create CloudFront invalidation: {e}")
            return False

    def generate_optimization_report(self, assets: List[AssetInfo]) -> Dict:
        """Generate optimization report"""
        if not assets:
            return {"error": "No assets processed"}

        total_original = sum(asset.size_original for asset in assets)
        total_optimized = sum(asset.size_optimized for asset in assets)
        total_saved = total_original - total_optimized
        compression_ratio = (total_saved / total_original * 100) if total_original > 0 else 0

        # Group by type
        by_type = {}
        for asset in assets:
            content_type = asset.content_type.split('/')[0]
            if content_type not in by_type:
                by_type[content_type] = {
                    'count': 0,
                    'original_size': 0,
                    'optimized_size': 0,
                    'saved_size': 0
                }

            by_type[content_type]['count'] += 1
            by_type[content_type]['original_size'] += asset.size_original
            by_type[content_type]['optimized_size'] += asset.size_optimized
            by_type[content_type]['saved_size'] += (asset.size_original - asset.size_optimized)

        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_files': len(assets),
                'total_original_size': total_original,
                'total_optimized_size': total_optimized,
                'total_saved_size': total_saved,
                'compression_ratio_percent': compression_ratio
            },
            'by_type': by_type,
            'top_optimized_files': sorted(
                [asset for asset in assets if asset.compression_ratio > 0],
                key=lambda x: x.compression_ratio,
                reverse=True
            )[:10],
            'failed_files': []
        }

        return report

    def run_optimization(self, directory: str = None, invalidate_cache: bool = False):
        """Run the complete optimization process"""
        if not directory:
            directory = self.config["local_assets_dir"]

        logger.info("Starting CDN optimization process...")

        # Process all assets
        assets = self.process_directory(directory)

        # Generate report
        report = self.generate_optimization_report(assets)

        # Save report
        report_file = f"cdn-optimization-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        logger.info(f"Optimization report saved to: {report_file}")

        # Print summary
        summary = report['summary']
        logger.info(f"Optimization Summary:")
        logger.info(f"  Total files: {summary['total_files']}")
        logger.info(f"  Original size: {summary['total_original_size']:,} bytes")
        logger.info(f"  Optimized size: {summary['total_optimized_size']:,} bytes")
        logger.info(f"  Total saved: {summary['total_saved_size']:,} bytes ({summary['compression_ratio_percent']:.1f}%)")

        # Invalidate CloudFront cache if requested
        if invalidate_cache:
            paths = [f"/{asset.dest_path}" for asset in assets]
            self.invalidate_cloudfront_cache(paths)

        logger.info("CDN optimization process completed")
        return report

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="CDN Asset Optimizer for Mariia platform")
    parser.add_argument("--config", help="Configuration file path")
    parser.add_argument("--directory", help="Directory to process")
    parser.add_argument("--invalidate", action="store_true", help="Invalidate CloudFront cache")
    parser.add_argument("--dry-run", action="store_true", help="Dry run (no uploads)")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    optimizer = CDNOptimizer(args.config)

    if args.dry_run:
        # Mock upload functionality for dry run
        original_upload = optimizer.upload_to_s3
        optimizer.upload_to_s3 = lambda *args: "dry-run-etag"
        original_invalidate = optimizer.invalidate_cloudfront_cache
        optimizer.invalidate_cloudfront_cache = lambda paths: logger.info(f"DRY RUN: Would invalidate {len(paths)} paths")

    optimizer.run_optimization(
        directory=args.directory,
        invalidate_cache=args.invalidate
    )

if __name__ == "__main__":
    main()