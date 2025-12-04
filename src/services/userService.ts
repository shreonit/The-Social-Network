import { User, UserSettings } from '../types';
import { 
  createUserIfNotExists,
  getUserData,
  updateUserProfile,
  followUser as followUserFirestore,
  unfollowUser as unfollowUserFirestore,
  searchUsers as searchUsersFirestore,
  getSuggestedUsers as getSuggestedUsersFirestore,
} from './firestoreService';
import { getLoggedInUser, setLoggedInUser, getUsers, saveUsers } from '../auth';

const SETTINGS_KEY = 'userSettings';

/**
 * Create user in Firestore if not exists (used after registration/login)
 */
export const syncUserToFirestore = async (user: User): Promise<User> => {
  try {
    return await createUserIfNotExists(user);
  } catch (error) {
    console.error('Error syncing user to Firestore:', error);
    return user; // Return original user if Firestore fails
  }
};

/**
 * Get user data from Firestore
 */
export const getUserFromFirestore = async (userId: string): Promise<User | null> => {
  try {
    return await getUserData(userId);
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    return null;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserInFirestore = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const updated = await updateUserProfile(userId, updates);
    if (updated) {
      // Update local storage
      const loggedInUser = getLoggedInUser();
      if (loggedInUser && loggedInUser.id === userId) {
        setLoggedInUser(updated);
      }
    }
    return updated;
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
    return null;
  }
};

/**
 * Get suggested users from Firestore
 */
export const getSuggestedUsers = async (currentUserId: string, limit: number = 5): Promise<User[]> => {
  try {
    return await getSuggestedUsersFirestore(currentUserId, limit);
  } catch (error) {
    console.error('Error getting suggested users:', error);
    return [];
  }
};

/**
 * Search users in Firestore
 */
export const searchUsers = async (query: string, excludeUserId?: string): Promise<User[]> => {
  try {
    if (!query.trim()) return [];
    return await searchUsersFirestore(query, excludeUserId);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Follow a user (Firestore)
 */
export const followUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const success = await followUserFirestore(currentUserId, targetUserId);
    if (success) {
      // Refresh logged in user data
      try {
        const updatedUser = await getUserData(currentUserId);
        if (updatedUser) {
          setLoggedInUser(updatedUser);
        }
      } catch (refreshError) {
        // If refresh fails, update localStorage directly
        const loggedInUser = getLoggedInUser();
        if (loggedInUser && loggedInUser.id === currentUserId) {
          if (!loggedInUser.following.includes(targetUserId)) {
            loggedInUser.following.push(targetUserId);
            setLoggedInUser(loggedInUser);
          }
        }
      }
    } else {
      // Firestore failed, use localStorage fallback
      const loggedInUser = getLoggedInUser();
      if (loggedInUser && loggedInUser.id === currentUserId) {
        if (!loggedInUser.following.includes(targetUserId)) {
          loggedInUser.following.push(targetUserId);
          setLoggedInUser(loggedInUser);
          // Also update in localStorage users array
          const users = getUsers();
          const userIndex = users.findIndex((u: User) => u.id === currentUserId);
          if (userIndex !== -1) {
            users[userIndex].following.push(targetUserId);
            saveUsers(users);
          }
          return true;
        }
      }
    }
    return success;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

/**
 * Unfollow a user (Firestore)
 */
export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const success = await unfollowUserFirestore(currentUserId, targetUserId);
    if (success) {
      // Refresh logged in user data
      try {
        const updatedUser = await getUserData(currentUserId);
        if (updatedUser) {
          setLoggedInUser(updatedUser);
        }
      } catch (refreshError) {
        // If refresh fails, update localStorage directly
        const loggedInUser = getLoggedInUser();
        if (loggedInUser && loggedInUser.id === currentUserId) {
          loggedInUser.following = loggedInUser.following.filter(id => id !== targetUserId);
          setLoggedInUser(loggedInUser);
        }
      }
    } else {
      // Firestore failed, use localStorage fallback
      const loggedInUser = getLoggedInUser();
      if (loggedInUser && loggedInUser.id === currentUserId) {
        loggedInUser.following = loggedInUser.following.filter(id => id !== targetUserId);
        setLoggedInUser(loggedInUser);
        // Also update in localStorage users array
        const users = getUsers();
        const userIndex = users.findIndex((u: User) => u.id === currentUserId);
        if (userIndex !== -1) {
          users[userIndex].following = users[userIndex].following.filter((id: string) => id !== targetUserId);
          saveUsers(users);
        }
        return true;
      }
    }
    return success;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};

/**
 * Check if user is following another user
 */
export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const user = await getUserData(currentUserId);
    return user ? user.following.includes(targetUserId) : false;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

// Local storage settings (still using localStorage for theme/mute preferences)
export const getUserSettings = (userId: string): UserSettings => {
  const settingsStr = localStorage.getItem(`${SETTINGS_KEY}_${userId}`);
  if (settingsStr) {
    return JSON.parse(settingsStr);
  }
  
  // Default settings
  return {
    theme: 'light',
    mutedUsers: [],
  };
};

export const saveUserSettings = (userId: string, settings: UserSettings): void => {
  localStorage.setItem(`${SETTINGS_KEY}_${userId}`, JSON.stringify(settings));
  
  // Apply theme immediately
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
};

export const muteUser = (currentUserId: string, targetUserId: string): void => {
  const settings = getUserSettings(currentUserId);
  if (!settings.mutedUsers.includes(targetUserId)) {
    settings.mutedUsers.push(targetUserId);
    saveUserSettings(currentUserId, settings);
  }
};

export const unmuteUser = (currentUserId: string, targetUserId: string): void => {
  const settings = getUserSettings(currentUserId);
  settings.mutedUsers = settings.mutedUsers.filter(id => id !== targetUserId);
  saveUserSettings(currentUserId, settings);
};

export const isUserMuted = (currentUserId: string, targetUserId: string): boolean => {
  const settings = getUserSettings(currentUserId);
  return settings.mutedUsers.includes(targetUserId);
};
