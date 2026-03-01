'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dock from '@/components/Dock';
import { useLocale } from '@/components/LocaleProvider';
import type { AppRole, EvidenceFile, ViolationRecord } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { getViolationTypeLabel } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface DetailPageProps {
  params: {
    id: string;
  };
}

interface EvidenceWithUrl extends EvidenceFile {
  signedUrl: string | null;
}

export default function RecordDetailPage({ params }: DetailPageProps) {
  const router = useRouter();
  const { locale, tr } = useLocale();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<ViolationRecord | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceWithUrl[]>([]);
  const [error, setError] = useState('');
  const [canViewEvidence, setCanViewEvidence] = useState(false);
  const [role, setRole] = useState<AppRole | 'guest'>('guest');
  const [deleting, setDeleting] = useState(false);

  const isAdmin = role === 'admin';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');

      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id ?? null;
      const signedIn = Boolean(currentUserId);
      setCanViewEvidence(signedIn);

      if (currentUserId) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUserId).single();
        setRole((profile?.role as AppRole | undefined) ?? 'user');
      } else {
        setRole('guest');
      }

      const { data: recordData, error: recordError } = await supabase
        .from('violation_records')
        .select('*')
        .eq('id', params.id)
        .single();

      if (recordError || !recordData) {
        setError(recordError?.message ?? tr('detail.notFound'));
        setLoading(false);
        return;
      }

      setRecord(recordData);

      if (!signedIn) {
        setEvidenceList([]);
        setLoading(false);
        return;
      }

      const { data: evidenceRows, error: evidenceError } = await supabase
        .from('evidence_files')
        .select('*')
        .eq('record_id', params.id)
        .order('created_at', { ascending: true });

      if (evidenceError) {
        setError(evidenceError.message);
        setLoading(false);
        return;
      }

      const rows: EvidenceFile[] = evidenceRows ?? [];
      const list = await Promise.all(
        rows.map(async (row) => {
          const { data: urlData } = await supabase.storage.from('evidence').createSignedUrl(row.storage_path, 3600);
          return {
            ...row,
            signedUrl: urlData?.signedUrl ?? null
          };
        })
      );

      setEvidenceList(list);
      setLoading(false);
    }

    void loadData();
  }, [params.id, tr]);

  async function handleDelete() {
    if (!record || !isAdmin || deleting) {
      return;
    }

    const confirmed = window.confirm(tr('common.confirmDelete'));
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError('');

    const { data: fileRows, error: fileQueryError } = await supabase
      .from('evidence_files')
      .select('storage_path')
      .eq('record_id', record.id);

    if (fileQueryError) {
      setDeleting(false);
      setError(fileQueryError.message);
      return;
    }

    const paths = (fileRows ?? []).map((row) => row.storage_path);
    if (paths.length > 0) {
      const { error: storageDeleteError } = await supabase.storage.from('evidence').remove(paths);
      if (storageDeleteError) {
        setDeleting(false);
        setError(storageDeleteError.message);
        return;
      }
    }

    const { error: deleteError } = await supabase.from('violation_records').delete().eq('id', record.id);
    if (deleteError) {
      setDeleting(false);
      setError(deleteError.message);
      return;
    }

    alert(tr('detail.deleteSuccess'));
    router.replace('/records');
  }

  return (
    <main className='container stack'>
      <Dock />

      <section className='card row' style={{ justifyContent: 'space-between' }}>
        <div className='stack' style={{ gap: 6 }}>
          <h1 className='title'>{tr('detail.title')}</h1>
          <p className='subtitle'>
            {tr('detail.id')}: {params.id}
          </p>
        </div>
        <div className='row'>
          <Link href='/records'>
            <button type='button' className='secondary'>
              {tr('common.back')}
            </button>
          </Link>
          {isAdmin ? (
            <button type='button' onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? tr('common.loading') : tr('common.delete')}
            </button>
          ) : null}
        </div>
      </section>

      {loading ? <section className='card'>{tr('common.loading')}</section> : null}
      {error ? <section className='card error'>{error}</section> : null}

      {!loading && !error && record ? (
        <>
          <section className='card stack'>
            <h2 style={{ margin: 0, fontSize: 18 }}>{tr('detail.basicInfo')}</h2>
            <div className='row'>
              <span className='badge'>
                {tr('records.playerId')}: {record.player_uid}
              </span>
              {record.wt_player_name ? (
                <span className='badge'>
                  {tr('detail.wtPlayerName')}: {record.wt_player_name}
                </span>
              ) : null}
              <span className='badge'>
                {tr('records.type')}: {getViolationTypeLabel(locale, record.violation_type)}
              </span>
            </div>
            <p className='subtitle'>
              {tr('records.occurredAt')}: {formatDate(record.occurred_at, locale)}
            </p>
            {isAdmin ? (
              <p className='subtitle'>
                {tr('records.createdAt')}: {formatDate(record.created_at, locale)}
              </p>
            ) : null}

            <div className='stack' style={{ gap: 6 }}>
              <strong>{tr('detail.message')}</strong>
              <div className='card' style={{ background: '#f8fafc' }}>
                {record.message_text}
              </div>
            </div>

            {record.note ? (
              <div className='stack' style={{ gap: 6 }}>
                <strong>{tr('detail.note')}</strong>
                <div className='card' style={{ background: '#f8fafc' }}>
                  {record.note}
                </div>
              </div>
            ) : null}
          </section>

          <section id='evidence' className='card stack'>
            <h2 style={{ margin: 0, fontSize: 18 }}>{tr('detail.evidence')}</h2>
            {!canViewEvidence ? (
              <p className='subtitle'>
                <Link href='/login'>{tr('login.signIn')}</Link> {tr('detail.needSignInEvidence')}
              </p>
            ) : null}
            {canViewEvidence && evidenceList.length === 0 ? <p className='subtitle'>{tr('detail.noEvidence')}</p> : null}

            {canViewEvidence &&
              evidenceList.map((item) => (
                <div key={item.id} className='card' style={{ background: '#f8fafc' }}>
                  {item.signedUrl ? (
                    <img
                      src={item.signedUrl}
                      alt={item.storage_path}
                      className='detail-evidence-image'
                      loading='lazy'
                    />
                  ) : (
                    <span className='error'>{tr('detail.signedUrlError')}</span>
                  )}
                </div>
              ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
