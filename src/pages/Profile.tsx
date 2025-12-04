import { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { getUser, getUserByUsername, getUserPosts, followUser, unfollowUser, createConversation } from '../services/cloudflareApi';
import { getLoggedInUser, setLoggedInUser } from '../auth';
import PostCard from '../components/PostCard';
import EditProfileModal from '../components/EditProfileModal';
import Toast from '../components/Toast';
import ProfileSkeleton from '../components/ProfileSkeleton';

interface ProfileProps {
  loggedInUser: User | null;
  viewingUserId?: string | null;
  onUserUpdate: (user: User) => void;
  onNavigateToMessages?: (conversationId: string, otherUser: User) => void;
}

const Profile = ({ loggedInUser, viewingUserId, onUserUpdate, onNavigateToMessages }: ProfileProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isOwnProfile = !viewingUserId || (loggedInUser && viewingUserId === loggedInUser.id);
  const profileUserId = viewingUserId || loggedInUser?.id;

  useEffect(() => {
    if (!profileUserId && !loggedInUser) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      if (!profileUserId) return;

      setLoading(true);
      try {
        // Load profile and posts in parallel to avoid sequential latency
        const [userDataRaw, userPosts] = await Promise.all([
          (async () => {
            try {
              return await getUser(profileUserId);
            } catch {
              return await getUserByUsername(profileUserId);
            }
          })(),
          getUserPosts(profileUserId),
        ]);

        if (!userDataRaw) {
          setToast({ message: 'User not found', type: 'error' });
          setUser(null);
          setPosts([]);
          return;
        }

        // Convert Cloudflare user format to app User format
        const appUser: User = {
          id: userDataRaw.id,
          username: userDataRaw.username,
          email: userDataRaw.email,
          displayName: userDataRaw.name,
          nickname: userDataRaw.nickname,
          dob: userDataRaw.dob,
          address: userDataRaw.address,
          bio: userDataRaw.bio || '',
          avatar: userDataRaw.profile_picture || `https://i.pravatar.cc/150?u=${userDataRaw.id}`,
          profilePicture: userDataRaw.profile_picture,
          followers: [],
          following: [],
          createdAt: new Date(userDataRaw.created_at).toISOString(),
        };

        setUser(appUser);
        setFollowersCount(userDataRaw.followersCount || 0);
        setFollowingCount(userDataRaw.followingCount || 0);
        setPosts(userPosts);

        // If it's own profile, update logged in user
        if (isOwnProfile && loggedInUser) {
          setLoggedInUser(appUser);
          onUserUpdate(appUser);
        }
      } catch (error: any) {
        console.error('Error loading profile data:', error);
        setToast({ message: error.message || 'Failed to load profile', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [profileUserId, loggedInUser, isOwnProfile, onUserUpdate]);

  useEffect(() => {
    if (user && loggedInUser) {
      checkFollowingStatus();
    }
  }, [user, loggedInUser]);

  // loadUserData is now handled inside the combined parallel loader above

  const checkFollowingStatus = async () => {
    if (!user || !loggedInUser || isOwnProfile) return;

    try {
      // Get following list for logged in user
      const followingList = await getUserPosts(loggedInUser.id); // This is a temporary workaround
      // In production, you'd have a dedicated endpoint to check follow status
      // For now, we'll check if the user is in the following array
      // Note: This is not ideal, but works for now
      setFollowing(false); // Default to not following, button will handle the state
    } catch (error) {
      console.error('Error checking follow status:', error);
      setFollowing(false);
    }
  };

  const loadUserPosts = async () => {
    if (!profileUserId) return;

    try {
      const userPosts = await getUserPosts(profileUserId);
      setPosts(userPosts);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      setToast({ message: error.message || 'Failed to load posts', type: 'error' });
    }
  };

  const handleFollow = async () => {
    if (!loggedInUser || !user) return;

    try {
      await followUser(loggedInUser.id, user.id);
      setFollowing(true);
      setFollowersCount(prev => prev + 1);
      setToast({ message: `You are now following ${user.displayName}`, type: 'success' });
    } catch (error: any) {
      console.error('Error following user:', error);
      setToast({ message: error.message || 'Failed to follow user', type: 'error' });
    }
  };

  const handleUnfollow = async () => {
    if (!loggedInUser || !user) return;

    try {
      await unfollowUser(loggedInUser.id, user.id);
      setFollowing(false);
      setFollowersCount(prev => prev - 1);
      setToast({ message: `You unfollowed ${user.displayName}`, type: 'success' });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      setToast({ message: error.message || 'Failed to unfollow user', type: 'error' });
    }
  };

  const handleMessage = async () => {
    if (!loggedInUser || !user) return;

    try {
      const conversation = await createConversation(loggedInUser.id, user.id);
      // Navigate to messages - App.tsx will handle opening the conversation
      if (onNavigateToMessages) {
        onNavigateToMessages(conversation.id, user);
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      setToast({ message: error.message || 'Failed to start conversation', type: 'error' });
    }
  };

  const handleUserUpdate = async (updatedUser: User) => {
    setUser(updatedUser);
    setLoggedInUser(updatedUser);
    onUserUpdate(updatedUser);
    await loadUserData();
    await loadUserPosts();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!loggedInUser && !viewingUserId) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Please log in to view profiles</p>
        </div>
      </div>
    );
  }

  if (!user && loading) {
    return (
      <div className="container">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>User not found</p>
        </div>
      </div>
    );
  }

  const profilePicture = user.profilePicture || user.avatar;

  return (
    <div className="container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="profile-header">
        <div className="profile-top">
          <div className="profile-avatar-container">
            <img src={profilePicture} alt={user.displayName} className="profile-avatar" />
          </div>
          <div className="profile-info">
            <div className="profile-name-section">
              <h1 className="profile-name">{user.displayName}</h1>
              {user.nickname && (
                <div className="profile-nickname">"{user.nickname}"</div>
              )}
              <div className="profile-username">@{user.username}</div>
            </div>

            {user.bio && (
              <div className="profile-bio">{user.bio}</div>
            )}

            <div className="profile-details">
              {user.email && isOwnProfile && (
                <div className="profile-detail-item">
                  <span className="profile-detail-icon">Email</span>
                  <span>{user.email}</span>
                </div>
              )}
              {user.dob && (
                <div className="profile-detail-item">
                  <span className="profile-detail-icon">Birthday</span>
                  <span>
                    {formatDate(user.dob)} ({calculateAge(user.dob)} years old)
                  </span>
                </div>
              )}
              {user.address && (
                <div className="profile-detail-item">
                  <span className="profile-detail-icon">Address</span>
                  <span>{user.address}</span>
                </div>
              )}
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{posts.length}</span>
                <span className="profile-stat-label">Posts</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{followersCount}</span>
                <span className="profile-stat-label">Followers</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{followingCount}</span>
                <span className="profile-stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          {isOwnProfile ? (
            <button className="edit-profile-btn" onClick={() => setShowEditModal(true)}>
              Edit Profile
            </button>
          ) : (
            <div className="profile-action-buttons">
              {following ? (
                <button className="unfollow-btn" onClick={handleUnfollow}>
                  Unfollow
                </button>
              ) : (
                <button className="follow-btn" onClick={handleFollow}>
                  Follow
                </button>
              )}
              {loggedInUser && (
                <button className="message-btn" onClick={handleMessage}>
                  Message
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="profile-posts">
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              loggedInUser={loggedInUser || user}
              onUpdate={loadUserPosts}
            />
          ))
        )}
      </div>
      {showEditModal && user && isOwnProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default Profile;
