import { useState, useEffect, lazy, Suspense } from 'react';
import { User } from './types';
import { getLoggedInUser, setLoggedInUser, initAuthState } from './auth';
import { getUserSettings } from './services/userService';
import Navbar from './components/Navbar';
import WelcomeMessage from './components/WelcomeMessage';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import ConversationView from './pages/ConversationView';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

type Page = 'home' | 'explore' | 'profile' | 'messages' | 'conversation' | 'login' | 'register' | 'settings' | 'about' | 'terms' | 'privacy';

const MessagesPageLazy = lazy(() => import('./pages/MessagesPage'));

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [loggedInUser, setLoggedInUserState] = useState<User | null>(null);
  const [themeInitialized, setThemeInitialized] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationOtherUser, setConversationOtherUser] = useState<User | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }

    // Initialize Firebase auth state listener for persistent login
    const unsubscribe = initAuthState((user) => {
      setLoggedInUserState(user);
      if (user) {
        const settings = getUserSettings(user.id);
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark-theme');
          localStorage.setItem('theme', 'dark');
        }
      }
    });

    // Also check user settings for theme (for backward compatibility)
    const user = getLoggedInUser();
    if (user) {
      const settings = getUserSettings(user.id);
      if (settings.theme === 'dark' && savedTheme !== 'dark') {
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      }
    }
    setThemeInitialized(true);

    // Check URL for profile or conversation routes
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const username = urlParams.get('username');
    const convId = urlParams.get('conversationId');
    
    if (userId || username) {
      setProfileUserId(userId || username || null);
      setCurrentPage('profile');
    }
    if (convId) {
      setConversationId(convId);
      setCurrentPage('conversation');
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogin = (user: User) => {
    setLoggedInUser(user);
    setLoggedInUserState(user);
    
    // Check if we should show welcome message
    const showWelcomeFlag = localStorage.getItem('showWelcomeMessage');
    if (showWelcomeFlag === 'true') {
      setShowWelcome(true);
      localStorage.removeItem('showWelcomeMessage');
    }
    
    // Apply user's theme preference
    const settings = getUserSettings(user.id);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setLoggedInUserState(null);
    document.documentElement.classList.remove('dark-theme');
    setCurrentPage('home');
  };

  const handlePageChange = (page: Page, userId?: string) => {
    // Protect routes
    if ((page === 'profile' || page === 'explore' || page === 'settings' || page === 'messages' || page === 'conversation') && !loggedInUser) {
      setCurrentPage('login');
      return;
    }
    if (page === 'profile' && userId) {
      setProfileUserId(userId);
    }
    setCurrentPage(page);
  };

  const handleOpenConversation = (convId: string, otherUser: User) => {
    setConversationId(convId);
    setConversationOtherUser(otherUser);
    setCurrentPage('conversation');
  };

  const handleBackFromConversation = () => {
    setConversationId(null);
    setConversationOtherUser(null);
    setCurrentPage('messages');
  };

  const handleThemeChange = () => {
    // Theme is already applied by Settings component
    // This is just to trigger a re-render if needed
    const user = getLoggedInUser();
    if (user) {
      const settings = getUserSettings(user.id);
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home loggedInUser={loggedInUser} />;
      case 'explore':
        return loggedInUser ? <Explore loggedInUser={loggedInUser} /> : <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentPage('register')} />;
      case 'profile':
        return <Profile 
          loggedInUser={loggedInUser} 
          viewingUserId={profileUserId}
          onUserUpdate={setLoggedInUserState}
          onNavigateToMessages={(conversationId, otherUser) => {
            setConversationId(conversationId);
            setConversationOtherUser(otherUser);
            setCurrentPage('conversation');
          }}
        />;
      case 'messages':
        return loggedInUser ? (
          <Suspense fallback={<div className="loading-container"><div className="spinner"></div></div>}>
            <MessagesPageLazy loggedInUser={loggedInUser} onOpenConversation={handleOpenConversation} />
          </Suspense>
        ) : (
          <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentPage('register')} />
        );
      case 'conversation':
        return loggedInUser && conversationId && conversationOtherUser ? (
          <ConversationView
            loggedInUser={loggedInUser}
            conversationId={conversationId}
            otherUser={conversationOtherUser}
            onBack={handleBackFromConversation}
          />
        ) : loggedInUser ? (
          <Suspense fallback={<div className="loading-container"><div className="spinner"></div></div>}>
            <MessagesPageLazy loggedInUser={loggedInUser} onOpenConversation={handleOpenConversation} />
          </Suspense>
        ) : (
          <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentPage('register')} />
        );
      case 'login':
        return <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentPage('register')} />;
      case 'register':
        return <Register onRegister={handleLogin} onSwitchToLogin={() => setCurrentPage('login')} />;
      case 'settings':
        return loggedInUser ? <Settings loggedInUser={loggedInUser} onLogout={handleLogout} onThemeChange={handleThemeChange} /> : <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentPage('register')} />;
      case 'about':
        return <About />;
      case 'terms':
        return <Terms />;
      case 'privacy':
        return <Privacy />;
      default:
        return <Home loggedInUser={loggedInUser} />;
    }
  };

  if (!themeInitialized) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="App">
      <Navbar
        currentPage={currentPage}
        loggedInUser={loggedInUser}
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      />
      {renderPage()}
      {showWelcome && loggedInUser && (
        <WelcomeMessage
          user={loggedInUser}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
}

export default App;
