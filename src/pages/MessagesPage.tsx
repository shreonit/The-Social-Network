import { useState, useEffect } from 'react';
import { User, Conversation } from '../types';
import { getConversations } from '../services/cloudflareApi';
import Toast from '../components/Toast';
import ChatSkeleton from '../components/ChatSkeleton';

interface MessagesPageProps {
  loggedInUser: User;
  onOpenConversation: (conversationId: string, otherUser: User) => void;
}

const MessagesPage = ({ loggedInUser, onOpenConversation }: MessagesPageProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadConversations();
    // Poll for new conversations every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loggedInUser]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations(loggedInUser.id);
      setConversations(data);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      setToast({ message: error.message || 'Failed to load conversations', type: 'error' });
    } finally {
      setLoading(false);
    }
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

  const handleConversationClick = (conversation: Conversation) => {
    if (conversation.otherUser) {
      onOpenConversation(conversation.id, conversation.otherUser);
    }
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
      <div className="messages-page">
        <h1 className="page-title">Messages</h1>
        {loading && conversations.length === 0 ? (
          <ChatSkeleton />
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <p>No conversations yet. Start a conversation by messaging someone from their profile!</p>
          </div>
        ) : (
          <div className="conversations-list">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="conversation-item"
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="conversation-avatar">
                  <img
                    src={conversation.otherUser?.profilePicture || `https://i.pravatar.cc/150?u=${conversation.otherUser?.id}`}
                    alt={conversation.otherUser?.name || 'User'}
                  />
                </div>
                <div className="conversation-content">
                  <div className="conversation-header">
                    <span className="conversation-name">{conversation.otherUser?.name || 'Unknown User'}</span>
                    {conversation.lastMessage && (
                      <span className="conversation-time">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="conversation-preview">
                    {conversation.lastMessage ? (
                      conversation.lastMessage.content ? (
                        <span>{conversation.lastMessage.content}</span>
                      ) : (
                        <span className="media-indicator">📎 Media</span>
                      )
                    ) : (
                      <span className="no-messages">No messages yet</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;

