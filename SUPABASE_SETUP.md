# Supabase Setup Guide

This guide will help you set up Supabase authentication and database for your ProcessAudit AI application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization and enter project details:
   - **Name**: ProcessAudit AI
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
4. Click "Create new project"
5. Wait for the project to be set up (usually takes 1-2 minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://xxx.supabase.co`)
   - **Project API Key** → **anon/public** (the long string starting with `eyJ`)

## 3. Configure Environment Variables

1. In your ProcessAudit AI project, copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `database/schema.sql` and paste it into the editor
4. Click "Run" to execute the schema
5. You should see messages confirming the tables and policies were created

## 5. Configure Authentication (Optional)

### Email Templates
1. Go to **Authentication** → **Templates**
2. Customize the email templates if desired (confirmation, magic link, etc.)

### Auth Settings
1. Go to **Authentication** → **Settings**
2. Configure your settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/**` (for development)
   - For production, add your actual domain

### Email Provider (Optional)
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your email provider for custom email sending
3. If not configured, Supabase will use their default email service

## 6. Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Open your application at `http://localhost:3000`
3. You should see "Sign In" and "Sign Up" buttons in the top right
4. Try creating an account and signing in
5. Complete a process audit and try saving the report

## 7. Database Tables Overview

Your schema creates the following tables:

### `profiles`
- Extends the built-in `auth.users` table
- Stores additional user information like full name, company, role
- Automatically populated when users sign up

### `audit_reports`
- Stores saved audit reports with full process data
- Links to users via `user_id`
- Includes process description, answers, and generated report
- Supports tagging and favorites for organization

## 8. Row Level Security (RLS)

The schema automatically sets up Row Level Security to ensure:
- Users can only see their own profiles and reports
- Users can only modify their own data
- Anonymous users cannot access any user data

## 9. Production Deployment

For production deployment:

1. **Update Environment Variables**:
   - In Vercel/Netlify dashboard, add the same environment variables
   - Update `NEXT_PUBLIC_APP_URL` to your production domain

2. **Update Auth Settings**:
   - In Supabase, update Site URL to your production domain
   - Add your production domain to Redirect URLs

3. **Custom Domain** (Optional):
   - In Supabase Settings → Custom Domains
   - Set up a custom domain for your auth endpoints

## 10. Monitoring and Analytics

### Usage Analytics
- Go to **Reports** in your Supabase dashboard
- Monitor user signups, logins, and database usage
- Set up billing alerts if needed

### Logs
- Go to **Logs** to view real-time logs
- Monitor auth events, database queries, and errors

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure you've copied the correct URL and anon key
   - Restart your development server after adding variables

2. **Authentication not working**
   - Check that your Site URL and Redirect URLs are correct
   - Verify email confirmation is working (check spam folder)

3. **Database errors**
   - Run the schema SQL again to ensure all tables exist
   - Check the Logs section for detailed error messages

4. **RLS (Row Level Security) errors**
   - Ensure you're signed in when trying to save reports
   - Check that the RLS policies were created correctly

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Optional Enhancements

### Email Confirmations
- Enable "Confirm email" in Auth Settings for added security
- Customize email templates with your branding

### Social Login
- Enable OAuth providers (Google, GitHub, etc.) in Auth Settings
- Add social login buttons to your AuthModal component

### Real-time Features
- Use Supabase real-time subscriptions to sync data
- Add collaborative features for team accounts

### File Storage
- Use Supabase Storage for file uploads
- Store uploaded process documents securely