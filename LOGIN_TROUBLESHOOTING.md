# Login Troubleshooting Guide

## Issues Fixed

### 1. Missing Import
- **Problem**: `getUserFromFirestore` was not imported in `authService.ts`
- **Fix**: Added import statement

### 2. Error Handling Improvements
- Added specific error messages for different Firebase Auth error codes
- Added fallback to localStorage if Firestore operations fail
- Login/registration now works even if Firestore is temporarily unavailable

### 3. Google Login Improvements
- Better error handling for popup blocking
- Network error detection
- Firestore sync failures don't block login

### 4. Email/Password Login Improvements
- Better handling when user exists in Firebase Auth but not in Firestore
- Creates user object automatically if missing
- Falls back to localStorage if Firestore fails

## Common Login Issues and Solutions

### Issue: "Login failed" or "Invalid username/email or password"

**Possible Causes:**
1. User doesn't exist in Firebase Auth
2. Wrong password
3. Firestore permissions not set up
4. Network connectivity issues

**Solutions:**
1. **For new users**: Register first using the Register page
2. **For existing users**: 
   - Try logging in with email (not username) if you registered with Firebase Auth
   - Try logging in with username if you're an old localStorage user
3. **Check Firestore Rules**: Make sure Firestore security rules allow read/write for authenticated users
4. **Check Network**: Ensure you have internet connection

### Issue: Google Login Fails

**Possible Causes:**
1. Popup blocked by browser
2. Firebase project not configured for Google Auth
3. Domain not authorized in Firebase Console
4. Network issues

**Solutions:**
1. **Allow Popups**: Check browser settings and allow popups for your site
2. **Enable Google Auth**: 
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains
3. **Check Network**: Ensure stable internet connection
4. **Check Console**: Open browser console (F12) to see detailed error messages

### Issue: Registration Fails

**Possible Causes:**
1. Email already in use
2. Weak password
3. Invalid email format
4. Firestore permissions

**Solutions:**
1. **Email in use**: Try logging in instead, or use a different email
2. **Weak password**: Use at least 6 characters
3. **Invalid email**: Use a valid email format (e.g., user@example.com)
4. **Firestore**: Check that Firestore rules allow authenticated users to create documents

## Testing Login

### Test Email/Password Login:
1. Register a new account with email and password
2. Log out
3. Log in with the same email and password
4. Should work even if Firestore is unavailable (falls back to localStorage)

### Test Google Login:
1. Click "Continue with Google"
2. Select Google account
3. Should create/login user automatically
4. Check browser console for any errors

### Test Old User Login:
1. If you have an old localStorage account:
   - Try logging in with username or email
   - Should work and sync to Firestore automatically

## Firestore Rules Check

Make sure your Firestore rules allow authenticated users to read/write:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true; // Public read for now
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Firebase Auth Configuration

1. **Enable Email/Password Auth**:
   - Firebase Console > Authentication > Sign-in method
   - Enable "Email/Password"

2. **Enable Google Auth**:
   - Firebase Console > Authentication > Sign-in method
   - Enable "Google"
   - Add authorized domains

3. **Check Authorized Domains**:
   - Firebase Console > Authentication > Settings > Authorized domains
   - Add your domain (localhost is usually already there)

## Debugging Steps

1. **Open Browser Console** (F12)
2. **Check for Errors**: Look for red error messages
3. **Check Network Tab**: See if Firebase requests are failing
4. **Check Application Tab**: 
   - Local Storage > Check if user data is saved
   - Check for `loggedInUser` key

## Still Having Issues?

1. Clear browser cache and localStorage
2. Try in incognito/private mode
3. Check Firebase Console for any service outages
4. Verify Firebase configuration in `firebase.ts` matches your project
5. Check that all Firebase services are enabled (Auth, Firestore, Storage)

