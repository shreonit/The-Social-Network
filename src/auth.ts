import { User } from './types';
import { initializeMockData } from './mockData';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { syncUser } from './services/cloudflareApi';

// Initialize mock data on first load
initializeMockData();

export const getUsers = (): User[] => {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
};

export const getPosts = () => {
  const posts = localStorage.getItem('posts');
  return posts ? JSON.parse(posts) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem('users', JSON.stringify(users));
};

export const savePosts = (posts: any[]) => {
  localStorage.setItem('posts', JSON.stringify(posts));
};

export const getLoggedInUser = (): User | null => {
  const userStr = localStorage.getItem('loggedInUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const setLoggedInUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('loggedInUser');
  }
};

export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return null;

  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);
  
  // Update logged in user if it's the same user
  const loggedInUser = getLoggedInUser();
  if (loggedInUser && loggedInUser.id === userId) {
    setLoggedInUser(users[userIndex]);
  }

  return users[userIndex];
};

/**
 * Initialize Firebase auth state listener for persistent login
 * This ensures users stay logged in across page refreshes
 */
export const initAuthState = (onUserChange: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // User is signed in
      try {
        // Get user from localStorage first (for quick restore)
        let user = getLoggedInUser();
        
        // If user exists and matches Firebase UID, use it
        if (user && (user.id === firebaseUser.uid || user.firebaseUid === firebaseUser.uid)) {
          // Sync with Cloudflare D1
          try {
            user = await syncUser(user);
            setLoggedInUser(user);
          } catch (error) {
            console.error('Error syncing user to Cloudflare:', error);
            // Continue with local user if sync fails
          }
          onUserChange(user);
          return;
        }

        // Create user object from Firebase user
        const email = firebaseUser.email || '';
        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6);
        
        user = {
          id: firebaseUser.uid,
          username,
          email,
          displayName: firebaseUser.displayName || username,
          avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
          profilePicture: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
          bio: '',
          followers: [],
          following: [],
          createdAt: new Date().toISOString(),
          authMethod: 'google',
          firebaseUid: firebaseUser.uid,
        };

        // Sync with Cloudflare D1
        try {
          user = await syncUser(user);
        } catch (error) {
          console.error('Error syncing user to Cloudflare:', error);
        }

        setLoggedInUser(user);
        onUserChange(user);
      } catch (error) {
        console.error('Error initializing auth state:', error);
        onUserChange(null);
      }
    } else {
      // User is signed out
      setLoggedInUser(null);
      onUserChange(null);
    }
  });
};

