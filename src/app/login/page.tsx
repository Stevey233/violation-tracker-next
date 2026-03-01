'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dock from '@/components/Dock';
import { supabase } from '@/lib/supabase';

type AuthMode = 'signIn' | 'signUp';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/records');
      }
    }

    void checkSession();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setPending(true);

    if (mode === 'signIn') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      setPending(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace('/records');
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: displayName.trim()
        },
        emailRedirectTo: `${window.location.origin}/records`
      }
    });

    setPending(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage('Registration submitted. If email confirmation is enabled, check your inbox.');
  }

  return (
    <main className='container stack'>
      <Dock />

      <section className='card stack' style={{ maxWidth: 520 }}>
        <h1 className='title'>{mode === 'signIn' ? 'Sign In' : 'Create Account'}</h1>
        <p className='subtitle'>
          Registered users can view records and gallery. Only admin can create new records.
        </p>

        <div className='row'>
          <button type='button' className={mode === 'signIn' ? '' : 'secondary'} onClick={() => setMode('signIn')}>
            Sign In
          </button>
          <button type='button' className={mode === 'signUp' ? '' : 'secondary'} onClick={() => setMode('signUp')}>
            Register
          </button>
        </div>

        <form className='stack' onSubmit={handleSubmit}>
          {mode === 'signUp' ? (
            <label className='stack' style={{ gap: 6 }}>
              <span>Display Name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder='your name'
                required
              />
            </label>
          ) : null}

          <label className='stack' style={{ gap: 6 }}>
            <span>Email</span>
            <input
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
              required
            />
          </label>

          <label className='stack' style={{ gap: 6 }}>
            <span>Password</span>
            <input
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='at least 6 characters'
              minLength={6}
              required
            />
          </label>

          <button type='submit' disabled={pending}>
            {pending ? 'Submitting...' : mode === 'signIn' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {message ? <p className='success'>{message}</p> : null}
        {error ? <p className='error'>{error}</p> : null}
      </section>
    </main>
  );
}

