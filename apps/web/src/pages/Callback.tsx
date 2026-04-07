import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setTokenGetter } from '../api/client';

export function Callback() {
  const { isAuthenticated, isLoading, error, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    setTokenGetter(getAccessTokenSilently);
  }, [isLoading, isAuthenticated, getAccessTokenSilently]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="card p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-text-muted">{error.message}</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Completing authentication...</p>
      </div>
    </div>
  );
}
