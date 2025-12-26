# Super Admin Setup

This script creates a super admin user in the Trusty Check application with full administrative privileges.

## Prerequisites

Before running the script, you need to set up your environment variables:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the `.env.local` file with your Supabase project details:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (required for admin operations)

## Usage

### Method 1: Using environment variables

Set the following environment variables before running the script:

```bash
SUPER_ADMIN_EMAIL=admin@trustycheck.com
SUPER_ADMIN_PASSWORD=SecurePassword123!
SUPER_ADMIN_NAME="Super Admin"
```

Then run:
```bash
npm run create-super-admin
```

### Method 2: Using command line variables

```bash
SUPER_ADMIN_EMAIL=admin@trustycheck.com SUPER_ADMIN_PASSWORD=SecurePassword123! SUPER_ADMIN_NAME="Super Admin" npm run create-super-admin
```

## What the script does

1. Creates a new user in Supabase Auth with the provided credentials
2. Assigns the 'admin' role to the user in the `user_roles` table (with assigned_at timestamp)
3. Creates/updates the user's profile in the `profiles` table
4. Confirms the user's email address automatically

## Default credentials

If no environment variables are provided, the script will use:
- Email: `admin@trustycheck.com`
- Password: `ChangeThisPassword123!`
- Name: `Super Admin`

⚠️ **Important**: Change the default password after your first login for security.

## Verification

After running the script, you can:
1. Log in to your application with the admin credentials
2. Access the System Dashboard at `/system`
3. Verify that you have full administrative privileges