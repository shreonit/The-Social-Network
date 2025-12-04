import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';
import { getUsers } from '../auth';

const USERS_COLLECTION = 'users';

/**
 * Convert Firestore timestamp to ISO string
 */
const timestampToISO = (timestamp: any): string => {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp || new Date().toISOString();
};

/**
 * Convert User object to Firestore document format
 */
const userToFirestore = (user: User): any => {
  return {
    name: user.displayName,
    username: user.username,
    email: user.email,
    bio: user.bio || '',
    dob: user.dob || '',
    address: user.address || '',
    nickname: user.nickname || '',
    profilePicture: user.profilePicture || user.avatar || '',
    followers: user.followers || [],
    following: user.following || [],
    createdAt: user.createdAt ? Timestamp.fromDate(new Date(user.createdAt)) : serverTimestamp(),
    authMethod: user.authMethod || 'email',
    firebaseUid: user.firebaseUid || user.id,
  };
};

/**
 * Convert Firestore document to User object
 */
const firestoreToUser = (docId: string, data: any): User => {
  return {
    id: docId,
    displayName: data.name || '',
    username: data.username || '',
    email: data.email || '',
    bio: data.bio || '',
    dob: data.dob || '',
    address: data.address || '',
    nickname: data.nickname || '',
    avatar: data.profilePicture || `https://i.pravatar.cc/150?u=${data.username}`,
    profilePicture: data.profilePicture || '',
    followers: data.followers || [],
    following: data.following || [],
    createdAt: timestampToISO(data.createdAt),
    authMethod: data.authMethod || 'email',
    firebaseUid: data.firebaseUid || docId,
  };
};

/**
 * Create or update user document in Firestore
 */
export const createUserIfNotExists = async (user: User): Promise<User> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // User exists, return existing data
      return firestoreToUser(user.id, userSnap.data());
    } else {
      // Create new user document
      const firestoreData = userToFirestore(user);
      await setDoc(userRef, firestoreData);
      return user;
    }
  } catch (error: any) {
    // Silently handle offline/blocked errors - fallback to localStorage will handle it
    if (error?.code === 'unavailable' || error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
      // Firestore is offline or blocked - return user as-is, localStorage will handle it
      return user;
    }
    // Only log unexpected errors
    if (!error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.error('Error creating user in Firestore:', error);
    }
    // Return user anyway - localStorage fallback will work
    return user;
  }
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return firestoreToUser(userId, userSnap.data());
    }
    return null;
  } catch (error: any) {
    // Silently handle offline/blocked errors
    if (error?.code === 'unavailable' || error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
      // Firestore is offline or blocked - return null to trigger localStorage fallback
      return null;
    }
    // Only log unexpected errors (not ad blocker blocks)
    if (!error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.error('Error getting user from Firestore:', error);
    }
    return null;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updateData: any = {};

    if (updates.displayName !== undefined) updateData.name = updates.displayName;
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.dob !== undefined) updateData.dob = updates.dob;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname;
    if (updates.profilePicture !== undefined) updateData.profilePicture = updates.profilePicture;
    if (updates.avatar !== undefined) updateData.profilePicture = updates.avatar;

    await updateDoc(userRef, updateData);
    return await getUserData(userId);
  } catch (error: any) {
    // Silently handle offline/blocked errors
    if (error?.code === 'unavailable' || error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
      // Firestore is offline or blocked - return null to trigger localStorage fallback
      return null;
    }
    // Only log unexpected errors (not ad blocker blocks)
    if (!error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.error('Error updating user in Firestore:', error);
    }
    return null;
  }
};

/**
 * Follow a user
 */
export const followUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    if (currentUserId === targetUserId) return false;

    const currentUserRef = doc(db, USERS_COLLECTION, currentUserId);
    const targetUserRef = doc(db, USERS_COLLECTION, targetUserId);

    // Add targetUserId to currentUser.following
    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId)
    });

    // Add currentUserId to targetUser.followers
    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId)
    });

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    if (currentUserId === targetUserId) return false;

    const currentUserRef = doc(db, USERS_COLLECTION, currentUserId);
    const targetUserRef = doc(db, USERS_COLLECTION, targetUserId);

    // Remove targetUserId from currentUser.following
    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId)
    });

    // Remove currentUserId from targetUser.followers
    await updateDoc(targetUserRef, {
      followers: arrayRemove(currentUserId)
    });

    return true;
  } catch (error: any) {
    // Silently handle offline/blocked errors
    if (error?.code === 'unavailable' || error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
      // Firestore is offline or blocked - return false, localStorage fallback will handle it
      return false;
    }
    // Only log unexpected errors (not ad blocker blocks)
    if (!error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.error('Error unfollowing user:', error);
    }
    return false;
  }
};

/**
 * Search users by username or display name
 */
export const searchUsers = async (query: string, excludeUserId?: string): Promise<User[]> => {
  try {
    // Limit results for performance
    const MAX_RESULTS = 20;
    const usersRef = collection(db, USERS_COLLECTION);
    const lowerQuery = query.toLowerCase();
    const users: User[] = [];

    // Get all users with a limit (Firestore doesn't support case-insensitive search easily)
    // For production, consider using Algolia or similar for better search
    const q = query(usersRef, limit(100)); // Limit to 100 users max for performance
    
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      if (users.length >= MAX_RESULTS) return; // Stop if we have enough results
      
      const user = firestoreToUser(doc.id, doc.data());
      
      // Skip excluded user
      if (excludeUserId && user.id === excludeUserId) return;
      
      // Check if matches query
      const matchesQuery = 
        user.username.toLowerCase().includes(lowerQuery) ||
        user.displayName.toLowerCase().includes(lowerQuery) ||
        (user.nickname && user.nickname.toLowerCase().includes(lowerQuery));
      
      if (matchesQuery) {
        users.push(user);
      }
    });

    return users;
  } catch (error: any) {
    // Silently handle offline/blocked errors - fallback to localStorage
    if (error?.code === 'unavailable' || error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
      return searchUsersLocalStorage(query, excludeUserId);
    }
    // Only log unexpected errors (not ad blocker blocks)
    if (!error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.error('Error searching users:', error);
    }
    // Fallback to localStorage
    return searchUsersLocalStorage(query, excludeUserId);
  }
};

/**
 * Fallback search in localStorage
 */
const searchUsersLocalStorage = (query: string, excludeUserId?: string): User[] => {
  try {
    const users = getUsers();
    const lowerQuery = query.toLowerCase();
    
    return users
      .filter(user => {
        if (excludeUserId && user.id === excludeUserId) return false;
        return (
          user.username.toLowerCase().includes(lowerQuery) ||
          user.displayName.toLowerCase().includes(lowerQuery) ||
          (user.nickname && user.nickname.toLowerCase().includes(lowerQuery))
        );
      })
      .slice(0, 20); // Limit results
  } catch (error) {
    console.error('Error searching localStorage:', error);
    return [];
  }
};

/**
 * Get suggested users (users not already followed)
 */
export const getSuggestedUsers = async (currentUserId: string, limit: number = 5): Promise<User[]> => {
  try {
    const currentUser = await getUserData(currentUserId);
    if (!currentUser) {
      // Fallback to localStorage
      return getSuggestedUsersLocalStorage(currentUserId, limit);
    }

    const usersRef = collection(db, USERS_COLLECTION);
    // Limit query to improve performance
    const q = query(usersRef, limit(50)); // Get max 50 users, then filter
    const querySnapshot = await getDocs(q);
    const suggested: User[] = [];

    querySnapshot.forEach((doc) => {
      if (suggested.length >= limit) return; // Stop if we have enough
      
      const user = firestoreToUser(doc.id, doc.data());
      if (
        user.id !== currentUserId &&
        !currentUser.following.includes(user.id)
      ) {
        suggested.push(user);
      }
    });

    // If we don't have enough suggestions, try localStorage
    if (suggested.length < limit) {
      const localSuggestions = getSuggestedUsersLocalStorage(currentUserId, limit - suggested.length);
      // Merge without duplicates
      localSuggestions.forEach(localUser => {
        if (!suggested.find(u => u.id === localUser.id)) {
          suggested.push(localUser);
        }
      });
    }

    return suggested.slice(0, limit);
  } catch (error: any) {
    // Silently handle offline/blocked errors - fallback to localStorage
    if (error?.code === 'unavailable' || error?.code === 'failed-precondition' || error?.message?.includes('offline')) {
      return getSuggestedUsersLocalStorage(currentUserId, limit);
    }
    // Only log unexpected errors (not ad blocker blocks)
    if (!error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.error('Error getting suggested users:', error);
    }
    // Fallback to localStorage
    return getSuggestedUsersLocalStorage(currentUserId, limit);
  }
};

/**
 * Fallback get suggested users from localStorage
 */
const getSuggestedUsersLocalStorage = (currentUserId: string, limit: number): User[] => {
  try {
    const users = getUsers();
    const currentUser = users.find(u => u.id === currentUserId);
    
    if (!currentUser) return [];

    return users
      .filter(u => 
        u.id !== currentUserId && 
        !currentUser.following.includes(u.id)
      )
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting suggested users from localStorage:', error);
    return [];
  }
};

/**
 * Get multiple users by IDs
 */
export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  try {
    const users: User[] = [];
    await Promise.all(
      userIds.map(async (userId) => {
        const user = await getUserData(userId);
        if (user) users.push(user);
      })
    );
    return users;
  } catch (error) {
    console.error('Error getting users by IDs:', error);
    return [];
  }
};

