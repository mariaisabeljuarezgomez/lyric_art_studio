# OAuth Setup Guide for Lyric Art Studio

This guide will help you set up Google and GitHub OAuth authentication for the login page.

## Required Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set up the OAuth consent screen
6. Choose "Web application" as the application type
7. Add authorized redirect URIs:
   - For development: `http://localhost:3001/auth/google/callback`
   - For production: `https://lyricartstudio.shop/auth/google/callback`
8. Copy the Client ID and Client Secret to your `.env` file

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: "Lyric Art Studio"
   - Homepage URL: `https://lyricartstudio.shop` (or `http://localhost:3001` for development)
   - Authorization callback URL: `https://lyricartstudio.shop/auth/github/callback` (or `http://localhost:3001/auth/github/callback` for development)
4. Click "Register application"
5. Copy the Client ID and Client Secret to your `.env` file

## Features

✅ **Google OAuth**: Users can sign in with their Google account
✅ **GitHub OAuth**: Users can sign in with their GitHub account
✅ **Automatic User Creation**: New users are automatically created in the database
✅ **Session Management**: OAuth users get the same session management as regular users
✅ **Responsive Design**: OAuth buttons match the site's design theme

## How It Works

1. User clicks "Continue with Google" or "Continue with GitHub"
2. They're redirected to the respective OAuth provider
3. After authorization, they're redirected back to the site
4. If it's a new user, an account is automatically created
5. User is logged in and redirected to the homepage

## Security Notes

- OAuth passwords are stored as `oauth-google-{id}` or `oauth-github-{id}` to prevent regular login
- All OAuth data is stored securely in the PostgreSQL database
- Sessions are managed using the same secure session system as regular users 