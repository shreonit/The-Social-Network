# SOCIATE - Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase** (Required for Google Login)
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Authentication > Sign-in method > Google
   - Go to Project Settings > General
   - Copy your Firebase config values
   - Open `src/firebase.ts` and replace the placeholder values:
     ```typescript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY_HERE",
       authDomain: "YOUR_AUTH_DOMAIN_HERE",
       projectId: "YOUR_PROJECT_ID_HERE",
       storageBucket: "YOUR_STORAGE_BUCKET_HERE",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
       appId: "YOUR_APP_ID_HERE"
     };
     ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to the URL shown (usually `http://localhost:5173`)

## Features

### Authentication
- **Email/Password**: Register and login with email and password
- **Google Login**: Sign in with Google account (requires Firebase setup)
- **Remember Me**: Option to persist login session

### Core Features
- **Create Posts**: Share text, images, and videos
- **Like & Comment**: Interact with posts
- **Follow Users**: Connect with other users
- **Save Posts**: Bookmark posts for later
- **Explore**: Discover users and public posts
- **Notifications**: Get notified about likes, comments, and follows
- **Mute Users**: Hide posts from specific users
- **Dark Theme**: Toggle between light and dark modes

### Profile
- **Edit Profile**: Update display name, bio, avatar, location, website
- **View Posts**: See all your posts
- **Saved Posts**: Access your bookmarked posts
- **Stats**: View followers, following, and post count

## Demo Accounts

The app includes 3 mock users for testing:
- Username: `johndoe`, Password: `password123`
- Username: `janedoe`, Password: `password123`
- Username: `alexsmith`, Password: `password123`

## Data Storage

All data is stored locally in your browser using localStorage. This means:
- Data persists between sessions
- Data is specific to your browser
- Clearing browser data will remove all app data

## Notes

- Google Login requires Firebase configuration
- Media URLs should be direct links to images or videos
- The app works without Firebase, but Google Login will be unavailable

## Exposing Your App Publicly with ngrok

To share your development server publicly, see [NGROK_SETUP.md](./NGROK_SETUP.md) for complete instructions.

**Quick Start:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http --host-header=rewrite 5173
```

**Important:** Add your ngrok domain to Firebase Authorized Domains for Google Login to work.

## Troubleshooting

### Google Login Not Working
- Ensure Firebase is properly configured
- Check that Google sign-in is enabled in Firebase Console
- Verify all config values are correct
- **If using ngrok:** Add your ngrok domain to Firebase Authorized Domains

### Data Not Persisting
- Check browser localStorage settings
- Ensure cookies/localStorage are enabled
- Try clearing and re-registering

