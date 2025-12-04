import { useState, useRef } from 'react';
import { GlobalMessage, User } from '../types';
import { sendReply, uploadMedia } from '../services/globalChatService';
import Toast from './Toast';

interface ChatMessageProps {
  message: GlobalMessage;
  loggedInUser: User;
  parentMessage?: GlobalMessage;
  onReplySent: () => void;
}

const ChatMessage = ({ message, loggedInUser, parentMessage, onReplySent }: ChatMessageProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReply = !!message.replyTo;
  const isOwnMessage = message.userId === loggedInUser.id;

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setToast({ message: 'Please select an image or video file', type: 'error' });
      return;
    }

    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setFilePreview(preview);
  };

  const handleRemoveFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() && !selectedFile) {
      setToast({ message: 'Please enter a message or attach media', type: 'error' });
      return;
    }

    setReplying(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: 'image' | 'video' | undefined = undefined;

      if (selectedFile) {
        mediaUrl = await uploadMedia(selectedFile, loggedInUser.id);
        mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      }

      await sendReply(
        loggedInUser.id,
        loggedInUser.username,
        loggedInUser.profilePicture || loggedInUser.avatar,
        replyText,
        message.id,
        mediaUrl,
        mediaType
      );

      setReplyText('');
      handleRemoveFile();
      setShowReplyInput(false);
      setToast({ message: 'Reply sent!', type: 'success' });
      onReplySent();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to send reply', type: 'error' });
    } finally {
      setReplying(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className={`chat-message ${isReply ? 'chat-message-reply' : ''} ${isOwnMessage ? 'chat-message-own' : ''}`}>
        {isReply && parentMessage && (
          <div className="chat-message-parent">
            <span className="chat-message-parent-text">
              Replying to {parentMessage.username}: {parentMessage.text.substring(0, 50)}
              {parentMessage.text.length > 50 ? '...' : ''}
            </span>
          </div>
        )}
        <div className="chat-message-content">
          <img
            src={message.avatar || `https://i.pravatar.cc/150?u=${message.username}`}
            alt={message.username}
            className="chat-message-avatar"
          />
          <div className="chat-message-body">
            <div className="chat-message-header">
              <span className="chat-message-username">{message.username}</span>
              <span className="chat-message-time">{formatTimestamp(message.createdAt)}</span>
            </div>
            {message.text && (
              <div className="chat-message-text">{message.text}</div>
            )}
            {message.mediaUrl && (
              <div className="chat-message-media">
                {message.mediaType === 'image' ? (
                  <img src={message.mediaUrl} alt="Message media" className="chat-media-image" />
                ) : (
                  <video src={message.mediaUrl} controls className="chat-media-video" />
                )}
              </div>
            )}
            {!isReply && (
              <button
                className="chat-message-reply-btn"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                Reply
              </button>
            )}
          </div>
        </div>

        {showReplyInput && (
          <div className="chat-reply-input-container">
            <div className="chat-reply-input-wrapper">
              <input
                type="text"
                className="chat-reply-input"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <div className="chat-reply-actions">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  id={`reply-file-${message.id}`}
                />
                <label htmlFor={`reply-file-${message.id}`} className="chat-attach-btn">
                  📎
                </label>
                {selectedFile && (
                  <div className="chat-file-preview">
                    <span>{selectedFile.name}</span>
                    <button type="button" onClick={handleRemoveFile} className="chat-remove-file">×</button>
                  </div>
                )}
                <button
                  className="chat-send-reply-btn"
                  onClick={handleSendReply}
                  disabled={replying || (!replyText.trim() && !selectedFile)}
                >
                  {replying ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatMessage;

