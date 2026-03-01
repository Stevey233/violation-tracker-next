'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dock from '@/components/Dock';
import { useLocale } from '@/components/LocaleProvider';
import type { EvidenceFile } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { supabase } from '@/lib/supabase';

interface GalleryItem extends EvidenceFile {
  signedUrl: string | null;
}

export default function GalleryPage() {
  const router = useRouter();
  const { locale, tr } = useLocale();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadGallery() {
      setLoading(true);
      setError('');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/login');
        return;
      }

      const { data: rows, error: queryError } = await supabase
        .from('evidence_files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const imageRows = (rows ?? []).filter((row) => row.mime_type.startsWith('image/'));
      const signedItems = await Promise.all(
        imageRows.map(async (row) => {
          const { data: urlData } = await supabase.storage.from('evidence').createSignedUrl(row.storage_path, 3600);
          return {
            ...row,
            signedUrl: urlData?.signedUrl ?? null
          };
        })
      );

      setItems(signedItems);
      setLoading(false);
    }

    void loadGallery();
  }, [router]);

  return (
    <main className='container stack'>
      <Dock />

      <section className='card stack'>
        <h1 className='title'>{tr('gallery.title')}</h1>
        <p className='subtitle'>{tr('gallery.subtitle')}</p>
        {error ? <p className='error'>{error}</p> : null}
        {loading ? <p>{tr('common.loading')}</p> : null}
        {!loading && items.length === 0 ? <p>{tr('gallery.empty')}</p> : null}

        {!loading && items.length > 0 ? (
          <div className='masonry'>
            {items.map((item) => (
              <article key={item.id} className='masonry-item card'>
                {item.signedUrl ? (
                  <img src={item.signedUrl} alt={item.storage_path} className='gallery-image' loading='lazy' />
                ) : (
                  <div className='error'>{tr('gallery.urlError')}</div>
                )}
                <p className='subtitle' style={{ marginTop: 8 }}>
                  {formatDate(item.created_at, locale)}
                </p>
                <Link href={`/records/${item.record_id}`}>{tr('gallery.goRecord')}</Link>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

