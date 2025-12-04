import { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { updateUser } from '../auth';
import { updateUserInFirestore } from '../services/userService';
import { convertFileToBase64, isValidImageUrl, isValidImageFile } from '../utils/imageUtils';
import Toast from './Toast';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

const EditProfileModal = ({ user, onClose, onUpdate }: EditProfileModalProps) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [nickname, setNickname] = useState(user.nickname || '');
  const [dob, setDob] = useState(user.dob || '');
  const [address, setAddress] = useState(user.address || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || user.avatar);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Set initial preview
    if (profilePicture) {
      setFilePreview(profilePicture);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Create preview
    const preview = URL.createObjectURL(file);
    setFilePreview(preview);
    setProfilePictureUrl('');
  };

  const handleRemoveFile = () => {
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(profilePicture || avatar);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    setProfilePictureUrl(url);
    if (url.trim()) {
      if (isValidImageUrl(url)) {
        setFilePreview(url);
        setError('');
        // Clear file selection when URL is entered
        if (selectedFile) {
          handleRemoveFile();
        }
      } else {
        setError('Please enter a valid image URL (jpg, jpeg, png, webp)');
      }
    } else {
      setFilePreview(profilePicture || avatar);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      let finalProfilePicture = profilePicture;

      // If file is selected, convert to base64
      if (selectedFile) {
        finalProfilePicture = await convertFileToBase64(selectedFile);
      } 
      // If URL is provided, use it
      else if (profilePictureUrl.trim()) {
        if (!isValidImageUrl(profilePictureUrl)) {
          setError('Please enter a valid image URL');
          setUploading(false);
          return;
        }
        finalProfilePicture = profilePictureUrl.trim();
      }
      // Otherwise keep existing
      else {
        finalProfilePicture = profilePicture || avatar;
      }

      // Update in Firestore
      const updated = await updateUserInFirestore(user.id, {
        displayName,
        nickname: nickname.trim() || undefined,
        dob: dob.trim() || undefined,
        address: address.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: finalProfilePicture,
        profilePicture: finalProfilePicture,
        location: user.location,
        website: user.website,
      });

      // Also update localStorage for backward compatibility
      if (updated) {
        updateUser(user.id, {
          displayName,
          nickname: nickname.trim() || undefined,
          dob: dob.trim() || undefined,
          address: address.trim() || undefined,
          bio: bio.trim() || undefined,
          avatar: finalProfilePicture,
          profilePicture: finalProfilePicture,
          location: user.location,
          website: user.website,
        });
      }

      if (updated) {
        // Cleanup preview URL if it was a blob
        if (filePreview && filePreview.startsWith('blob:')) {
          URL.revokeObjectURL(filePreview);
        }
        setShowToast(true);
        setTimeout(() => {
          onUpdate(updated);
          onClose();
        }, 500);
      } else {
        setError('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Edit Profile</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Profile Picture Section */}
            <div className="form-group">
              <label className="form-label">Profile Picture</label>
              <div className="profile-picture-section">
                {filePreview && (
                  <div className="profile-picture-preview">
                    <img src={filePreview} alt="Profile preview" className="preview-profile-image" />
                  </div>
                )}
                <div className="profile-picture-options">
                  <div className="file-upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="profile-picture-upload"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="file-input"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="profile-picture-upload" className="file-upload-btn">
                      📷 Upload Image
                    </label>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="remove-file-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="media-divider-small">
                    <span>OR</span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paste Image URL (jpg, jpeg, png, webp)"
                    value={profilePictureUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name *</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nickname</label>
              <input
                type="text"
                className="form-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Your nickname (optional)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Your address (optional)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                className="form-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="modal-btn modal-btn-primary" disabled={uploading}>
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showToast && (
        <Toast
          message="Profile updated successfully!"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default EditProfileModal;
