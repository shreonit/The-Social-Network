import { User } from '../types';
import { signInWithPopup, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { getUsers, saveUsers, setLoggedInUser as setLocalLoggedInUser } from '../auth';
import { syncUserToFirestore, getUserFromFirestore } from './userService';
import { syncUser } from './cloudflareApi';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Register with email/password
export const registerWithEmail = async (
  userData: Omit<User, 'id' | 'followers' | 'following' | 'createdAt' | 'authMethod'>
): Promise<AuthResult> => {
  try {
    // Set persistence to local (keep user logged in)
    await setPersistence(auth, browserLocalPersistence);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!userData.password) {
      return { success: false, error: 'Password is required' };
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const firebaseUser = userCredential.user;

    // Create user object
    const newUser: User = {
      ...userData,
      id: firebaseUser.uid, // Use Firebase UID as user ID
      followers: [],
      following: [],
      createdAt: new Date().toISOString(),
      authMethod: 'email',
      firebaseUid: firebaseUser.uid,
    };

    // Sync to Cloudflare D1
    let syncedUser = newUser;
    try {
      syncedUser = await syncUser(newUser);
    } catch (syncError) {
      console.error('Error syncing to Cloudflare during registration:', syncError);
      // Continue with newUser even if sync fails
      syncedUser = newUser;
    }

    // Also sync to Firestore (for backward compatibility)
    try {
      syncedUser = await syncUserToFirestore(syncedUser);
    } catch (syncError) {
      console.error('Error syncing to Firestore during registration:', syncError);
    }
    
    // Also save to localStorage for backward compatibility
    const users = getUsers();
    if (!users.find(u => u.id === syncedUser.id)) {
      users.push(syncedUser);
      saveUsers(users);
    }
    
    setLocalLoggedInUser(syncedUser);
    
    return { success: true, user: syncedUser };
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Email already registered' };
    }
    if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password is too weak. Please use a stronger password.' };
    }
    if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email address' };
    }
    return { success: false, error: error.message || 'Registration failed. Please try again.' };
  }
};

// Login with email/password
export const loginWithEmail = async (
  usernameOrEmail: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResult> => {
  try {
    // Set persistence to local (keep user logged in)
    await setPersistence(auth, browserLocalPersistence);

    // First try localStorage (for backward compatibility with old users)
    const users = getUsers();
    let user = users.find(
      u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password
    );

    if (user) {
      // User found in localStorage, sync to Cloudflare D1
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      // Sync to Cloudflare D1
      try {
        user = await syncUser(user);
      } catch (syncError) {
        console.error('Error syncing to Cloudflare:', syncError);
      }

      // Also sync to Firestore (for backward compatibility)
      try {
        user = await syncUserToFirestore(user);
      } catch (syncError) {
        console.error('Error syncing to Firestore:', syncError);
      }

      setLocalLoggedInUser(user);
      return { success: true, user };
    }

    // If not found in localStorage, try Firebase Auth (for new users registered via Firebase)
    if (usernameOrEmail.includes('@')) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          usernameOrEmail,
          password
        );
        const firebaseUser = userCredential.user;
        
        // Get user from Cloudflare D1
        try {
          const cloudflareUser = await syncUser({
            id: firebaseUser.uid,
            username: firebaseUser.email?.split('@')[0] || 'user',
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            profilePicture: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            bio: '',
            followers: [],
            following: [],
            createdAt: new Date().toISOString(),
            authMethod: 'email',
            firebaseUid: firebaseUser.uid,
          });
          user = cloudflareUser;
        } catch (cloudflareError) {
          console.error('Error fetching from Cloudflare, trying Firestore:', cloudflareError);
          // If Cloudflare fails, try Firestore
          try {
            user = await getUserFromFirestore(firebaseUser.uid);
          } catch (firestoreError) {
            console.error('Error fetching from Firestore, trying localStorage:', firestoreError);
            // If Firestore fails, check localStorage
            const localUsers = getUsers();
            user = localUsers.find(u => u.firebaseUid === firebaseUser.uid || u.email === firebaseUser.email);
          }
        }
        
        // If user not found, create a basic user object
        if (!user) {
          user = {
            id: firebaseUser.uid,
            username: firebaseUser.email?.split('@')[0] || 'user',
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            profilePicture: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            bio: '',
            followers: [],
            following: [],
            createdAt: new Date().toISOString(),
            authMethod: 'email',
            firebaseUid: firebaseUser.uid,
          };
          
          // Try to sync to Cloudflare D1
          try {
            user = await syncUser(user);
          } catch (syncError) {
            console.error('Error syncing to Cloudflare:', syncError);
          }

          // Try to sync to Firestore (but don't fail if it doesn't work)
          try {
            await syncUserToFirestore(user);
          } catch (syncError) {
            console.error('Error syncing to Firestore:', syncError);
          }
          
          // Save to localStorage
          const localUsers = getUsers();
          if (!localUsers.find(u => u.id === user!.id)) {
            localUsers.push(user);
            saveUsers(localUsers);
          }
        }
        
        if (user) {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          setLocalLoggedInUser(user);
          return { success: true, user };
        }
      } catch (firebaseError: any) {
        // Firebase Auth failed
        console.error('Firebase Auth login failed:', firebaseError);
        if (firebaseError.code === 'auth/user-not-found') {
          return { success: false, error: 'No account found with this email' };
        }
        if (firebaseError.code === 'auth/wrong-password') {
          return { success: false, error: 'Incorrect password' };
        }
        if (firebaseError.code === 'auth/invalid-email') {
          return { success: false, error: 'Invalid email address' };
        }
        if (firebaseError.code === 'auth/user-disabled') {
          return { success: false, error: 'This account has been disabled' };
        }
        if (firebaseError.code === 'auth/network-request-failed') {
          return { success: false, error: 'Network error. Please check your connection.' };
        }
        // Continue to return error if Firebase fails
        return { success: false, error: firebaseError.message || 'Login failed. Please try again.' };
      }
    }

    return { success: false, error: 'Invalid username/email or password' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'Login failed. Please try again.' };
  }
};

// Login with Google
export const loginWithGoogle = async (): Promise<AuthResult> => {
  try {
    // Set persistence to local (keep user logged in)
    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser: FirebaseUser = result.user;

    if (!firebaseUser.email) {
      return { success: false, error: 'Google account email not available' };
    }

    // Check Cloudflare D1 first
    let user: User | null = null;
    try {
      const cloudflareUser = await syncUser({
        id: firebaseUser.uid,
        username: firebaseUser.email.split('@')[0] + '_' + Date.now().toString().slice(-6),
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        profilePicture: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        bio: '',
        followers: [],
        following: [],
        createdAt: new Date().toISOString(),
        authMethod: 'google',
        firebaseUid: firebaseUser.uid,
      });
      user = cloudflareUser;
    } catch (cloudflareError) {
      console.error('Error fetching from Cloudflare, trying Firestore:', cloudflareError);
      // If Cloudflare fails, try Firestore
      try {
        user = await getUserFromFirestore(firebaseUser.uid);
      } catch (firestoreError) {
        console.error('Error fetching from Firestore, trying localStorage:', firestoreError);
      }
    }

    if (!user) {
      // Check localStorage for backward compatibility
      const users = getUsers();
      user = users.find(u => u.email === firebaseUser.email || u.firebaseUid === firebaseUser.uid);
    }

    if (user) {
      // Update user with latest Google info
      if (firebaseUser.photoURL) {
        user.avatar = firebaseUser.photoURL;
        user.profilePicture = firebaseUser.photoURL;
      }
      if (firebaseUser.displayName) user.displayName = firebaseUser.displayName;
      user.authMethod = 'google';
      user.firebaseUid = firebaseUser.uid;
      
      // Sync to Cloudflare D1
      try {
        user = await syncUser(user);
      } catch (syncError) {
        console.error('Error syncing to Cloudflare:', syncError);
      }

      // Also sync to Firestore (for backward compatibility)
      try {
        user = await syncUserToFirestore(user);
      } catch (syncError) {
        console.error('Error syncing to Firestore:', syncError);
      }
    } else {
      // Create new user from Google account
      const username = firebaseUser.email.split('@')[0] + '_' + Date.now().toString().slice(-6);
      
      user = {
        id: firebaseUser.uid, // Use Firebase UID as user ID
        username,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || username,
        avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${username}`,
        profilePicture: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${username}`,
        bio: '',
        followers: [],
        following: [],
        createdAt: new Date().toISOString(),
        authMethod: 'google',
        firebaseUid: firebaseUser.uid,
      };

      // Sync to Cloudflare D1
      try {
        user = await syncUser(user);
      } catch (syncError) {
        console.error('Error syncing to Cloudflare:', syncError);
      }

      // Also sync to Firestore (for backward compatibility)
      try {
        await syncUserToFirestore(user);
      } catch (syncError) {
        console.error('Error syncing to Firestore:', syncError);
      }
      
      // Also save to localStorage for backward compatibility
      const users = getUsers();
      if (!users.find(u => u.id === user!.id)) {
        users.push(user);
        saveUsers(users);
      }
    }

    setLocalLoggedInUser(user);
    return { success: true, user };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in cancelled' };
    }
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: 'Popup was blocked. Please allow popups and try again.' };
    }
    if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
    if (error.code === 'auth/unauthorized-domain') {
      return { success: false, error: 'Unauthorized domain. Please contact support.' };
    }
    return { 
      success: false, 
      error: error.message || 'Google sign-in failed. Please try again.' 
    };
  }
};

// Logout
export const logout = async () => {
  setLocalLoggedInUser(null);
  localStorage.removeItem('rememberMe');
  // Sign out from Firebase Auth
  try {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

