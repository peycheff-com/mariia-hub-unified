# Supabase Migration Instructions

## Migration Completed: Local → Remote Production

Your project has been successfully configured to use the remote Supabase instance instead of local development.

### ✅ Completed Steps

1. **✅** Updated `.env` file with remote Supabase URL
2. **✅** Stopped local Supabase services
3. **✅** Verified project configuration
4. **✅** Prepared remote connection settings

### 🔧 Final Setup Required

Before running the application, you need to add your actual API keys to the `.env` file:

1. **Get your API keys from Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Navigate to your project: `lckxvimdqnfjzkbrusgu`
   - Go to Settings → API
   - Copy the Project URL and API keys

2. **Update your `.env` file:**
   ```bash
   # Replace these placeholder values with your actual keys:
   VITE_SUPABASE_ANON_KEY="your_actual_anon_key_here"
   VITE_SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key_here"
   ```

### 🚀 Running the Application

1. **Add your API keys to `.env`:**
   ```bash
   # Edit .env and replace the placeholder keys
   nano .env
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Verify remote connection:**
   - The app should now connect to `https://lckxvimdqnfjzkbrusgu.supabase.co`
   - Check browser console for any Supabase connection warnings

### 🗂️ Key Files Updated

- **`.env`**: Updated to use remote Supabase URL and prepared for API keys
- **`supabase/config.toml`**: Contains project ID `lckxvimdqnfjzkbrusgu`

### 🔄 Local Development (Optional)

If you need to switch back to local development in the future:

1. **Start local Supabase:**
   ```bash
   supabase start
   ```

2. **Update `.env` to use local URL:**
   ```bash
   VITE_SUPABASE_URL="http://127.0.0.1:54321"
   VITE_SUPABASE_ANON_KEY="your_local_anon_key"
   VITE_SUPABASE_SERVICE_ROLE_KEY="your_local_service_role_key"
   ```

### 🆘 Troubleshooting

**Connection Issues:**
- Verify your API keys are correct
- Check network connectivity to `https://lckxvimdqnfjzkbrusgu.supabase.co`
- Ensure RLS policies are configured in your remote project

**Missing Data:**
- Run database migrations on remote instance
- Seed required data using provided scripts:
  ```bash
  npm run seed:preview-data  # For preview environment
  npm run seed:staging-data  # For staging environment
  ```

### 📊 Project Configuration

- **Project ID:** `lckxvimdqnfjzkbrusgu`
- **Remote URL:** `https://lckxvimdqnfjzkbrusgu.supabase.co`
- **Status:** Ready for remote connection (needs API keys)

---

**Next Steps:** Add your actual Supabase API keys to the `.env` file and start the development server!