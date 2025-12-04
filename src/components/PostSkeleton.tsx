const PostSkeleton = () => {
  return (
    <div className="post-card skeleton">
      <div className="post-header">
        <div className="avatar skeleton-box" />
        <div className="post-header-text">
          <div className="skeleton-line short" />
          <div className="skeleton-line shorter" />
        </div>
      </div>
      <div className="post-content">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
      <div className="post-media skeleton-box" />
      <div className="post-footer">
        <div className="skeleton-line shorter" />
      </div>
    </div>
  );
};

export default PostSkeleton;


