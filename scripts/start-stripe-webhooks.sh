#!/bin/bash

# Stripe Webhook Development Script
# This script starts the Stripe CLI webhook listener for development

echo "🚀 Starting Stripe Webhook Listener for Development"
echo "=========================================="

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install it first:"
    echo "   npm install -g stripe-cli"
    echo "   or"
    echo "   curl -s https://packages.stripe.dev/stripe-cli.sh | sh"
    exit 1
fi

# Check if user is logged in
echo "📋 Checking Stripe login status..."
if ! stripe config --list | grep -q "test_mode_api_key"; then
    echo "❌ Not logged in to Stripe. Please run:"
    echo "   stripe login"
    exit 1
fi

echo "✅ Stripe CLI is configured"

# Get the current directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "📁 Project directory: $PROJECT_DIR"

# Set the webhook URL based on environment
if [ "$1" = "production" ]; then
    WEBHOOK_URL="https://your-domain.com/api/stripe/webhook"
    echo "🌐 Using production webhook URL: $WEBHOOK_URL"
else
    WEBHOOK_URL="http://localhost:8080/api/stripe/webhook"
    echo "🔧 Using development webhook URL: $WEBHOOK_URL"
fi

# Define events to listen for
EVENTS="payment_intent.succeeded,payment_intent.payment_failed,invoice.payment_succeeded,invoice.created,invoice.finalized,customer.subscription.created,customer.subscription.deleted"

echo "📡 Listening for events: $EVENTS"
echo "📡 Forwarding to: $WEBHOOK_URL"
echo ""

# Start the webhook listener
echo "⚡ Starting webhook listener..."
echo "   (Press Ctrl+C to stop)"
echo ""

# Check if the development server is running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "⚠️  Warning: Development server is not running on port 8080"
    echo "   Please start it with: npm run dev"
    echo ""
fi

# Execute the stripe listen command
exec stripe listen \
    --events $EVENTS \
    --forward-to $WEBHOOK_URL \
    --skip-verify \
    --format JSON