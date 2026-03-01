'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSending(true);

    const emailRedirectTo = `${window.location.origin}/records`;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo
      }
    });

    setSending(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage('登录链接已发送，请检查邮箱。');
  }

  return (
    <main className='container'>
      <div className='card stack' style={{ maxWidth: 480, margin: '8vh auto 0' }}>
        <h1 className='title'>登录系统</h1>
        <p className='subtitle'>使用 Supabase 邮箱魔法链接登录。</p>

        <form className='stack' onSubmit={onSubmit}>
          <label className='stack' style={{ gap: 6 }}>
            <span>邮箱</span>
            <input
              type='email'
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
            />
          </label>

          <button type='submit' disabled={sending}>
            {sending ? '发送中...' : '发送登录链接'}
          </button>
        </form>

        {message ? <p className='success'>{message}</p> : null}
        {error ? <p className='error'>{error}</p> : null}
      </div>
    </main>
  );
}

