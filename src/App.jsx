import { useEffect, useState } from 'react';
import { loadAuth, clearAuth } from './auth';
import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import EventPage from './pages/EventPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminPage from './pages/AdminPage';

// Navigation without a router: the current screen is just a piece of state.
// { name: 'events' } | { name: 'event', id } | { name: 'login' } | { name: 'bookings' } | { name: 'admin' }
export default function App() {
  const [user, setUser] = useState(loadAuth);
  const [screen, setScreen] = useState({ name: 'events' });
  // Where to go back to after logging in (for example: the seat map of the event the user was looking at).
  const [returnTo, setReturnTo] = useState({ name: 'events' });

  // Remember the current screen, then show the login screen.
  function goToLogin() {
    if (screen.name !== 'login') {
      setReturnTo(screen);
    }
    setScreen({ name: 'login' });
  }

  // api.js fires this event when the server answers 401 to a request that carried a token.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      goToLogin();
    };
    window.addEventListener('auth-expired', onExpired);
    return () => window.removeEventListener('auth-expired', onExpired);
  });

  function logout() {
    clearAuth();
    setUser(null);
    setScreen({ name: 'events' });
  }

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen({ name: 'events' })}>
          <span className="brand-seat" aria-hidden="true" />Makom
        </button>
        <nav>
          <button onClick={() => setScreen({ name: 'events' })}>Events</button>
          {user && <button onClick={() => setScreen({ name: 'bookings' })}>My bookings</button>}
          {user?.role === 'Admin' && <button onClick={() => setScreen({ name: 'admin' })}>Manage</button>}
          {user ? (
            <>
              <span className="who">{user.fullName}</span>
              <button onClick={logout}>Log out</button>
            </>
          ) : (
            <button className="enter" onClick={goToLogin}>Log in</button>
          )}
        </nav>
      </header>

      <main>
        {screen.name === 'events' && (
          <EventsPage onOpen={(id) => setScreen({ name: 'event', id })} />
        )}
        {screen.name === 'event' && (
          <EventPage
            eventId={screen.id}
            user={user}
            onBack={() => setScreen({ name: 'events' })}
            onLoginNeeded={goToLogin}
          />
        )}
        {screen.name === 'login' && (
          <LoginPage
            onLoggedIn={(auth) => {
              setUser(auth);
              setScreen(returnTo);   // back to where the user was before logging in
            }}
          />
        )}
        {screen.name === 'bookings' && user && <MyBookingsPage />}
        {/* Only for an Admin. The server checks the role too, so hiding the button is not the security. */}
        {screen.name === 'admin' && user?.role === 'Admin' && <AdminPage />}
      </main>
    </>
  );
}
