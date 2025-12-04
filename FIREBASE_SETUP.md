# Firebase Setup Guide for SOCIATE

This guide will walk you through setting up Firebase Authentication with Google Sign-In for the SOCIATE app.

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Add project" or "Create a project"
   - Enter a project name (e.g., "SOCIATE")
   - Click "Continue"
   - (Optional) Disable Google Analytics if you don't need it
   - Click "Create project"
   - Wait for the project to be created (takes ~30 seconds)
   - Click "Continue"

## Step 2: Enable Google Authentication

1. **Navigate to Authentication**
   - In the Firebase Console, click on "Authentication" in the left sidebar
   - If you see "Get started", click it

2. **Enable Google Sign-In**
   - Click on the "Sign-in method" tab
   - You'll see a list of sign-in providers
   - Click on "Google"
   - Toggle "Enable" to ON
   - Enter a project support email (your email is fine)
   - Click "Save"

## Step 3: Register Your Web App

1. **Add a Web App**
   - In the Firebase Console, click the gear icon (⚙️) next to "Project Overview"
   - Click "Project settings"
   - Scroll down to "Your apps" section
   - Click the "</>" (Web) icon to add a web app

2. **Configure Your App**
   - Enter an app nickname (e.g., "SOCIATE Web")
   - (Optional) Check "Also set up Firebase Hosting"
   - Click "Register app"

3. **Copy Your Firebase Config**
   - You'll see a code snippet with your Firebase configuration
   - It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```
   - **Keep this page open** - you'll need these values in the next step

## Step 4: Add Config to Your App

1. **Open the Firebase Config File**
   - In your project, open `src/firebase.ts`

2. **Replace the Placeholder Values**
   - Replace each placeholder with the actual values from Firebase Console:
   
   ```typescript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",        // Your actual API key
     authDomain: "your-project.firebaseapp.com",          // Your actual auth domain
     projectId: "your-project-id",                         // Your actual project ID
     storageBucket: "your-project.appspot.com",           // Your actual storage bucket
     messagingSenderId: "123456789012",                    // Your actual sender ID
     appId: "1:123456789012:web:abcdef1234567890"          // Your actual app ID
   };
   ```

3. **Save the File**
   - Make sure all values are correctly replaced
   - Save the file

## Step 5: Configure Authorized Domains (For Production)

1. **Add Authorized Domains**
   - In Firebase Console, go to Authentication > Settings
   - Scroll to "Authorized domains"
   - By default, `localhost` is already authorized (for development)
   - For production, add your domain (e.g., `yoursite.com`)

## Step 6: Test the Setup

1. **Start Your Development Server**
   ```bash
   npm run dev
   ```

2. **Test Google Login**
   - Navigate to the Login or Register page
   - Click "Continue with Google"
   - You should see a Google sign-in popup
   - Sign in with your Google account
   - You should be logged into SOCIATE

## Troubleshooting

### Issue: "Firebase: Error (auth/popup-closed-by-user)"
- **Solution**: User closed the popup. This is normal behavior, not an error.

### Issue: "Firebase: Error (auth/unauthorized-domain)"
- **Solution**: Add your domain to authorized domains in Firebase Console:
  - Go to Authentication > Settings > Authorized domains
  - Add your domain (e.g., `localhost:5173` for Vite dev server)

### Issue: "Firebase: Error (auth/api-key-not-valid)"
- **Solution**: 
  - Double-check that you copied the API key correctly
  - Make sure there are no extra spaces or quotes
  - Verify the project is active in Firebase Console

### Issue: Google Sign-In Button Not Working
- **Solution**:
  - Check browser console for errors
  - Verify Firebase config is correct
  - Make sure Google sign-in is enabled in Firebase Console
  - Check that you're using `http://localhost` (not `https://`) for development

### Issue: "This app isn't verified"
- **Solution**: 
  - This is a Google OAuth warning for unverified apps
  - Click "Advanced" then "Go to [your app] (unsafe)"
  - For production, you'll need to verify your app with Google

## Security Best Practices

1. **Don't Commit Firebase Config to Git**
   - Add `src/firebase.ts` to `.gitignore` if it contains real credentials
   - Or use environment variables (see below)

2. **Use Environment Variables (Recommended for Production)**
   - Create a `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
   - Update `src/firebase.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };
   ```

## Quick Reference

### Firebase Console URLs
- **Main Console**: https://console.firebase.google.com/
- **Authentication**: https://console.firebase.google.com/project/YOUR_PROJECT/authentication
- **Project Settings**: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general

### Important Notes
- Firebase has a free tier (Spark Plan) that's perfect for development
- Google Sign-In is free to use
- API keys in client-side code are safe (they're restricted by domain)
- For production, set up proper domain restrictions in Firebase Console

## Next Steps

Once Firebase is set up:
1. ✅ Google Login will work on Login and Register pages
2. ✅ Users can sign in with their Google accounts
3. ✅ User data will be synced with your app's user system
4. ✅ Users can switch between email/password and Google auth

## Need Help?

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Auth Docs**: https://firebase.google.com/docs/auth
- **Google Sign-In Setup**: https://firebase.google.com/docs/auth/web/google-signin

