import * as React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { resetPassword } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        resetPassword(email, password);
        setSuccess('Password reset successfully. You can now login.');
        setIsForgotPassword(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || (isForgotPassword ? 'Failed to reset password' : 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isForgotPassword ? 'Reset Password' : 'Login'}
          </CardTitle>
          <p className="text-center text-sm text-gray-500">
            {isForgotPassword 
              ? 'Enter your email and a new password' 
              : 'Enter your email and password to access your account'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            {isForgotPassword ? (
              <>
                <Input
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isForgotPassword ? 'Resetting...' : 'Logging in...'}
                </>
              ) : (
                isForgotPassword ? 'Reset Password' : 'Login'
              )}
            </Button>
            
            {isForgotPassword && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full mt-2" 
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
              >
                Back to Login
              </Button>
            )}
          </form>
          
          {!isForgotPassword && (
            <div className="mt-4 text-center text-sm">
               <p className="text-gray-500">
                 Don't have an account?{' '}
                 <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                   Sign up
                 </Link>
               </p>
               <div className="mt-4 text-xs text-gray-400">
                 <p>Demo Admin: admin@example.com / admin123</p>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
