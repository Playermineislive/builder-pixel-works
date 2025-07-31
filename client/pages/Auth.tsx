import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Shield, 
  MessageCircle, 
  Lock, 
  Eye, 
  EyeOff,
  Sparkles,
  Zap,
  Globe,
  Users,
  ArrowRight,
  CheckCircle,
  Mail,
  KeyRound,
  Fingerprint,
  Wifi,
  WifiOff,
  RefreshCw,
  Heart,
  Star,
  Cpu,
  Rocket
} from 'lucide-react';

export default function Auth() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTheme, setCurrentTheme] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Optimized particles - reduced from 50 to 6 for performance
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate fewer, more efficient particles
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);

    // Throttled mouse tracking for interactive effects
    let mouseTimeout: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100
        });
      }, 16); // ~60fps throttling
    };

    // Auto theme cycling
    const themeInterval = setInterval(() => {
      setCurrentTheme(prev => (prev + 1) % 4);
    }, 15000);

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(themeInterval);
      clearTimeout(mouseTimeout);
    };
  }, []);

  // Password strength calculation
  useEffect(() => {
    const calculateStrength = (pwd: string) => {
      let strength = 0;
      if (pwd.length >= 8) strength += 25;
      if (/[a-z]/.test(pwd)) strength += 25;
      if (/[A-Z]/.test(pwd)) strength += 25;
      if (/[0-9]/.test(pwd)) strength += 15;
      if (/[^a-zA-Z0-9]/.test(pwd)) strength += 10;
      return Math.min(strength, 100);
    };
    setPasswordStrength(calculateStrength(password));
  }, [password]);

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

    if (!isLogin && passwordStrength < 60) {
      setError('Password is too weak. Please use a stronger password.');
      setIsLoading(false);
      return;
    }

    if (!isOnline) {
      setError('No internet connection. Please check your network.');
      setIsLoading(false);
      return;
    }

    try {
      const result = isLogin 
        ? await login(email, password)
        : await signup(email, password);

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(result.message || 'An error occurred');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const focusInput = (field: 'email' | 'password' | 'confirmPassword') => {
    const refs = {
      email: emailRef,
      password: passwordRef,
      confirmPassword: confirmPasswordRef
    };
    refs[field]?.current?.focus();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 80) return 'bg-green-500';
    if (passwordStrength >= 60) return 'bg-yellow-500';
    if (passwordStrength >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 80) return 'Very Strong';
    if (passwordStrength >= 60) return 'Strong';
    if (passwordStrength >= 40) return 'Medium';
    if (passwordStrength >= 20) return 'Weak';
    return 'Very Weak';
  };

  const getThemeGradients = () => {
    const themes = [
      {
        bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        name: "Ocean Twilight"
      },
      {
        bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        name: "Sunset Bloom"
      },
      {
        bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        name: "Arctic Aurora"
      },
      {
        bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        name: "Forest Glow"
      }
    ];
    return themes[currentTheme];
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-5, 5, -5],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Optimized gradient background with mouse interaction */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: getThemeGradients().bg,
          transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
        }}
        transition={{
          duration: 0.8,
          ease: "easeOut"
        }}
      />
      
      {/* Interactive mesh gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Optimized floating particles with unique shapes */}
      {particles.map((particle, index) => {
        const shapes = ['rounded-full', 'rounded-[2rem]', 'rounded-[3rem]', 'rounded-[1rem] rotate-45'];
        const sizes = ['w-4 h-4', 'w-6 h-2', 'w-2 h-6', 'w-3 h-3'];
        const colors = ['bg-white/20', 'bg-purple-300/30', 'bg-pink-300/30', 'bg-cyan-300/30'];
        
        return (
          <motion.div
            key={particle.id}
            className={`absolute ${sizes[index % 4]} ${colors[index % 4]} ${shapes[index % 4]} backdrop-blur-sm will-change-transform`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(index) * 10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.1, 0.8],
              rotate: [0, 90, 180]
            }}
            transition={{
              duration: 12 + index * 2,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        );
      })}

      {/* Enhanced floating geometric shapes with round corners */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-pink-400/15 to-purple-600/15 rounded-[3rem] backdrop-blur-md border border-white/10 shadow-2xl will-change-transform"
        variants={floatingVariants}
        animate="animate"
        whileHover={{ scale: 1.05, rotate: 10 }}
      />
      <motion.div
        className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-400/15 to-cyan-600/15 rounded-full backdrop-blur-md border border-white/10 shadow-2xl will-change-transform"
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '2s' }}
        whileHover={{ scale: 1.05, rotate: -10 }}
      />
      <motion.div
        className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-green-400/15 to-emerald-600/15 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-2xl will-change-transform"
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '4s' }}
        whileHover={{ scale: 1.05, rotate: 8 }}
      />

      {/* Enhanced status bar with theme name and network */}
      <motion.div 
        className="fixed top-4 right-4 z-50 flex items-center space-x-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        {/* Theme indicator */}
        <motion.div
          className="px-3 py-2 rounded-[1.5rem] backdrop-blur-md bg-white/10 border border-white/20 text-white/90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xs font-medium">{getThemeGradients().name}</span>
        </motion.div>
        
        {/* Network status */}
        <motion.div 
          className={`flex items-center space-x-2 px-3 py-2 rounded-[1.5rem] backdrop-blur-md ${
            isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          } border border-white/20`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-xs font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </motion.div>
      </motion.div>

      {/* Enhanced success notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500/30 to-emerald-500/30 backdrop-blur-md border border-green-400/50 text-white px-6 py-4 rounded-[2.5rem] flex items-center space-x-3 shadow-2xl"
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
          >
            <motion.div
              className="w-8 h-8 rounded-full bg-green-400/30 flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <CheckCircle className="w-5 h-5 text-green-300" />
            </motion.div>
            <div className="space-y-1">
              <span className="font-bold text-sm">Welcome to SecureChat!</span>
              <div className="text-xs text-white/80">Authentication successful</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 touch-manipulation">
        <motion.div 
          className="w-full max-w-md space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Brand header */}
          <motion.div 
            className="text-center space-y-6"
            variants={itemVariants}
          >
            <motion.div 
              className="mx-auto w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/30 relative overflow-hidden"
              whileHover={{ 
                scale: 1.1, 
                rotate: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"
                animate={{
                  x: [-100, 100],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <MessageCircle className="w-12 h-12 text-white drop-shadow-lg relative z-10" />
            </motion.div>

            <div className="space-y-2">
              <motion.h1 
                className="text-5xl font-bold text-white drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                SecureChat
              </motion.h1>
              <motion.p 
                className="text-white/90 text-xl font-medium drop-shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                End-to-end encrypted messaging
              </motion.p>
            </div>
          </motion.div>

          {/* Auth card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden relative">
              {/* Card glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50"
                animate={{
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <CardHeader className="text-center space-y-4 pb-6 relative z-10">
                <motion.div
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardTitle className="text-2xl text-white font-bold">
                    {isLogin ? 'Welcome back' : 'Create account'}
                  </CardTitle>
                  <CardDescription className="text-white/80 text-base">
                    {isLogin 
                      ? 'Sign in to your secure chat account' 
                      : 'Join the most secure chat platform'}
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6 relative z-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Alert className="bg-red-500/20 border-red-400/50 text-white backdrop-blur-sm rounded-[1.5rem]">
                          <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div 
                    className="space-y-2"
                    variants={itemVariants}
                  >
                    <Label htmlFor="email" className="text-white font-semibold text-sm flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email address</span>
                    </Label>
                    <motion.div
                      className={`relative transition-all duration-300 cursor-pointer group ${
                        focusedField === 'email' ? 'scale-105' : ''
                      }`}
                      onClick={() => focusInput('email')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Input
                        ref={emailRef}
                        id="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/60 focus:bg-white/20 backdrop-blur-sm h-16 rounded-[2rem] transition-all duration-300 text-lg pl-6 pr-12 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent group-hover:bg-white/15"
                        placeholder="Enter your email"
                        disabled={isLoading}
                        style={{ fontSize: '16px' }}
                      />
                      <motion.div
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 group-hover:text-white/60 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 rounded-[2rem] border-2 pointer-events-none"
                        animate={{
                          borderColor: focusedField === 'email' ? 'rgba(255,255,255,0.4)' : 'transparent',
                          boxShadow: focusedField === 'email' ? '0 0 30px rgba(255,255,255,0.3)' : 'none'
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div 
                    className="space-y-3"
                    variants={itemVariants}
                  >
                    <Label htmlFor="password" className="text-white font-semibold text-sm flex items-center space-x-2">
                      <KeyRound className="w-4 h-4" />
                      <span>Password</span>
                    </Label>
                    <motion.div
                      className={`relative transition-all duration-300 cursor-pointer group ${
                        focusedField === 'password' ? 'scale-105' : ''
                      }`}
                      onClick={() => focusInput('password')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Input
                        ref={passwordRef}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/60 focus:bg-white/20 backdrop-blur-sm h-16 rounded-[2rem] pr-12 transition-all duration-300 text-lg pl-6 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent group-hover:bg-white/15"
                        placeholder="Enter your password"
                        disabled={isLoading}
                        style={{ fontSize: '16px' }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:bg-white/10 h-10 w-10 rounded-[1rem] transition-all duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </Button>
                      <motion.div
                        className="absolute inset-0 rounded-[2rem] border-2 pointer-events-none"
                        animate={{
                          borderColor: focusedField === 'password' ? 'rgba(255,255,255,0.4)' : 'transparent',
                          boxShadow: focusedField === 'password' ? '0 0 30px rgba(255,255,255,0.3)' : 'none'
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.div>
                    
                    {/* Password strength indicator */}
                    {!isLogin && password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between text-xs text-white/70">
                          <span>Password strength</span>
                          <span className={passwordStrength >= 60 ? 'text-green-400' : 'text-yellow-400'}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-[1.5rem] h-3 overflow-hidden relative">
                          <motion.div
                            className={`h-full rounded-[1.5rem] transition-all duration-300 ${getPasswordStrengthColor()} relative overflow-hidden`}
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength}%` }}
                            transition={{ duration: 0.3 }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              animate={{
                                x: [-100, 100]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Label htmlFor="confirmPassword" className="text-white font-semibold text-sm">
                          Confirm Password
                        </Label>
                        <motion.div
                          className={`relative transition-all duration-300 cursor-pointer group ${
                            focusedField === 'confirmPassword' ? 'scale-105' : ''
                          }`}
                          onClick={() => focusInput('confirmPassword')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Input
                            ref={confirmPasswordRef}
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setFocusedField('confirmPassword')}
                            onBlur={() => setFocusedField(null)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/60 focus:bg-white/20 backdrop-blur-sm h-16 rounded-[2rem] transition-all duration-300 text-lg pl-6 pr-12 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent group-hover:bg-white/15"
                            placeholder="Confirm your password"
                            disabled={isLoading}
                            style={{ fontSize: '16px' }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-[2rem] border-2 pointer-events-none"
                            animate={{
                              borderColor: focusedField === 'confirmPassword' ? 'rgba(255,255,255,0.4)' : 'transparent',
                              boxShadow: focusedField === 'confirmPassword' ? '0 0 30px rgba(255,255,255,0.3)' : 'none'
                            }}
                            transition={{ duration: 0.2 }}
                          />
                          {/* Enhanced password match indicator */}
                          {confirmPassword && (
                            <motion.div
                              className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
                                confirmPassword === password 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, type: "spring" }}
                            >
                              {confirmPassword === password ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <span className="text-sm font-bold">✕</span>
                              )}
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-white to-white/90 text-purple-700 hover:from-white/90 hover:to-white/80 font-bold py-7 text-lg rounded-[2rem] shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: [-100, 400],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center space-x-2 relative z-10"
                          >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="submit"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center space-x-2 relative z-10"
                          >
                            <Lock className="w-5 h-5" />
                            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                            <ArrowRight className="w-5 h-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>

                  <motion.div 
                    className="text-center pt-4"
                    variants={itemVariants}
                  >
                    <motion.button
                      type="button"
                      onClick={toggleMode}
                      className="text-white/80 hover:text-white transition-colors text-base font-medium underline underline-offset-4 hover:underline-offset-8 transition-all duration-300 px-4 py-2 rounded-[1.5rem] hover:bg-white/10"
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isLogin 
                        ? "Don't have an account? Sign up" 
                        : 'Already have an account? Sign in'}
                    </motion.button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Security features */}
          <motion.div 
            className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 shadow-xl relative overflow-hidden"
            variants={itemVariants}
          >
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }}
              animate={{
                backgroundPosition: ['0px 0px', '20px 20px']
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <h3 className="text-white font-bold text-xl mb-6 flex items-center relative z-10">
              <Shield className="w-6 h-6 mr-3 text-green-400" />
              Security & Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {[
                { icon: CheckCircle, text: 'End-to-end encryption with AES-256', color: 'text-green-400' },
                { icon: Zap, text: 'RSA/ECDH key exchange protocol', color: 'text-yellow-400' },
                { icon: Shield, text: 'No message storage on servers', color: 'text-blue-400' },
                { icon: Globe, text: 'Real-time translation support', color: 'text-purple-400' },
                { icon: Fingerprint, text: 'Biometric authentication ready', color: 'text-pink-400' },
                { icon: Star, text: 'Zero-knowledge architecture', color: 'text-indigo-400' }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-3 p-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className={`w-10 h-10 rounded-[1rem] bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 5 }}
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </motion.div>
                  <span className="text-white/90 text-sm leading-relaxed font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
            
            {/* App stats */}
            <motion.div 
              className="mt-6 pt-6 border-t border-white/10 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className="flex justify-center space-x-8 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-400 mr-1" />
                    99.9%
                  </div>
                  <div className="text-xs text-white/70">Uptime</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400 mr-1" />
                    10K+
                  </div>
                  <div className="text-xs text-white/70">Active Users</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-purple-400 mr-1" />
                    Fast
                  </div>
                  <div className="text-xs text-white/70">Performance</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
