import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService, User } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authCheckComplete = false;

    const checkAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (authCheckComplete) return;

      try {
        const currentUser = await AuthService.getCurrentUser();

        if (mounted) {
          if (currentUser) {
            setUser(currentUser.profile);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
          setIsLoading(false);
          authCheckComplete = true;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          authCheckComplete = true;
        }
      }
    };

    checkAuth();

    // Set a fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && !authCheckComplete) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []); // Empty dependency array - only run once on mount

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(0,171,174)]"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
          <p className="mt-2 text-sm text-gray-400">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Redirecting to login - not authenticated');
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && !user?.isSuperAdmin) {
    console.log('Access denied - super admin required');
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-thin text-gray-600 mb-4">Access Denied</h2>
          <p className="text-gray-500 mb-4">Super admin privileges required</p>
        </div>
      </div>
    );
  }

  console.log('Rendering protected content for user:', user?.email);
  return <>{children}</>;
}