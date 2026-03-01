'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dock from '@/components/Dock';
import { useLocale } from '@/components/LocaleProvider';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const { tr } = useLocale();
  const [wtName, setWtName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    const wtUsername = wtName.trim();
    if (!wtUsername) {
      setError(tr('login.wtNameRequired'));
      return;
    }

    setPending(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: wtUsername
        },
        emailRedirectTo: `${window.location.origin}/records`
      }
    });

    setPending(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage(tr('login.registerSuccess'));
  }

  return (
    <main className='container stack'>
      <Dock />

      <div className='auth-shell'>
        <section className='card stack auth-card'>
          <h1 className='title'>{tr('login.registerTitle')}</h1>
          <p className='subtitle'>{tr('login.subtitle')}</p>

          <form className='stack' onSubmit={handleSubmit}>
            <label className='stack' style={{ gap: 6 }}>
              <span>{tr('login.wtName')}</span>
              <input
                value={wtName}
                onChange={(event) => setWtName(event.target.value)}
                placeholder={tr('login.wtNameHint')}
                required
              />
            </label>

            <label className='stack' style={{ gap: 6 }}>
              <span>{tr('login.email')}</span>
              <input
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='you@example.com'
                required
              />
            </label>

            <label className='stack' style={{ gap: 6 }}>
              <span>{tr('login.password')}</span>
              <input
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={tr('login.passwordHint')}
                minLength={6}
                required
              />
            </label>

            <button type='submit' disabled={pending}>
              {pending ? tr('login.submitting') : tr('login.submitRegister')}
            </button>
          </form>

          <Link href='/login' className='auth-register-link'>
            {tr('login.signIn')}
          </Link>

          {message ? <p className='success'>{message}</p> : null}
          {error ? <p className='error'>{error}</p> : null}
        </section>
      </div>
    </main>
  );
}

