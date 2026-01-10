import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NeuCard, NeuButton, NeuInput, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { GalaxyCanvas } from '../components/GalaxyCanvas';
import { useAuth } from '../context/AuthContext';
import { Chrome, User, Zap, Mail, Lock, Loader2, Ticket, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const { styles } = useThemeStyles();
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const location = useLocation();

  // Check if coming from team invite flow (bypass invite code requirement)
  const returnTo = (location.state as any)?.returnTo || '';
  const isFromTeamInvite = returnTo.startsWith('/invite/');

  // Invite code state
  const [inviteCode, setInviteCode] = useState('');
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(isFromTeamInvite ? true : null);
  const [codeError, setCodeError] = useState('');

  // Email login state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-format invite code input (uppercase, add dash after prefix)
  const handleCodeChange = (value: string) => {
    // Remove any non-alphanumeric chars except dash
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');

    // Auto-insert dash after 4+ chars if not present
    if (cleaned.length > 4 && !cleaned.includes('-')) {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }

    // Limit to format: XXXX-XXXX (9 chars max)
    cleaned = cleaned.slice(0, 9);

    setInviteCode(cleaned);
    setCodeValid(null);
    setCodeError('');
  };

  // Validate invite code
  const validateCode = async () => {
    if (!inviteCode || inviteCode.length < 6) {
      setCodeError('Please enter a valid invite code');
      return;
    }

    setCodeValidating(true);
    setCodeError('');

    try {
      const response = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode })
      });

      const data = await response.json();

      if (data.valid) {
        setCodeValid(true);
        // Store code for use after OAuth
        localStorage.setItem('pending_invite_code', inviteCode);
      } else {
        setCodeValid(false);
        setCodeError(data.error || 'Invalid code');
      }
    } catch (err) {
      setCodeValid(false);
      setCodeError('Failed to validate code');
    } finally {
      setCodeValidating(false);
    }
  };

  // Handle OAuth click
  const handleGoogleSignIn = async () => {
    // Store code for consumption after OAuth callback
    if (inviteCode && codeValid) {
      localStorage.setItem('pending_invite_code', inviteCode);
    }
    await signInWithGoogle();
  };

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

  // Can proceed with auth?
  const canProceed = isFromTeamInvite || codeValid === true;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden">

      {/* Galaxy Background */}
      <div className="absolute inset-0 z-0">
        <GalaxyCanvas />
      </div>

      <div className="text-center mb-12 relative z-10">
        <div className="flex items-center justify-center mb-6">
          <img
            src="/xcreate-wordmark-logo-dark-mode.png"
            alt="Ads x Create"
            className="h-14 w-auto object-contain"
          />
        </div>
        <GalaxyHeading
          text="Enter the Portal"
          className="text-5xl md:text-6xl font-extrabold mb-4"
          mode="light-on-dark"
        />
        <p className={`max-w-md mx-auto text-lg text-white/70`}>
          {isFromTeamInvite
            ? "You've been invited to join a team"
            : "The world's most advanced AI marketing asset generator."
          }
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
          <h3 className={`text-xl font-bold text-white`}>
            {isFromTeamInvite ? 'Accept Invitation' : canProceed ? 'Welcome Back' : 'Invite Required'}
          </h3>
          <p className={`text-sm text-gray-400 mt-1`}>
            {isFromTeamInvite
              ? 'Sign in to join the workspace'
              : canProceed
                ? 'Sign in to access your workspace'
                : 'Enter your invite code to continue'
            }
          </p>
        </div>

        {/* Invite Code Input (hidden if from team invite or already validated) */}
        {!isFromTeamInvite && !canProceed && (
          <div className="w-full space-y-3">
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <NeuInput
                value={inviteCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="BETA-XXXX"
                className="pl-10 w-full text-center font-mono tracking-widest uppercase"
                forceTheme="dark"
                onKeyDown={(e) => e.key === 'Enter' && validateCode()}
              />
              {/* Validation status indicator */}
              {codeValid !== null && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {codeValid ? (
                    <CheckCircle2 size={18} className="text-green-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>
              )}
            </div>

            {codeError && (
              <p className="text-red-400 text-xs text-center">{codeError}</p>
            )}

            <NeuButton
              onClick={validateCode}
              disabled={codeValidating || inviteCode.length < 6}
              className="w-full flex items-center justify-center gap-3 py-4 text-base font-bold"
              forceTheme="dark"
            >
              {codeValidating ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Validating...
                </>
              ) : (
                <>
                  Validate Code <ArrowRight size={18} />
                </>
              )}
            </NeuButton>

            <p className="text-center text-xs text-gray-500">
              Don't have an invite code? Contact us for access.
            </p>
          </div>
        )}

        {/* Auth Options (shown only after code validated or team invite) */}
        {canProceed && (
          <>
            {!showEmailForm ? (
              <>
                <NeuButton
                  onClick={handleGoogleSignIn}
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
          </>
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
