import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import LoadingScreen from './components/LoadingScreen';
import { PrivacyProvider } from './context/PrivacyContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <PrivacyProvider user={user}>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#fff',
            },
          },
        }}
      />
      {user ? <Dashboard user={user} /> : <Auth />}
    </PrivacyProvider>
  );
}

export default App;
