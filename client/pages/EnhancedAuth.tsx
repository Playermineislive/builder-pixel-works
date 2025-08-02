import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Rocket,
  Crown,
  Moon,
  Sun,
  Cloud,
  Waves,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

export default function EnhancedAuth() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentStep, setCurrentStep] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Enhanced background themes
  const backgroundThemes = [
    {
      name: "Aurora",
      gradient:
        "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      particles: "aurora",
    },
    {
      name: "Ocean",
      gradient:
        "linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)",
      particles: "waves",
    },
    {
      name: "Sunset",
      gradient:
        "linear-gradient(135deg, #ff9a56 0%, #ff6b9d 50%, #c44569 100%)",
      particles: "glow",
    },
    {
      name: "Galaxy",
      gradient:
        "linear-gradient(135deg, #2c3e50 0%, #4a00e0 50%, #8e2de2 100%)",
      particles: "stars",
    },
  ];

  const [currentTheme, setCurrentTheme] = useState(0);

  useEffect(() => {
    // Show features after delay
    const featuresTimer = setTimeout(() => setShowFeatures(true), 1500);

    // Auto theme cycling
    const themeInterval = setInterval(() => {
      setCurrentTheme((prev) => (prev + 1) % backgroundThemes.length);
    }, 8000);

    // Mouse tracking for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    // Network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      clearTimeout(featuresTimer);
      clearInterval(themeInterval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [backgroundThemes.length]);

  // Password strength calculation
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (passwordStrength < 60) {
          throw new Error("Password is too weak");
        }
        await signup(email, password);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength(0);
    setCurrentStep(0);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return "bg-red-500";
    if (passwordStrength < 60) return "bg-yellow-500";
    if (passwordStrength < 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return "Weak";
    if (passwordStrength < 60) return "Fair";
    if (passwordStrength < 80) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto">
      {/* Dynamic background */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: backgroundThemes[currentTheme].gradient }}
        key={currentTheme}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Interactive mouse gradient */}
      <motion.div
        className="fixed inset-0 opacity-30 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.1), transparent 40%)`,
        }}
      />

      {/* Animated particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <motion.div
        className="fixed top-20 left-20 w-32 h-32 border border-white/20 rounded-full pointer-events-none z-0"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="fixed bottom-20 right-20 w-24 h-24 bg-white/10 rounded-lg backdrop-blur-sm pointer-events-none z-0"
        animate={{
          rotate: [0, -360],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8 lg:py-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start lg:items-center">
          {/* Left side - Branding and features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left space-y-8"
          >
            {/* Logo and branding */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.3,
              }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center lg:justify-start space-x-4">
                <motion.div
                  className="relative w-16 h-16"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-sm" />
                  <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
                    🔒
                  </div>
                </motion.div>

                <div>
                  <motion.h1
                    className="text-4xl lg:text-5xl font-bold text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    SecureChat
                  </motion.h1>
                  <motion.p
                    className="text-white/80 text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    End-to-End Encrypted Messaging
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Features showcase */}
            <AnimatePresence>
              {showFeatures && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {[
                    {
                      icon: Shield,
                      title: "Secure",
                      desc: "End-to-end encryption",
                    },
                    {
                      icon: Sparkles,
                      title: "Beautiful",
                      desc: "10+ stunning themes",
                    },
                    { icon: Zap, title: "Fast", desc: "Real-time messaging" },
                    {
                      icon: Globe,
                      title: "Connected",
                      desc: "Weather-based themes",
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 * index, duration: 0.5 }}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
                      whileHover={{ y: -5, scale: 1.05 }}
                    >
                      <feature.icon className="w-8 h-8 text-white mb-2" />
                      <h3 className="text-white font-semibold">
                        {feature.title}
                      </h3>
                      <p className="text-white/70 text-sm">{feature.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Theme indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center justify-center lg:justify-start space-x-2"
            >
              <span className="text-white/60 text-sm">Current theme:</span>
              <Badge
                variant="outline"
                className="bg-white/10 border-white/30 text-white"
              >
                {backgroundThemes[currentTheme].name}
              </Badge>
            </motion.div>
          </motion.div>

          {/* Right side - Auth form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  <CardTitle className="text-2xl font-bold text-white flex items-center justify-center space-x-2">
                    {isLogin ? (
                      <KeyRound className="w-6 h-6" />
                    ) : (
                      <Users className="w-6 h-6" />
                    )}
                    <span>{isLogin ? "Welcome Back" : "Join SecureChat"}</span>
                  </CardTitle>
                  <CardDescription className="text-white/70 mt-2">
                    {isLogin
                      ? "Sign in to continue your secure conversations"
                      : "Create your account and start chatting securely"}
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Network status */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center justify-center space-x-2"
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">Offline</span>
                    </>
                  )}
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email field */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="email"
                      className="text-white font-medium flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </Label>
                    <div className="relative">
                      <Input
                        ref={emailRef}
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-white/50 transition-all duration-300"
                        placeholder="Enter your email"
                        required
                      />
                      <motion.div
                        className="absolute inset-0 rounded-md border-2 border-purple-400/50 pointer-events-none"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{
                          opacity: focusedField === "email" ? 1 : 0,
                          scale: focusedField === "email" ? 1 : 1.1,
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </motion.div>

                  {/* Password field */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="password"
                      className="text-white font-medium flex items-center space-x-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </Label>
                    <div className="relative">
                      <Input
                        ref={passwordRef}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-white/50 transition-all duration-300 pr-12"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors z-10"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <motion.div
                        className="absolute inset-0 rounded-md border-2 border-purple-400/50 pointer-events-none"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{
                          opacity: focusedField === "password" ? 1 : 0,
                          scale: focusedField === "password" ? 1 : 1.1,
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>

                    {/* Password strength indicator */}
                    {!isLogin && password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/70">
                            Password strength:
                          </span>
                          <span
                            className={`font-medium ${
                              passwordStrength < 30
                                ? "text-red-400"
                                : passwordStrength < 60
                                  ? "text-yellow-400"
                                  : passwordStrength < 80
                                    ? "text-blue-400"
                                    : "text-green-400"
                            }`}
                          >
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${getPasswordStrengthColor()}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Confirm password field */}
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="space-y-2"
                    >
                      <Label
                        htmlFor="confirmPassword"
                        className="text-white font-medium flex items-center space-x-2"
                      >
                        <Fingerprint className="w-4 h-4" />
                        <span>Confirm Password</span>
                      </Label>
                      <div className="relative">
                        <Input
                          ref={confirmPasswordRef}
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onFocus={() => setFocusedField("confirmPassword")}
                          onBlur={() => setFocusedField(null)}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-white/50 transition-all duration-300 pr-12"
                          placeholder="Confirm your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors z-10"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <motion.div
                          className="absolute inset-0 rounded-md border-2 border-purple-400/50 pointer-events-none"
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{
                            opacity: focusedField === "confirmPassword" ? 1 : 0,
                            scale: focusedField === "confirmPassword" ? 1 : 1.1,
                          }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>

                      {/* Password match indicator */}
                      {confirmPassword && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center space-x-2"
                        >
                          {password === confirmPassword ? (
                            <>
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-sm">
                                Passwords match
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 text-sm">
                                Passwords don't match
                              </span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert className="bg-red-500/20 border-red-400/50">
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription className="text-red-200">
                            {error}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success message */}
                  <AnimatePresence>
                    {showSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      >
                        <Alert className="bg-green-500/20 border-green-400/50">
                          <CheckCircle className="w-4 h-4" />
                          <AlertDescription className="text-green-200">
                            {isLogin
                              ? "Login successful! Redirecting..."
                              : "Account created successfully!"}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading || !isOnline}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <motion.div
                          className="flex items-center space-x-2"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>
                            {isLogin ? "Signing in..." : "Creating account..."}
                          </span>
                        </motion.div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {isLogin ? (
                            <ArrowRight className="w-5 h-5" />
                          ) : (
                            <Rocket className="w-5 h-5" />
                          )}
                          <span>{isLogin ? "Sign In" : "Create Account"}</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Toggle mode */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="text-center pt-4 border-t border-white/20"
                >
                  <p className="text-white/70 text-sm mb-3">
                    {isLogin
                      ? "Don't have an account?"
                      : "Already have an account?"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleMode}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                  >
                    {isLogin ? "Create Account" : "Sign In"}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
