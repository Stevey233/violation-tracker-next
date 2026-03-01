'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dock from '@/components/Dock';
import type { EvidenceFile, ViolationRecord } from '@/lib/types';
import { formatDate } from '@/lib/date';
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
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<ViolationRecord | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceWithUrl[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/login');
        return;
      }

      const { data: recordData, error: recordError } = await supabase
        .from('violation_records')
        .select('*')
        .eq('id', params.id)
        .single();
      if (recordError || !recordData) {
        setError(recordError?.message ?? 'Record not found');
        setLoading(false);
        return;
      }

      setRecord(recordData);

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
  }, [params.id, router]);

  return (
    <main className='container stack'>
      <Dock />

      <section className='card row' style={{ justifyContent: 'space-between' }}>
        <div className='stack' style={{ gap: 6 }}>
          <h1 className='title'>Record Details</h1>
          <p className='subtitle'>Record ID: {params.id}</p>
        </div>
        <div className='row'>
          <Link href='/records'>
            <button type='button' className='secondary'>
              Back
            </button>
          </Link>
        </div>
      </section>

      {loading ? <section className='card'>Loading...</section> : null}
      {error ? <section className='card error'>{error}</section> : null}

      {!loading && !error && record ? (
        <>
          <section className='card stack'>
            <h2 style={{ margin: 0, fontSize: 18 }}>Basic Info</h2>
            <div className='row'>
              <span className='badge'>Player: {record.player_uid}</span>
              <span className='badge'>Type: {record.violation_type}</span>
            </div>
            <p className='subtitle'>Occurred: {formatDate(record.occurred_at)}</p>
            <p className='subtitle'>Created: {formatDate(record.created_at)}</p>

            <div className='stack' style={{ gap: 6 }}>
              <strong>Message</strong>
              <div className='card' style={{ background: '#f8fafc' }}>
                {record.message_text}
              </div>
            </div>

            {record.note ? (
              <div className='stack' style={{ gap: 6 }}>
                <strong>Note</strong>
                <div className='card' style={{ background: '#f8fafc' }}>
                  {record.note}
                </div>
              </div>
            ) : null}
          </section>

          <section className='card stack'>
            <h2 style={{ margin: 0, fontSize: 18 }}>Evidence</h2>
            {evidenceList.length === 0 ? <p className='subtitle'>No evidence files.</p> : null}

            {evidenceList.map((item) => (
              <div key={item.id} className='card' style={{ background: '#f8fafc' }}>
                <p className='subtitle' style={{ marginBottom: 8 }}>
                  {item.storage_path}
                </p>
                {item.signedUrl ? (
                  <a href={item.signedUrl} target='_blank' rel='noreferrer'>
                    Open file
                  </a>
                ) : (
                  <span className='error'>Failed to generate signed URL</span>
                )}
              </div>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}

