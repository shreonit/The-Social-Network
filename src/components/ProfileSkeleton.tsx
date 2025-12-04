const ProfileSkeleton = () => {
  return (
    <div className="profile-skeleton">
      <div className="profile-header">
        <div className="profile-top">
          <div className="profile-avatar-container">
            <div className="profile-avatar skeleton-box" />
          </div>
          <div className="profile-info">
            <div className="profile-name-section">
              <div className="skeleton-line short" />
              <div className="skeleton-line shorter" />
            </div>
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      </div>
      <div className="profile-posts">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="post-card skeleton">
            <div className="post-header">
              <div className="avatar skeleton-box" />
              <div className="post-header-text">
                <div className="skeleton-line short" />
                <div className="skeleton-line shorter" />
              </div>
            </div>
            <div className="post-content">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSkeleton;


