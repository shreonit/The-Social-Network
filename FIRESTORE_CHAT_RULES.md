# Firestore Security Rules for Global Chat

## Collection: `globalMessages`

Add these rules to your Firestore Security Rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global Messages Collection
    match /globalMessages/{messageId} {
      // Anyone can read messages (public chat)
      allow read: if true;
      
      // Only authenticated users can create messages
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.username is string
        && request.resource.data.avatar is string
        && request.resource.data.text is string
        && request.resource.data.createdAt is timestamp;
      
      // Users can only update their own messages
      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid;
      
      // Users can only delete their own messages
      allow delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Firebase Storage Rules for Media Uploads

Add these rules to your Firebase Storage Security Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Global chat media uploads
    match /globalChat/{userId}/{allPaths=**} {
      // Only authenticated users can upload
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024 // 10MB max
        && request.resource.contentType.matches('image/.*|video/.*');
      
      // Anyone can read (public media)
      allow read: if true;
    }
  }
}
```

## Setup Instructions

1. **Go to Firebase Console**:
   - Navigate to your project
   - Go to **Build** > **Firestore Database** > **Rules** tab
   - Paste the Firestore rules above
   - Click **Publish**

2. **Set up Storage Rules**:
   - Go to **Build** > **Storage** > **Rules** tab
   - Paste the Storage rules above
   - Click **Publish**

3. **Test the Rules**:
   - Try sending a message while logged in (should work)
   - Try sending a message while logged out (should fail)
   - Try uploading an image (should work)
   - Try uploading a file > 10MB (should fail)

## Notes

- **Public Read Access**: Messages are readable by everyone (public chat)
- **Authenticated Write**: Only logged-in users can send messages
- **User Verification**: Messages must have the correct userId matching the authenticated user
- **File Size Limit**: Media uploads are limited to 10MB
- **File Type Validation**: Only images and videos are allowed

## Production Considerations

For production, you may want to:
- Add rate limiting (prevent spam)
- Add content moderation
- Add message deletion after a certain time
- Add user blocking functionality
- Add admin moderation capabilities

