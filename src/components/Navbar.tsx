import { User } from '../types';
import Notifications from './Notifications';
import ThemeToggle from './ThemeToggle';
import NavItem from './NavItem';

interface NavbarProps {
  currentPage: string;
  loggedInUser: User | null;
  onPageChange: (page: 'home' | 'explore' | 'profile' | 'messages' | 'conversation' | 'login' | 'register' | 'settings' | 'about' | 'terms' | 'privacy', userId?: string) => void;
  onLogout: () => void;
}

const Navbar = ({ currentPage, loggedInUser, onPageChange, onLogout }: NavbarProps) => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); onPageChange('home'); }}>
          SOCIATE
        </a>
        <div className="navbar-links">
          <NavItem
            label="Home"
            isActive={currentPage === 'home'}
            onClick={() => onPageChange('home')}
          />
          {loggedInUser && (
            <>
              <NavItem
                label="Explore"
                isActive={currentPage === 'explore'}
                onClick={() => onPageChange('explore')}
              />
              <NavItem
                label="Profile"
                isActive={currentPage === 'profile'}
                onClick={() => onPageChange('profile')}
              />
              <NavItem
                label="Messages"
                isActive={currentPage === 'messages' || currentPage === 'conversation'}
                onClick={() => onPageChange('messages')}
              />
              <Notifications loggedInUser={loggedInUser} />
              <NavItem
                label="Settings"
                isActive={currentPage === 'settings'}
                onClick={() => onPageChange('settings')}
              />
            </>
          )}
          <ThemeToggle />
          {loggedInUser ? (
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <NavItem
              label="Login"
              isActive={currentPage === 'login'}
              onClick={() => onPageChange('login')}
            />
          )}
        </div>
      </div>
      <div className="navbar-footer">
        <a href="#" onClick={(e) => { e.preventDefault(); onPageChange('about'); }}>About</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onPageChange('terms'); }}>Terms</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onPageChange('privacy'); }}>Privacy</a>
      </div>
    </nav>
  );
};

export default Navbar;
