#!/bin/bash
# Unified image optimization script
# Usage: ./optimize-images.sh [--format webp|avif|jpg] [--quality 80]

FORMAT="webp"
QUALITY=80

while [[ $# -gt 0 ]]; do
    case $1 in
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --quality)
            QUALITY="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "Optimizing images in format: $FORMAT with quality: $QUALITY"

# Run appropriate optimization based on format
if [ "$FORMAT" = "webp" ]; then
    node scripts/utils/optimize-images-webp.js --quality $QUALITY
elif [ "$FORMAT" = "avif" ]; then
    node scripts/utils/optimize-images.js --format avif --quality $QUALITY
else
    node scripts/utils/optimize-images.cjs --quality $QUALITY
fi

echo "Image optimization complete!"
