export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional for Google auth users
  displayName: string;
  nickname?: string;
  dob?: string; // Date of birth (YYYY-MM-DD format)
  address?: string;
  avatar: string;
  profilePicture?: string; // Separate profile picture field
  bio: string;
  location?: string;
  website?: string;
  followers: string[];
  following: string[];
  createdAt: string;
  authMethod?: 'email' | 'google'; // Track authentication method
  firebaseUid?: string; // Firebase UID for Google auth users
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[];
  comments: Comment[];
  createdAt: string;
  visibility: 'public' | 'private';
  savedBy: string[]; // User IDs who saved this post
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // User who receives the notification
  type: 'like' | 'comment' | 'follow';
  fromUserId: string;
  fromUsername: string;
  fromUserAvatar: string;
  postId?: string; // For like/comment notifications
  commentId?: string; // For comment notifications
  read: boolean;
  createdAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  mutedUsers: string[]; // User IDs to hide posts from
}

export interface Conversation {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
  // Populated fields for UI
  otherUser?: User;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  // Populated fields for UI
  sender?: User;
}

