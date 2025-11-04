import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuthCallback() {
      // Get the hash fragment from the URL
      const hashFragment = window.location.hash;

      if (hashFragment && hashFragment.length > 0) {
        try {
          // Exchange the auth code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment);

          if (error) {
            console.error('Error exchanging code for session:', error.message);
            navigate('/login?error=' + encodeURIComponent(error.message));
            return;
          }

          if (data.session) {
            // Successfully signed in, redirect to dashboard
            navigate('/dashboard');
            return;
          }
        } catch (error: any) {
          console.error('Callback error:', error);
          navigate('/login?error=Authentication failed');
        }
      } else {
        // No hash fragment, redirect to login
        navigate('/login?error=No session found');
      }
    }

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Завершение входа...</p>
      </div>
    </div>
  );
}
