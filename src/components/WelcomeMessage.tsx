import { User } from '../types';

interface WelcomeMessageProps {
  user: User;
  onClose: () => void;
}

const WelcomeMessage = ({ user, onClose }: WelcomeMessageProps) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal welcome-modal" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-content">
          <h2 className="welcome-title">🎉 Welcome to SOCIATE, {user.displayName}!</h2>
          <p className="welcome-text">
            Your account has been created successfully. To get the most out of SOCIATE, 
            we recommend completing your profile.
          </p>
          <div className="welcome-steps">
            <div className="welcome-step">
              <span className="welcome-step-icon">📝</span>
              <span>Add your nickname, bio, and other details</span>
            </div>
            <div className="welcome-step">
              <span className="welcome-step-icon">📷</span>
              <span>Upload a profile picture</span>
            </div>
            <div className="welcome-step">
              <span className="welcome-step-icon">✨</span>
              <span>Start sharing your first post!</span>
            </div>
          </div>
          <button className="btn welcome-btn" onClick={onClose}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;

