# Firestore Database Setup for SOCIATE

## Overview
SOCIATE now uses Firebase Firestore to store user accounts, followers, following relationships, and profile data. This enables real-time synchronization across all users.

## Firestore Collection Structure

### `users` Collection

Each document in the `users` collection represents a user account:

**Document ID**: User's unique ID (Firebase UID for new users, or generated ID for legacy users)

**Document Fields**:
```typescript
{
  name: string;              // Display name
  username: string;          // Unique username
  email: string;             // User email
  bio: string;               // User bio
  dob: string;               // Date of birth (YYYY-MM-DD)
  address: string;           // User address
  nickname: string;          // User nickname
  profilePicture: string;    // Profile picture URL or base64
  followers: string[];       // Array of user IDs who follow this user
  following: string[];       // Array of user IDs this user follows
  createdAt: Timestamp;      // Account creation timestamp
  authMethod: 'email' | 'google';  // Authentication method
  firebaseUid: string;       // Firebase Auth UID (if applicable)
}
```

## Key Features

### 1. User Registration & Login
- **Email/Password Registration**: Creates Firebase Auth user and Firestore document
- **Google Login**: Creates or updates Firestore document with Google account info
- **Legacy Support**: Old localStorage users are automatically synced to Firestore on login

### 2. Follow/Unfollow System
- Uses Firestore `arrayUnion` and `arrayRemove` for atomic updates
- Updates both `followers` and `following` arrays simultaneously
- Real-time synchronization across all devices

### 3. Profile Updates
- Profile changes are saved to Firestore
- Also saved to localStorage for backward compatibility
- Changes reflect immediately in UI

### 4. Feed Logic
- Home feed shows posts from:
  - Logged-in user's own posts
  - Posts from users they follow
- Excludes muted users

## Firebase Console Setup

1. **Enable Firestore**:
   - Go to Firebase Console > Build > Firestore Database
   - Click "Create database"
   - Start in **Test mode** (for development)
   - Choose your preferred location

2. **Security Rules** (for production):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         // Users can read any user profile
         allow read: if true;
         // Users can only update their own profile
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

3. **Indexes** (if needed):
   - Firestore will prompt you to create indexes if you use complex queries
   - Follow the links in error messages to create required indexes

## Migration Notes

### For Existing Users
- Old localStorage users are automatically migrated to Firestore on login
- User data is synced bidirectionally (localStorage ↔ Firestore)
- No data loss during migration

### For New Users
- All new registrations create Firestore documents
- Firebase Auth is used for authentication
- User ID is the Firebase Auth UID

## Service Files

### `firestoreService.ts`
Core Firestore operations:
- `createUserIfNotExists()` - Create or get user document
- `getUserData()` - Fetch user from Firestore
- `updateUserProfile()` - Update user profile
- `followUser()` - Follow a user
- `unfollowUser()` - Unfollow a user
- `searchUsers()` - Search users by name/username
- `getSuggestedUsers()` - Get suggested users to follow

### `userService.ts`
High-level user operations:
- Wraps Firestore operations
- Handles localStorage sync
- Manages user settings (theme, muted users)

### `authService.ts`
Authentication with Firestore sync:
- `registerWithEmail()` - Register and create Firestore document
- `loginWithEmail()` - Login and sync to Firestore
- `loginWithGoogle()` - Google login with Firestore sync

## Testing

1. **Register a new user**: Should create Firestore document
2. **Login**: Should fetch user from Firestore
3. **Follow/Unfollow**: Should update Firestore arrays
4. **Edit Profile**: Should update Firestore document
5. **View Feed**: Should show posts from followed users

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules
- Ensure user is authenticated
- Verify Firebase project configuration

### "User not found" errors
- Check if user document exists in Firestore
- Verify user ID matches Firebase UID
- Check browser console for detailed errors

### Follow/Unfollow not working
- Check Firestore rules allow array updates
- Verify user IDs are correct
- Check browser console for errors

## Next Steps (Optional Enhancements)

1. **Real-time Listeners**: Use `onSnapshot()` for live updates
2. **Pagination**: Implement cursor-based pagination for user lists
3. **Search Indexing**: Use Algolia or similar for better search
4. **Posts Collection**: Move posts to Firestore for real-time sync
5. **Notifications**: Store notifications in Firestore

