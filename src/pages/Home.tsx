import { useState, useEffect, useRef } from 'react';
import { User, Post } from '../types';
import { getFeed, createPost as createPostApi } from '../services/cloudflareApi';
import PostCard from '../components/PostCard';
import Toast from '../components/Toast';
import PostSkeleton from '../components/PostSkeleton';

interface HomeProps {
  loggedInUser: User | null;
}

const Home = ({ loggedInUser }: HomeProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load feed after initial render without blocking first paint
    const load = async () => {
      setLoading(true);
      try {
        // In future we could parallelize more calls here via Promise.all([])
        const [feedPosts] = await Promise.all([getFeed(loggedInUser?.id)]);
        setPosts(feedPosts);
      } catch (error: any) {
        console.error('Error loading posts:', error);
        setToast({ message: error.message || 'Failed to load posts', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [loggedInUser]);

  const loadPosts = async () => {
    // Reuse the same loading behavior for refreshes
    setLoading(true);
    try {
      const feedPosts = await getFeed(loggedInUser?.id);
      setPosts(feedPosts);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      setToast({ message: error.message || 'Failed to load posts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Validate file size (max 5MB for localStorage compatibility)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB for best performance. Large files may cause issues with localStorage.');
      return;
    }

    setSelectedFile(file);
    setMediaType(isImage ? 'image' : 'video');
    
    // Create preview
    const preview = URL.createObjectURL(file);
    setFilePreview(preview);
    
    // Clear URL input when file is selected
    setMediaUrl('');
  };

  const handleRemoveFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;

    if (!caption.trim() && !mediaUrl.trim() && !selectedFile) {
      setToast({ message: 'Please add a caption or media', type: 'error' });
      return;
    }

    setUploading(true);

    try {
      let finalMediaUrl = mediaUrl.trim();
      let finalMediaType = mediaType;

      // If file is selected, convert to base64
      if (selectedFile) {
        finalMediaUrl = await convertFileToBase64(selectedFile);
        finalMediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      }

      await createPostApi({
        authorId: loggedInUser.id,
        caption: caption.trim() || undefined,
        mediaUrl: finalMediaUrl || undefined,
        mediaType: finalMediaUrl ? finalMediaType : undefined,
      });

      // Cleanup
      setCaption('');
      setMediaUrl('');
      setMediaType('image');
      handleRemoveFile();
      await loadPosts();
      setToast({ message: 'Post created successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error creating post:', error);
      setToast({ message: error.message || 'Failed to create post. Please try again.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const detectMediaType = (url: string): 'image' | 'video' => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ? 'video' : 'image';
  };

  const handleMediaUrlChange = (url: string) => {
    setMediaUrl(url);
    if (url.trim()) {
      setMediaType(detectMediaType(url));
    }
    // Clear file selection when URL is entered
    if (url.trim() && selectedFile) {
      handleRemoveFile();
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  if (!loggedInUser) {
    return (
      <div className="container">
        <div className="landing-page">
          <h1>Welcome to SOCIATE</h1>
          <p className="landing-description">
            Connect with friends, share your moments, and discover amazing content.
            Join SOCIATE today and be part of a vibrant community.
          </p>
          <div className="landing-features">
            <div className="landing-feature">
              <h3>Share Moments</h3>
              <p>Post photos, videos, and updates with your network</p>
            </div>
            <div className="landing-feature">
              <h3>Connect</h3>
              <p>Follow friends and discover new people</p>
            </div>
            <div className="landing-feature">
              <h3>Engage</h3>
              <p>Like, comment, and interact with content</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {loggedInUser && (
        <div className="create-post">
          <h2 className="create-post-title">Create Post</h2>
          <form className="create-post-form" onSubmit={handleCreatePost}>
            <textarea
              className="create-post-input"
              placeholder="What's on your mind?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            
            {/* File Upload Section */}
            <div className="media-upload-section">
              <div className="file-upload-container">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="media-upload"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="file-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="media-upload" className="file-upload-btn">
                  Upload Photo/Video
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="remove-file-btn"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* File Preview */}
              {filePreview && (
                <div className="file-preview">
                  {mediaType === 'image' ? (
                    <img src={filePreview} alt="Preview" className="preview-image" />
                  ) : (
                    <video src={filePreview} controls className="preview-video" />
                  )}
                  <div className="file-info">
                    <span className="file-name">{selectedFile?.name}</span>
                    <span className="file-size">{(selectedFile?.size! / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              )}

              {/* OR Divider */}
              {!selectedFile && (
                <div className="media-divider">
                  <span>OR</span>
                </div>
              )}

              {/* URL Input (only show if no file selected) */}
              {!selectedFile && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Or paste Image/Video URL (optional)"
                  value={mediaUrl}
                  onChange={(e) => handleMediaUrlChange(e.target.value)}
                />
              )}
            </div>

            <button 
              type="submit" 
              className="create-post-btn"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Post'}
            </button>
          </form>
        </div>
      )}
      <div className="posts-feed">
        {loading && posts.length === 0 ? (
          <>
            {Array.from({ length: 3 }).map((_, idx) => (
              <PostSkeleton key={idx} />
            ))}
          </>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>
              {loggedInUser 
                ? loggedInUser.following.length === 0 
                  ? "No posts yet. Follow some users to see their posts, or create your first post!" 
                  : "No posts from people you follow yet. Create your first post!"
                : 'No posts yet. Log in to create posts.'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              loggedInUser={loggedInUser}
              onUpdate={loadPosts}
              onMute={loadPosts}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
