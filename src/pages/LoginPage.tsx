import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AuthService } from '../utils/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.signIn(email.trim(), password);
      
      console.log('Login successful:', {
        email: result.user.email,
        role: result.profile.role,
        isSuperAdmin: result.profile.isSuperAdmin
      });

      // Navigate to main app
      navigate('/');
      
    } catch (error: any) {
      console.error('Login failed:', error);
      
      if (error?.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (error?.message?.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account before signing in.');
      } else if (error?.message?.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else {
        setError(error?.message || 'An error occurred during sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <img 
            src="https://qaurtile.com/wp-content/uploads/2021/12/qaurtile-logo.png" 
            alt="Quartile Logo" 
            className="max-h-16 w-auto mx-auto mb-6 object-contain"
          />
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield size={20} strokeWidth={1.5} className="text-[rgb(0,171,174)]" />
            <h1 className="text-2xl font-thin text-gray-800 tracking-wide">
              Admin Portal
            </h1>
          </div>
          <p className="text-sm font-light text-gray-500">
            Smart Prediction Model - Intelligence Center
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg font-light text-gray-800 text-center">
              Sign In to Continue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-white border-gray-200 focus:border-[rgb(0,171,174)] focus:ring-[rgb(0,171,174)]/20 pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)] text-white font-medium py-3 transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <LogIn size={16} strokeWidth={1.5} />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center font-light">
                Authorized personnel only. This system is monitored and protected.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400 font-light">
            © {new Date().getFullYear()} Quartile. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}