import { useState } from 'react';
import { User } from '../types';
import { loginWithEmail, loginWithGoogle } from '../services/authService';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
}

const Login = ({ onLogin, onSwitchToRegister }: LoginProps) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!usernameOrEmail || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await loginWithEmail(usernameOrEmail, password, rememberMe);
    setLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    const result = await loginWithGoogle();
    setGoogleLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error || 'Google sign-in failed');
    }
  };

  return (
    <div className="container">
      <div className="auth-container">
        <h1 className="auth-title">Login to SOCIATE</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input
              type="text"
              className="form-input"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Enter username or email"
              disabled={loading || googleLoading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading || googleLoading}
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading || googleLoading}
              />
              <span>Remember me</span>
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn" disabled={loading || googleLoading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          className="btn btn-google"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
        >
          {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
        </button>

        <div className="auth-link">
          Don't have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>
            Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
