import { useState, useEffect } from 'react';
import { Post, User } from '../types';
import { likePost, unlikePost, createComment, getComments } from '../services/cloudflareApi';
import { notifyLike, notifyComment } from '../services/notificationService';
import { muteUser } from '../services/userService';
import Toast from './Toast';

interface PostCardProps {
  post: Post;
  loggedInUser: User | null;
  onUpdate: () => void;
  onMute?: () => void;
}

const PostCard = ({ post, loggedInUser, onUpdate, onMute }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [isLiked, setIsLiked] = useState(loggedInUser ? post.likes.includes(loggedInUser.id) : false);
  const [likes, setLikes] = useState(post.likes || []);

  useEffect(() => {
    setIsLiked(loggedInUser ? post.likes.includes(loggedInUser.id) : false);
    setLikes(post.likes || []);
    setComments(post.comments || []);
  }, [post, loggedInUser]);

  const handleLike = async () => {
    if (!loggedInUser || liking) return;

    setLiking(true);
    try {
      if (isLiked) {
        await unlikePost(post.id, loggedInUser.id);
        setIsLiked(false);
        setLikes(likes.filter(id => id !== loggedInUser.id));
      } else {
        await likePost(post.id, loggedInUser.id);
        setIsLiked(true);
        setLikes([...likes, loggedInUser.id]);
        
        // Create notification if not own post
        if (post.userId !== loggedInUser.id) {
          notifyLike(post.userId, loggedInUser, post.id);
        }
      }
      onUpdate();
    } catch (error: any) {
      console.error('Error liking post:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleSave = () => {
    if (!loggedInUser) return;
    // Save functionality can be implemented later with Cloudflare
    // For now, just show a message
    alert('Save feature coming soon!');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !commentText.trim() || commenting) return;

    setCommenting(true);
    try {
      const comment = await createComment(post.id, loggedInUser.id, commentText.trim());
      setComments([...comments, comment]);
      
      if (post.userId !== loggedInUser.id) {
        notifyComment(post.userId, loggedInUser, post.id, comment.id);
      }

      setCommentText('');
      onUpdate();
    } catch (error: any) {
      console.error('Error adding comment:', error);
    } finally {
      setCommenting(false);
    }
  };

  const loadComments = async () => {
    if (showComments && comments.length === 0) {
      try {
        const loadedComments = await getComments(post.id);
        setComments(loadedComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    }
  };

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const handleMute = () => {
    if (!loggedInUser || post.userId === loggedInUser.id) return;
    muteUser(loggedInUser.id, post.userId);
    setShowMenu(false);
    if (onMute) onMute();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <img src={post.userAvatar} alt={post.username} className="post-avatar" />
        <div className="post-user-info">
          <div className="post-username">{post.username}</div>
          <div className="post-time">{formatTime(post.createdAt)}</div>
        </div>
        {loggedInUser && post.userId !== loggedInUser.id && (
          <div className="post-menu-container">
            <button
              className="post-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋯
            </button>
            {showMenu && (
              <div className="post-menu-dropdown">
                <button onClick={handleMute} className="post-menu-item">
                  Hide posts from {post.username}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="post-content">
        {post.caption && <div className="post-caption">{post.caption}</div>}
        {post.mediaUrl && (
          <div className="post-media">
            {post.mediaType === 'video' ? (
              <video src={post.mediaUrl} controls />
            ) : (
              <img src={post.mediaUrl} alt="Post media" />
            )}
          </div>
        )}
      </div>
      {loggedInUser && (
        <>
          <div className="post-actions">
            <button
              className={`post-action-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={liking}
            >
              <span className="post-action-icon">{isLiked ? '❤️' : '🤍'}</span>
              <span>{likes.length}</span>
            </button>
            <button
              className="post-action-btn"
              onClick={() => setShowComments(!showComments)}
            >
              <span className="post-action-icon">💬</span>
              <span>{comments.length}</span>
            </button>
            <button
              className="post-action-btn"
              onClick={handleSave}
            >
              <span className="post-action-icon">📑</span>
              <span>Save</span>
            </button>
          </div>
          {showComments && (
            <div className="comments-section">
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <span className="comment-username">{comment.username}</span>
                    <span className="comment-text">{comment.text}</span>
                    <div className="comment-time">{formatTime(comment.createdAt)}</div>
                  </div>
                ))}
              </div>
              <form className="add-comment" onSubmit={handleAddComment}>
                <input
                  type="text"
                  className="comment-input"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={commenting}
                />
                <button type="submit" className="comment-submit-btn" disabled={commenting}>
                  {commenting ? 'Posting...' : 'Post'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostCard;
