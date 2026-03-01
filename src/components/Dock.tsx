'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import type { Profile } from '@/lib/types';
import { getRoleLabel } from '@/lib/i18n';
import { useLocale } from '@/components/LocaleProvider';
import { supabase } from '@/lib/supabase';

export default function Dock() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, tr } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadAccount() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setProfile(null);
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      setProfile(profileData ?? null);
    }

    void loadAccount();
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  function switchLocale(next: Locale) {
    setLocale(next);
  }

  const roleLabel = getRoleLabel(locale, profile?.role ?? 'guest');

  return (
    <header className='top-dock'>
      <div className='top-dock-inner'>
        <div className='dock-left row'>
          {profile ? (
            <div className='user-menu'>
              <button type='button' className='dock-link user-trigger'>
                {profile.display_name || tr('dock.account')}
              </button>
              <div className='user-popover card'>
                <span className='subtitle'>{roleLabel}</span>
                <button type='button' className='secondary' onClick={handleSignOut}>
                  {tr('dock.signOut')}
                </button>
              </div>
            </div>
          ) : (
            <Link href='/login' className={`dock-link ${pathname === '/login' ? 'active' : ''}`}>
              {tr('dock.login')}
            </Link>
          )}
        </div>

        <nav className='dock-center row'>
          <Link href='/records' className={`dock-link ${pathname?.startsWith('/records') ? 'active' : ''}`}>
            {tr('dock.records')}
          </Link>
          <Link href='/gallery' className={`dock-link ${pathname?.startsWith('/gallery') ? 'active' : ''}`}>
            {tr('dock.gallery')}
          </Link>
          <Link href='/records/new' className={`dock-link ${pathname === '/records/new' ? 'active' : ''}`}>
            {tr('dock.newEntry')}
          </Link>
        </nav>

        <div className='dock-right brand-block'>
          <div className='row brand-row'>
            <div className='site-logo' aria-hidden='true'>
              WT
            </div>
            <strong className='site-name'>{tr('brand.name')}</strong>
          </div>
          <div className='row lang-switch under-brand'>
            <button
              type='button'
              className={`secondary ${locale === 'zh-CN' ? 'lang-active' : ''}`}
              onClick={() => switchLocale('zh-CN')}
            >
              {tr('dock.langZh')}
            </button>
            <button
              type='button'
              className={`secondary ${locale === 'en-US' ? 'lang-active' : ''}`}
              onClick={() => switchLocale('en-US')}
            >
              {tr('dock.langEn')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
