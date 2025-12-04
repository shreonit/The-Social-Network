import { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { getMessages, sendMessage as sendMessageApi } from '../services/cloudflareApi';
import Toast from '../components/Toast';

interface ConversationViewProps {
  loggedInUser: User;
  conversationId: string;
  otherUser: User;
  onBack: () => void;
}

const ConversationView = ({ loggedInUser, conversationId, otherUser, onBack }: ConversationViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const loadMessages = async () => {
    try {
      const data = await getMessages(conversationId, 100);
      setMessages(data);
      if (loading) setLoading(false);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      if (loading) {
        setToast({ message: error.message || 'Failed to load messages', type: 'error' });
        setLoading(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setToast({ message: 'File size must be less than 10MB', type: 'error' });
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) {
      setToast({ message: 'Please enter a message or attach media', type: 'error' });
      return;
    }

    setSending(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | undefined;

      // For now, we'll convert file to base64 data URL
      // In production, upload to storage first and get URL
      if (selectedFile) {
        const reader = new FileReader();
        mediaUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile!);
        });
        mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      }

      const newMessage = await sendMessageApi(
        conversationId,
        loggedInUser.id,
        messageText.trim() || undefined,
        mediaUrl,
        mediaType
      );

      setMessages([...messages, newMessage]);
      setMessageText('');
      handleRemoveFile();
    } catch (error: any) {
      console.error('Error sending message:', error);
      setToast({ message: error.message || 'Failed to send message', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="conversation-view">
        <div className="conversation-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <div className="conversation-header-user">
            <img
              src={otherUser.profilePicture || `https://i.pravatar.cc/150?u=${otherUser.id}`}
              alt={otherUser.displayName}
              className="conversation-header-avatar"
            />
            <span className="conversation-header-name">{otherUser.displayName}</span>
          </div>
        </div>

        <div className="messages-container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => {
                const isOwn = message.senderId === loggedInUser.id;
                return (
                  <div key={message.id} className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                    {!isOwn && message.sender && (
                      <img
                        src={message.sender.profilePicture || `https://i.pravatar.cc/150?u=${message.sender.id}`}
                        alt={message.sender.name}
                        className="message-avatar"
                      />
                    )}
                    <div className="message-content">
                      {message.mediaUrl && (
                        <div className="message-media">
                          {message.mediaType === 'image' ? (
                            <img src={message.mediaUrl} alt="Shared media" />
                          ) : (
                            <video src={message.mediaUrl} controls />
                          )}
                        </div>
                      )}
                      {message.content && <div className="message-text">{message.content}</div>}
                      <div className="message-time">{formatTime(message.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="message-input-container">
          {filePreview && (
            <div className="file-preview-message">
              {selectedFile?.type.startsWith('image/') ? (
                <img src={filePreview} alt="Preview" />
              ) : (
                <video src={filePreview} controls />
              )}
              <button className="remove-file-btn" onClick={handleRemoveFile}>
                ×
              </button>
            </div>
          )}
          <div className="message-input-row">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="message-file-input"
            />
            <label htmlFor="message-file-input" className="attach-button" title="Attach image or video">
              📎
            </label>
            <textarea
              className="message-input"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={sending || (!messageText.trim() && !selectedFile)}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationView;

