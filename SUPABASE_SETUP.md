# Supabase Setup Guide

This guide will help you set up Supabase for the Mariia Hub project.

## Current Situation

The project has extensive database migrations ready but needs a working Supabase connection. The `.env` file currently contains placeholder values that need to be replaced with actual Supabase project credentials.

## Quick Setup Options

### Option 1: Create a New Free Supabase Project (Recommended)

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get Your Project Credentials**
   - In your Supabase dashboard, go to Settings > API
   - Copy the following values:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Update Your .env File**
   ```bash
   # Replace these values with your actual Supabase credentials
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_ANON_KEY="your-anon-key-here"
   VITE_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   ```

4. **Run Database Migrations**
   ```bash
   # Apply all migrations to set up the database schema
   supabase db push
   ```

### Option 2: Use Local Development with Supabase CLI

1. **Install Supabase CLI**
   ```bash
   # Using Homebrew
   brew install supabase/tap/supabase

   # Or using npm
   npm install -g supabase
   ```

2. **Start Local Development**
   ```bash
   # Start local Supabase instance
   supabase start

   # Get local connection details
   supabase status -o env
   ```

3. **Update .env with Local Values**
   ```bash
   VITE_SUPABASE_URL="http://localhost:54321"
   VITE_SUPABASE_ANON_KEY="your-local-anon-key"
   VITE_SUPABASE_SERVICE_ROLE_KEY="your-local-service-role-key"
   ```

## Database Schema

This project includes a comprehensive database schema with migrations for:

- **User Management**: Profiles, authentication, preferences
- **Services**: Beauty and fitness service catalog
- **Bookings**: Complete booking system with availability management
- **Payments**: Stripe integration, gift cards, deposits
- **Content Management**: Blog posts, media library, SEO
- **Analytics**: User behavior, service metrics, reporting
- **Admin Features**: Role-based access, audit logs, automation

## Migration Dependencies

The migrations expect a basic `profiles` table that extends `auth.users`. If you're setting up manually, ensure this table exists:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Troubleshooting

### "net::ERR_NAME_NOT_RESOLVED" Error
This means your Supabase URL is incorrect. Ensure:
- The URL in `.env` matches your Supabase project URL
- You have a valid Supabase project created
- The project is not paused or suspended

### Migration Issues
If migrations fail with "relation does not exist":
1. Check migration order - basic tables should be created first
2. Ensure `profiles` table exists before running other migrations
3. Use `supabase db reset` to start fresh if needed

### API Key Issues
If you get "Invalid API key" errors:
1. Double-check you're using the correct keys from Settings > API
2. Ensure you're using the `anon` key for client-side access
3. Service role keys should only be used server-side

## Production Considerations

For production deployment:
- Use Row Level Security (RLS) policies (included in migrations)
- Set up proper backup strategies
- Configure custom domains
- Enable audit logging
- Set up monitoring and alerts

## Next Steps

1. Choose one of the setup options above
2. Configure your `.env` file with proper credentials
3. Run the database migrations
4. Start the development server: `npm run dev`
5. Verify the connection by checking the browser console for any Supabase errors

## Support

- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- Project-specific issues: Check the migration files in `supabase/migrations/`
- For schema questions: Review `src/types/supabase.ts` for TypeScript definitions