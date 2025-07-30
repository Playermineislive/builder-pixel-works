import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, MessageCircle, Lock } from 'lucide-react';

export default function Auth() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = isLogin 
        ? await login(email, password)
        : await signup(email, password);

      if (!result.success) {
        setError(result.message || 'An error occurred');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700">
        <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"}></div>
      </div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse-glow"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-purple-300/20 rounded-full blur-lg animate-bounce"></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-blue-300/15 rounded-full blur-lg animate-pulse"></div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Brand header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center glass">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">SecureChat</h1>
              <p className="text-purple-100 text-lg">End-to-end encrypted messaging</p>
            </div>
          </div>

          {/* Auth card */}
          <Card className="glass border-white/20 bg-white/10 backdrop-blur-md">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl text-white">
                {isLogin ? 'Welcome back' : 'Create account'}
              </CardTitle>
              <CardDescription className="text-purple-100">
                {isLogin 
                  ? 'Sign in to your secure chat account' 
                  : 'Join the most secure chat platform'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="bg-red-500/20 border-red-400/50 text-white">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-white/40"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-white/40"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-medium">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-white/40"
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-white text-purple-700 hover:bg-white/90 font-semibold py-6 text-lg transition-all duration-200 hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-5 h-5 mr-2" />
                  )}
                  {isLoading 
                    ? 'Processing...' 
                    : isLogin 
                    ? 'Sign In' 
                    : 'Create Account'}
                </Button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setEmail('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-purple-100 hover:text-white transition-colors underline"
                    disabled={isLoading}
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security features */}
          <div className="glass bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Features
            </h3>
            <div className="space-y-3 text-sm text-purple-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                End-to-end encryption with AES-256
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                RSA/ECDH key exchange protocol
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                No message storage on servers
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                One-time pairing codes for privacy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
