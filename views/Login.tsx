import React, { useState } from 'react';
import { NeuCard, NeuButton, NeuInput, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { GalaxyCanvas } from '../components/GalaxyCanvas';
import { useAuth } from '../context/AuthContext';
import { Chrome, User, Zap, Mail, Lock, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { styles } = useThemeStyles();
  const { signInWithGoogle, signInWithEmail } = useAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signInWithEmail(email.trim(), password);

    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden">

      {/* Galaxy Background */}
      <div className="absolute inset-0 z-0">
        <GalaxyCanvas />
      </div>

      <div className="text-center mb-12 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-brand to-purple-500 text-white shadow-lg">
            <Zap size={24} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Ads x Create</span>
        </div>
        <GalaxyHeading
          text="Enter the Portal"
          className="text-5xl md:text-6xl font-extrabold mb-4"
          mode="light-on-dark"
        />
        <p className={`max-w-md mx-auto text-lg text-white/70`}>
          The world's most advanced AI marketing asset generator.
        </p>
      </div>

      <NeuCard
        className="p-8 max-w-sm w-full flex flex-col gap-6 items-center relative z-10"
        forceTheme="dark"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg mb-2">
          <User size={32} />
        </div>

        <div className="text-center">
          {/* Force text color to be light for this dark card */}
          <h3 className={`text-xl font-bold text-white`}>Welcome Back</h3>
          <p className={`text-sm text-gray-400 mt-1`}>Sign in to access your workspace</p>
        </div>

        {!showEmailForm ? (
          <>
            <NeuButton
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-4 text-base font-bold"
              forceTheme="dark"
            >
              <Chrome size={20} /> Continue with Google
            </NeuButton>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs uppercase text-gray-400 bg-[#1a1d23]">Or</span>
              </div>
            </div>

            <NeuButton
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-center gap-3 py-4 text-base font-bold"
              forceTheme="dark"
            >
              <Mail size={20} /> Continue with Email
            </NeuButton>
          </>
        ) : (
          <form onSubmit={handleEmailLogin} className="w-full space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <NeuInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="pl-10 w-full"
                  forceTheme="dark"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <NeuInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="pl-10 w-full"
                  forceTheme="dark"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-bold">{error}</p>
              </div>
            )}

            <NeuButton
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 text-base font-bold"
              forceTheme="dark"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </NeuButton>

            <button
              type="button"
              onClick={() => {
                setShowEmailForm(false);
                setError('');
              }}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to other options
            </button>
          </form>
        )}

        <div className="text-center space-y-2">
          <p className="text-xs opacity-50 text-gray-500">
            By continuing, you agree to our Terms of Service.
          </p>
        </div>
      </NeuCard>

      <div className="absolute bottom-8 text-xs opacity-40 font-mono">
        v2.0.0 • Celestial Neumorphism
      </div>
    </div>
  );
};

export default Login;
