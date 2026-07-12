'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import { BsEnvelope, BsLockFill, BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';
import '@/styles/auth.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectedFrom') || '/';
  const supabase = getSupabaseClient();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        router.push(redirectTo);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            role: 'member',
          });
        }
        toast.success('Account created! Check your email to confirm.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email first'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else toast.success('Password reset link sent!');
  }

  
  return (
    <div className="auth-page" style={{ paddingTop: 0 }}>
      <div className="auth-bg">
        <div className="auth-blob-1" />
        <div className="auth-blob-2" />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">M</div>
          <div className="auth-logo-title">Mhalkari Family</div>
        </div>

        <h2 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to access your family portal'
            : 'Join the Mhalkari family portal'}
        </p>

        {error && (
          <div className="auth-error" style={{ marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-input-group">
              <span className="auth-input-icon">👤</span>
              <input
                type="text"
                className="auth-input"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-input-group">
            <BsEnvelope className="auth-input-icon" />
            <input
              type="email"
              className="auth-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <BsLockFill className="auth-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              className="auth-input-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
            </button>
          </div>

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--accent-purple-light)', fontSize: '0.825rem', cursor: 'pointer', padding: 0 }}
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-purple-light)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
                onClick={() => { setMode('register'); setError(''); }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-purple-light)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
                onClick={() => { setMode('login'); setError(''); }}
              >
                Sign in
              </button>
            </>
          )}
        </div>

              </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
