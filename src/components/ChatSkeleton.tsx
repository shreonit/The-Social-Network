const ChatSkeleton = () => {
  return (
    <div className="messages-page">
      <h1 className="page-title">Messages</h1>
      <div className="conversations-list">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="conversation-item skeleton">
            <div className="conversation-avatar">
              <div className="avatar skeleton-box" />
            </div>
            <div className="conversation-content">
              <div className="conversation-header">
                <div className="skeleton-line short" />
                <div className="skeleton-line shorter" />
              </div>
              <div className="conversation-preview">
                <div className="skeleton-line" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSkeleton;


