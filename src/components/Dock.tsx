'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AppRole, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function Dock() {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadAccount() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setUserId(null);
        setProfile(null);
        return;
      }

      setUserId(userData.user.id);
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      setProfile(profileData ?? null);
    }

    void loadAccount();
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const roleText: AppRole | 'guest' = profile?.role ?? 'guest';
  const isAdmin = roleText === 'admin';

  return (
    <div className='dock-wrap'>
      <div className='dock card row'>
        <div className='row'>
          <Link href='/records' className={`dock-link ${pathname?.startsWith('/records') ? 'active' : ''}`}>
            Records
          </Link>
          <Link href='/gallery' className={`dock-link ${pathname?.startsWith('/gallery') ? 'active' : ''}`}>
            Gallery
          </Link>
          {isAdmin ? (
            <Link href='/records/new' className={`dock-link ${pathname === '/records/new' ? 'active' : ''}`}>
              New Entry
            </Link>
          ) : null}
        </div>

        <div className='row'>
          {userId ? (
            <>
              <span className='badge'>
                {profile?.display_name || 'Account'} · {roleText}
              </span>
              <button type='button' className='secondary' onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <Link href='/login' className={`dock-link ${pathname === '/login' ? 'active' : ''}`}>
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

