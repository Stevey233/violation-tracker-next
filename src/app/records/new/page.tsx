'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dock from '@/components/Dock';
import type { AppRole, ViolationType } from '@/lib/types';
import { toInputDatetimeLocal } from '@/lib/date';
import { supabase } from '@/lib/supabase';

const violationTypeOptions: Array<{ label: string; value: ViolationType }> = [
  { label: 'Abuse', value: 'abuse' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Hate', value: 'hate' },
  { label: 'Spam', value: 'spam' },
  { label: 'Other', value: 'other' }
];

export default function NewRecordPage() {
  const router = useRouter();
  const [playerUid, setPlayerUid] = useState('');
  const [messageText, setMessageText] = useState('');
  const [violationType, setViolationType] = useState<ViolationType>('abuse');
  const [occurredAt, setOccurredAt] = useState(toInputDatetimeLocal());
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accessChecked, setAccessChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function ensureAdmin() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/login');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single();
      const role = (profileData?.role ?? 'user') as AppRole;
      setIsAdmin(role === 'admin');
      setAccessChecked(true);
    }

    void ensureAdmin();
  }, [router]);

  const fileSummary = useMemo(() => {
    if (files.length === 0) {
      return 'No files selected';
    }
    return `${files.length} file(s) selected`;
  }, [files.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) {
      setError('Only admin can create new records.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError('Session expired. Please sign in again.');
      setSubmitting(false);
      router.replace('/login');
      return;
    }

    const { data: record, error: recordError } = await supabase
      .from('violation_records')
      .insert({
        player_uid: playerUid.trim(),
        message_text: messageText.trim(),
        violation_type: violationType,
        occurred_at: new Date(occurredAt).toISOString(),
        reporter_id: userData.user.id,
        note: note.trim()
      })
      .select()
      .single();

    if (recordError || !record) {
      setError(recordError?.message ?? 'Failed to create record');
      setSubmitting(false);
      return;
    }

    if (files.length > 0) {
      for (const file of files) {
        const safeName = file.name.replace(/\s+/g, '_');
        const storagePath = `${record.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('evidence').upload(storagePath, file);
        if (uploadError) {
          setError(`Upload failed for ${file.name}: ${uploadError.message}`);
          setSubmitting(false);
          return;
        }

        const { error: evidenceError } = await supabase.from('evidence_files').insert({
          record_id: record.id,
          storage_path: storagePath,
          mime_type: file.type || 'application/octet-stream',
          uploaded_by: userData.user.id
        });

        if (evidenceError) {
          setError(`Evidence insert failed for ${file.name}: ${evidenceError.message}`);
          setSubmitting(false);
          return;
        }
      }
    }

    setSuccess('Record created. Redirecting to details...');
    setSubmitting(false);
    setTimeout(() => {
      router.push(`/records/${record.id}`);
    }, 1200);
  }

  return (
    <main className='container stack'>
      <Dock />

      <section className='card row' style={{ justifyContent: 'space-between' }}>
        <div className='stack' style={{ gap: 6 }}>
          <h1 className='title'>New Violation Entry</h1>
          <p className='subtitle'>Admin-only action.</p>
        </div>
        <Link href='/records'>
          <button type='button' className='secondary'>
            Back
          </button>
        </Link>
      </section>

      {!accessChecked ? <section className='card'>Checking access...</section> : null}
      {accessChecked && !isAdmin ? <section className='card error'>Only admin can create new records.</section> : null}

      {accessChecked && isAdmin ? (
        <section className='card'>
          <form className='stack' onSubmit={handleSubmit}>
            <label className='stack' style={{ gap: 6 }}>
              <span>Player ID</span>
              <input
                required
                value={playerUid}
                onChange={(event) => setPlayerUid(event.target.value)}
                placeholder='player_123456'
              />
            </label>

            <label className='stack' style={{ gap: 6 }}>
              <span>Message</span>
              <textarea
                required
                rows={4}
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder='Violation content'
              />
            </label>

            <div className='row'>
              <label style={{ flex: 1, minWidth: 220 }}>
                Type
                <select value={violationType} onChange={(event) => setViolationType(event.target.value as ViolationType)}>
                  {violationTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ flex: 1, minWidth: 220 }}>
                Occurred At
                <input
                  type='datetime-local'
                  required
                  value={occurredAt}
                  onChange={(event) => setOccurredAt(event.target.value)}
                />
              </label>
            </div>

            <label className='stack' style={{ gap: 6 }}>
              <span>Note</span>
              <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder='Optional note' />
            </label>

            <label className='stack' style={{ gap: 6 }}>
              <span>Evidence Images</span>
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
              <span className='subtitle'>{fileSummary}</span>
            </label>

            <div className='row'>
              <button type='submit' disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <Link href='/records'>
                <button type='button' className='secondary'>
                  Cancel
                </button>
              </Link>
            </div>
          </form>

          {success ? <p className='success'>{success}</p> : null}
          {error ? <p className='error'>{error}</p> : null}
        </section>
      ) : null}
    </main>
  );
}

