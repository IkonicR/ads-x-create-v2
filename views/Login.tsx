import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NeuCard, NeuButton, NeuInput, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { GalaxyCanvas } from '../components/GalaxyCanvas';
import { useAuth } from '../context/AuthContext';
import { Chrome, User, Loader2, Ticket, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login: React.FC = () => {
  const { styles } = useThemeStyles();
  const { signInWithGoogle } = useAuth();
  const location = useLocation();

  // Check if coming from team invite flow
  const returnTo = (location.state as any)?.returnTo || '';
  const isFromTeamInvite = returnTo.startsWith('/invite/');

  // Invite code state (optional pre-auth entry)
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeError, setCodeError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Auto-format invite code input
  const handleCodeChange = (value: string) => {
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
    if (cleaned.length > 4 && !cleaned.includes('-')) {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    cleaned = cleaned.slice(0, 9);
    setInviteCode(cleaned);
    setCodeValid(null);
    setCodeError('');
  };

  // Validate and store invite code (optional, for pre-auth)
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

      if (response.status === 429) {
        setCodeValid(false);
        setCodeError('Too many attempts. Please wait a minute and try again.');
      } else if (data.valid) {
        setCodeValid(true);
        // Store code for use after OAuth
        localStorage.setItem('pending_invite_code', inviteCode);

        // Auto-trigger Google OAuth after short delay for visual feedback
        setIsRedirecting(true);
        setTimeout(() => {
          signInWithGoogle();
        }, 800);
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

  // Handle OAuth click - always available now
  const handleGoogleSignIn = async () => {
    // Store code for consumption after OAuth callback (if validated)
    if (inviteCode && codeValid) {
      localStorage.setItem('pending_invite_code', inviteCode);
    }
    // Store returnTo for redirect after OAuth
    if (returnTo) {
      localStorage.setItem('auth_return_to', returnTo);
    }
    await signInWithGoogle();
  };

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
            {isFromTeamInvite ? 'Accept Invitation' : 'Welcome'}
          </h3>
          <p className={`text-sm text-gray-400 mt-1`}>
            {isFromTeamInvite
              ? 'Sign in to join the workspace'
              : 'Sign in to access your workspace'
            }
          </p>
        </div>

        {/* Primary Action: Sign In Button (always visible) */}
        <NeuButton
          onClick={handleGoogleSignIn}
          disabled={isRedirecting}
          className="w-full flex items-center justify-center gap-3 py-4 text-base font-bold"
          forceTheme="dark"
        >
          {isRedirecting ? (
            <><Loader2 size={20} className="animate-spin" /> Redirecting to Google...</>
          ) : (
            <><Chrome size={20} /> Continue with Google</>
          )}
        </NeuButton>

        {/* Collapsible invite code section (for new users who have a code) */}
        {!isFromTeamInvite && (
          <div className="w-full">
            <button
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
            >
              {showCodeInput ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showCodeInput ? 'Hide invite code' : 'I have an invite code'}
            </button>

            <AnimatePresence>
              {showCodeInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3">
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
                      className="w-full flex items-center justify-center gap-3 py-3 text-sm"
                      forceTheme="dark"
                    >
                      {codeValidating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Validating...
                        </>
                      ) : codeValid ? (
                        <>
                          <CheckCircle2 size={16} /> Code Validated!
                        </>
                      ) : (
                        'Validate Code'
                      )}
                    </NeuButton>

                    {codeValid && (
                      <p className="text-green-400 text-xs text-center">
                        ✓ Code validated! Redirecting...
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
