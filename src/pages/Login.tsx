import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Lock, Target, Calendar, Sparkles, ArrowRight } from 'lucide-react';

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }
    
    try {
      if (isSignUp) {
        await signUp(email, password);
        setShowWelcome(true);
      } else {
        await signIn(email, password);
        setShowWelcome(true);
      }
    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        
        if (errorMessage.includes('invalid_credentials')) {
          setError('Incorrect email or password. Please try again.');
        } else if (errorMessage.includes('weak_password')) {
          setError('Password should be at least 6 characters long');
        } else if (errorMessage.includes('failed to fetch') || errorMessage.includes('network')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (errorMessage.includes('user not found')) {
          setError('No account found with this email. Please sign up first.');
        } else if (errorMessage.includes('email already exists')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError('An error occurred during authentication. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-lg w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/25">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Welcome to FocusFlow!
          </h2>
          <p className="text-gray-300 text-center mb-8">
            Let's get started by setting up your first goal. This will help you build and maintain daily routines with purpose.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/goals')}
              className="w-full flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
            >
              <span className="flex items-center">
                <Target className="h-6 w-6 mr-3" />
                Create Your First Goal
              </span>
              <ArrowRight className="h-6 w-6" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full text-gray-400 hover:text-white transition-colors py-2"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left side - Welcome message and features */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/25">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Welcome to FocusFlow</h1>
              </div>

              <p className="text-lg text-gray-300">
                Your personal habit tracking companion that helps you build and maintain daily routines with purpose.
              </p>

              <div className="grid gap-6">
                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                  <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/25">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Set Daily Goals</h3>
                    <p className="text-sm text-gray-400">Create and track your daily habits with ease</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                  <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/25">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Track Progress</h3>
                    <p className="text-sm text-gray-400">Monitor your journey with detailed insights</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                  <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/25">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Build Better Habits</h3>
                    <p className="text-sm text-gray-400">Transform your daily routines into lasting habits</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="bg-white/5 rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </h2>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
                    <div className="text-sm text-red-400">{error}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 bg-black/20 border border-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 bg-black/20 border border-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={`Enter your password ${isSignUp ? '(min. 6 characters)' : ''}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/25"
                >
                  {isSignUp ? 'Sign up' : 'Sign in'}
                </button>

                <div className="text-sm text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                    }}
                    className="font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    {isSignUp
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;