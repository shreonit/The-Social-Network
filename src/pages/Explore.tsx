import { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { getSuggestedUsers, searchUsers, followUser, unfollowUser } from '../services/userService';
import { getPublicPosts } from '../services/postService';
import { getLoggedInUser, setLoggedInUser } from '../auth';
import { notifyFollow } from '../services/notificationService';
import PostCard from '../components/PostCard';
import Toast from '../components/Toast';

interface ExploreProps {
  loggedInUser: User;
}

const Explore = ({ loggedInUser }: ExploreProps) => {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(loggedInUser);

  useEffect(() => {
    loadSuggestions();
    loadPublicPosts();
    refreshUserData();
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many queries
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentUser(loggedInUser);
  }, [loggedInUser]);

  const refreshUserData = async () => {
    const updated = getLoggedInUser();
    if (updated) {
      setCurrentUser(updated);
    }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const suggestions = await getSuggestedUsers(currentUser.id, 5);
      setSuggestedUsers(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await searchUsers(searchQuery, currentUser.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicPosts = () => {
    const posts = getPublicPosts(currentUser.id);
    setPublicPosts(posts.slice(0, 10)); // Show first 10 public posts
  };

  const handleFollow = async (targetUserId: string, targetUsername: string) => {
    const wasFollowing = currentUser.following.includes(targetUserId);
    
    try {
      if (wasFollowing) {
        await unfollowUser(currentUser.id, targetUserId);
        setToast({ message: `Unfollowed ${targetUsername}`, type: 'success' });
      } else {
        await followUser(currentUser.id, targetUserId);
        notifyFollow(targetUserId, currentUser);
        setToast({ message: `You are now following ${targetUsername}`, type: 'success' });
      }
      
      // Refresh user data and suggestions
      await refreshUserData();
      const updated = getLoggedInUser();
      if (updated) {
        setCurrentUser(updated);
        setLoggedInUser(updated);
      }
      loadSuggestions();
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      setToast({ message: 'Failed to update follow status', type: 'error' });
    }
  };

  const displayUsers = searchQuery.trim() ? searchResults : suggestedUsers;

  return (
    <div className="container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="explore-container">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search users by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="explore-tabs">
          <button
            className={`explore-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            People
          </button>
          <button
            className={`explore-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Public Posts
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="users-section">
            <h2 className="section-title">
              {searchQuery.trim() ? 'Search Results' : 'People you may want to follow'}
            </h2>
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div>
            ) : (
              <div className="users-list">
                {displayUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>No users found.</p>
                  </div>
                ) : (
                  displayUsers.map((user) => {
                    const isFollowing = currentUser.following.includes(user.id);
                    return (
                      <div key={user.id} className="user-card">
                        <img 
                          src={user.profilePicture || user.avatar} 
                          alt={user.displayName} 
                          className="user-avatar" 
                        />
                        <div className="user-info">
                          <div className="user-name">{user.displayName}</div>
                          <div className="user-username">@{user.username}</div>
                          {user.bio && <div className="user-bio">{user.bio}</div>}
                        </div>
                        <button
                          className={`follow-btn ${isFollowing ? 'following' : ''}`}
                          onClick={() => handleFollow(user.id, user.username)}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="posts-section">
            <h2 className="section-title">Public Posts</h2>
            {publicPosts.length === 0 ? (
              <div className="empty-state">
                <p>No public posts available.</p>
              </div>
            ) : (
              <div className="posts-feed">
                {publicPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    loggedInUser={currentUser}
                    onUpdate={loadPublicPosts}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
