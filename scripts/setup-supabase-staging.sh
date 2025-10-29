#!/bin/bash

# =================================
# Supabase Staging Environment Setup Script
# =================================
# This script sets up a Supabase preview branch for staging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${SUPABASE_PROJECT_ID:-lckxvimdqnfjzkbrusgu}"
STAGING_BRANCH="staging"
PARENT_BRANCH="main"
STAGING_PROJECT_ID="${STAGING_SUPABASE_PROJECT_ID}"

echo -e "${BLUE}🔧 Setting up Supabase Staging Environment${NC}"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists supabase; then
    print_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

if ! command_exists jq; then
    print_error "jq is not installed. Please install it first:"
    echo "brew install jq  # macOS"
    echo "sudo apt-get install jq  # Ubuntu"
    exit 1
fi

# Check if user is logged in to Supabase
if ! supabase projects list >/dev/null 2>&1; then
    print_error "You are not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

print_success "Prerequisites check passed"

# Get project information
print_status "Retrieving project information..."
PROJECT_INFO=$(supabase projects show "$PROJECT_ID" 2>/dev/null || echo "")

if [ -z "$PROJECT_INFO" ]; then
    print_error "Could not retrieve project information for project ID: $PROJECT_ID"
    exit 1
fi

print_success "Project information retrieved"

# Option 1: Create Supabase Branch (if supported)
print_status "Creating Supabase preview branch..."

# Check if branching is enabled for the project
BRANCH_STATUS=$(echo "$PROJECT_INFO" | jq -r '.branching // false' 2>/dev/null || echo "false")

if [ "$BRANCH_STATUS" = "true" ]; then
    # Create preview branch
    if supabase branches create "$STAGING_BRANCH" --project-ref "$PROJECT_ID" 2>/dev/null; then
        print_success "Preview branch '$STAGING_BRANCH' created successfully"

        # Get branch URL
        BRANCH_URL=$(supabase branches get "$STAGING_BRANCH" --project-ref "$PROJECT_ID" | jq -r '.branch_url // empty' 2>/dev/null || echo "")

        if [ -n "$BRANCH_URL" ]; then
            print_success "Branch URL: $BRANCH_URL"
            echo "STAGING_SUPABASE_URL=$BRANCH_URL" >> .env.staging.local
        fi
    else
        print_warning "Could not create preview branch. Falling back to separate project setup."
    fi
else
    print_warning "Branching is not enabled for this project. Setting up separate staging project..."
fi

# Option 2: Set up separate staging project
if [ -z "$STAGING_PROJECT_ID" ] || [ "$STAGING_PROJECT_ID" = "staging-project-id" ]; then
    print_warning "STAGING_SUPABASE_PROJECT_ID not configured. Please set up a separate staging project:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Create a new project named 'mariia-hub-staging'"
    echo "3. Copy the project reference ID"
    echo "4. Set STAGING_SUPABASE_PROJECT_ID in your environment"
    echo ""
    echo "For now, we'll proceed with local database setup..."

    # Set up local staging database
    print_status "Setting up local staging database..."

    # Start local Supabase if not running
    if ! supabase status >/dev/null 2>&1; then
        print_status "Starting local Supabase..."
        supabase start
    fi

    # Generate staging migration
    print_status "Generating staging database schema..."
    supabase db diff --schema public --use-migra -f staging_schema.sql

    print_success "Local staging database setup complete"
else
    # Configure remote staging project
    print_status "Configuring remote staging project: $STAGING_PROJECT_ID"

    # Get staging project details
    STAGING_INFO=$(supabase projects show "$STAGING_PROJECT_ID" 2>/dev/null || echo "")

    if [ -n "$STAGING_INFO" ]; then
        # Extract staging project details
        STAGING_URL=$(echo "$STAGING_INFO" | jq -r '.api_url // empty' 2>/dev/null || echo "")
        STAGING_ANON_KEY=$(echo "$STAGING_INFO" | jq -r '.anon_key // empty' 2>/dev/null || echo "")
        STAGING_SERVICE_KEY=$(echo "$STAGING_INFO" | jq -r '.service_key // empty' 2>/dev/null || echo "")

        # Update environment file
        {
            echo "# Auto-generated staging configuration"
            echo "export STAGING_SUPABASE_URL=\"$STAGING_URL\""
            echo "export STAGING_SUPABASE_ANON_KEY=\"$STAGING_ANON_KEY\""
            echo "export STAGING_SUPABASE_SERVICE_ROLE_KEY=\"$STAGING_SERVICE_KEY\""
            echo "export STAGING_SUPABASE_PROJECT_ID=\"$STAGING_PROJECT_ID\""
        } > .env.staging.supabase

        print_success "Staging project configuration saved to .env.staging.supabase"

        # Push schema to staging
        print_status "Pushing database schema to staging..."

        # Link to staging project
        supabase link --project-ref "$STAGING_PROJECT_ID"

        # Push migrations
        if supabase db push; then
            print_success "Database schema pushed to staging successfully"
        else
            print_warning "Could not push schema to staging. Please run manually:"
            echo "supabase link --project-ref $STAGING_PROJECT_ID"
            echo "supabase db push"
        fi
    else
        print_error "Could not retrieve staging project information"
        exit 1
    fi
fi

# Set up staging environment variables in Supabase
print_status "Configuring staging environment variables..."

# Define staging environment variables
STAGING_ENV_VARS=(
    "APP_NAME=Mariia Hub - Staging"
    "APP_ENV=staging"
    "ENVIRONMENT=staging"
    "DEBUG=true"
    "LOG_LEVEL=debug"
    "RATE_LIMIT_RPM=120"
    "CACHE_DURATION=60"
    "MAINTENANCE_MODE=false"
    "ENABLE_BACKUPS=true"
    "BACKUP_RETENTION_DAYS=7"
)

# Set environment variables
if [ -n "$STAGING_PROJECT_ID" ] && [ "$STAGING_PROJECT_ID" != "staging-project-id" ]; then
    for var in "${STAGING_ENV_VARS[@]}"; do
        key=$(echo "$var" | cut -d'=' -f1)
        value=$(echo "$var" | cut -d'=' -f2)

        if supabase secrets set "$key=$value" --project-ref "$STAGING_PROJECT_ID" 2>/dev/null; then
            print_success "Set $key in staging secrets"
        else
            print_warning "Could not set $key. Please set manually in dashboard."
        fi
    done
fi

# Set up Row Level Security (RLS) policies for staging
print_status "Configuring staging RLS policies..."

# Create staging-specific RLS policy script
cat > scripts/staging-rls-policies.sql << 'EOF'
-- Staging Environment RLS Policies
-- These policies provide relaxed security for testing

-- Allow all operations for authenticated users in staging
CREATE POLICY "Allow all for authenticated users (staging)" ON services
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all bookings for authenticated users (staging)" ON bookings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all profiles for authenticated users (staging)" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow public read access for testing
CREATE POLICY "Enable read access for all users (staging)" ON services
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all availability (staging)" ON availability_slots
    FOR SELECT USING (true);

-- Staging-specific function for easy data reset
CREATE OR REPLACE FUNCTION reset_staging_data()
RETURNS void AS $$
BEGIN
    -- Delete all test data (keep structure)
    DELETE FROM booking_notifications;
    DELETE FROM booking_logs;
    DELETE FROM bookings;
    DELETE FROM availability_slots;
    DELETE FROM service_gallery;
    DELETE FROM service_content;
    DELETE FROM services;
    DELETE FROM profiles WHERE email LIKE '%@staging.%';

    -- Reset sequences
    PERFORM setval(pg_get_serial_sequence('bookings', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('services', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('profiles', 'id'), 1, false);

    RAISE NOTICE 'Staging data reset completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION reset_staging_data() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_staging_data() TO anon;
EOF

# Apply RLS policies if staging project is configured
if [ -n "$STAGING_PROJECT_ID" ] && [ "$STAGING_PROJECT_ID" != "staging-project-id" ]; then
    if supabase db push --project-ref "$STAGING_PROJECT_ID" 2>/dev/null; then
        print_success "RLS policies applied to staging"
    else
        print_warning "Could not apply RLS policies. Please run manually:"
        echo "supabase db push --project-ref $STAGING_PROJECT_ID"
    fi
fi

# Generate summary
print_success "Supabase staging environment setup completed!"
echo ""
echo -e "${GREEN}📋 Setup Summary:${NC}"
echo "========================"

if [ -n "$BRANCH_URL" ]; then
    echo "✅ Preview Branch: $BRANCH_URL"
fi

if [ -n "$STAGING_PROJECT_ID" ] && [ "$STAGING_PROJECT_ID" != "staging-project-id" ]; then
    echo "✅ Staging Project ID: $STAGING_PROJECT_ID"
    echo "✅ RLS Policies: Applied"
    echo "✅ Environment Variables: Configured"
else
    echo "⚠️  Staging Project: Manual setup required"
fi

echo ""
echo -e "${BLUE}🔗 Next Steps:${NC}"
echo "=================="

if [ -f ".env.staging.supabase" ]; then
    echo "1. Source the environment variables:"
    echo "   source .env.staging.supabase"
fi

echo "2. Update your deployment secrets with:"
echo "   - STAGING_SUPABASE_URL"
echo "   - STAGING_SUPABASE_ANON_KEY"
echo "   - STAGING_SUPABASE_SERVICE_ROLE_KEY"
echo "   - STAGING_SUPABASE_PROJECT_ID"

echo ""
echo "3. For testing and development:"
echo "   - Use reset_staging_data() SQL function to clear test data"
echo "   - All RLS policies are relaxed for easier testing"

echo ""
echo "4. Set up seed data:"
echo "   npm run db:seed:staging"

print_success "Staging environment setup complete! 🎉"