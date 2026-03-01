'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dock from '@/components/Dock';
import { useLocale } from '@/components/LocaleProvider';
import type { AppRole, ViolationType } from '@/lib/types';
import { toInputDatetimeLocal } from '@/lib/date';
import { getViolationTypeLabel } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function NewRecordPage() {
  const router = useRouter();
  const { locale, tr } = useLocale();
  const [playerUid, setPlayerUid] = useState('');
  const [wtPlayerName, setWtPlayerName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [violationType, setViolationType] = useState<ViolationType>('tk');
  const [occurredAt, setOccurredAt] = useState(toInputDatetimeLocal());
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accessChecked, setAccessChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const typeOptions = useMemo<Array<{ value: ViolationType; label: string }>>(
    () => [
      { value: 'tk', label: getViolationTypeLabel(locale, 'tk') },
      { value: 'troll', label: getViolationTypeLabel(locale, 'troll') },
      { value: 'improper', label: getViolationTypeLabel(locale, 'improper') }
    ],
    [locale]
  );

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
      return tr('new.noFiles');
    }
    return tr('new.fileCount', { count: files.length });
  }, [files.length, tr]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) {
      setError(tr('new.adminOnly'));
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError(tr('new.sessionExpired'));
      setSubmitting(false);
      router.replace('/login');
      return;
    }

    const { data: record, error: recordError } = await supabase
      .from('violation_records')
      .insert({
        player_uid: playerUid.trim(),
        wt_player_name: wtPlayerName.trim(),
        message_text: messageText.trim(),
        violation_type: violationType,
        occurred_at: new Date(occurredAt).toISOString(),
        reporter_id: userData.user.id,
        note: note.trim()
      })
      .select()
      .single();

    if (recordError || !record) {
      setError(recordError?.message ?? tr('new.createFailed'));
      setSubmitting(false);
      return;
    }

    if (files.length > 0) {
      for (const file of files) {
        const safeName = file.name.replace(/\s+/g, '_');
        const storagePath = `${record.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('evidence').upload(storagePath, file);
        if (uploadError) {
          setError(tr('new.uploadFailed', { name: file.name, message: uploadError.message }));
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
          setError(tr('new.evidenceInsertFailed', { name: file.name, message: evidenceError.message }));
          setSubmitting(false);
          return;
        }
      }
    }

    setSuccess(tr('new.success'));
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
          <h1 className='title'>{tr('new.title')}</h1>
          <p className='subtitle'>{tr('new.subtitle')}</p>
        </div>
        <Link href='/records'>
          <button type='button' className='secondary'>
            {tr('common.back')}
          </button>
        </Link>
      </section>

      {!accessChecked ? <section className='card'>{tr('new.accessChecking')}</section> : null}
      {accessChecked && !isAdmin ? <section className='card error'>{tr('new.adminOnly')}</section> : null}

      {accessChecked && isAdmin ? (
        <section className='card'>
          <form className='stack' onSubmit={handleSubmit}>
            <label className='stack' style={{ gap: 6 }}>
              <span>{tr('new.playerId')}</span>
              <input
                required
                value={playerUid}
                onChange={(event) => setPlayerUid(event.target.value)}
                placeholder={tr('new.playerPlaceholder')}
              />
            </label>

            <label className='stack' style={{ gap: 6 }}>
              <span>{tr('new.wtPlayerName')}</span>
              <input
                value={wtPlayerName}
                onChange={(event) => setWtPlayerName(event.target.value)}
                placeholder={tr('new.wtPlaceholder')}
              />
            </label>

            <label className='stack' style={{ gap: 6 }}>
              <span>{tr('new.message')}</span>
              <textarea
                required
                rows={4}
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder={tr('new.message')}
              />
            </label>

            <div className='row'>
              <label style={{ flex: 1, minWidth: 220 }}>
                {tr('new.type')}
                <select value={violationType} onChange={(event) => setViolationType(event.target.value as ViolationType)}>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ flex: 1, minWidth: 220 }}>
                {tr('new.occurredAt')}
                <input
                  type='datetime-local'
                  required
                  value={occurredAt}
                  onChange={(event) => setOccurredAt(event.target.value)}
                />
              </label>
            </div>

            <label className='stack' style={{ gap: 6 }}>
              <span>{tr('new.note')}</span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={tr('new.notePlaceholder')}
              />
            </label>

            <label className='stack' style={{ gap: 6 }}>
              <span>{tr('new.evidenceImages')}</span>
              <input
                id='evidence-input'
                className='file-input-hidden'
                type='file'
                multiple
                accept='image/*'
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
              <label htmlFor='evidence-input' className='file-picker'>
                <span className='file-picker-btn'>{tr('new.chooseImages')}</span>
                <span className='file-picker-text'>{fileSummary}</span>
              </label>
            </label>

            <div className='row'>
              <button type='submit' disabled={submitting}>
                {submitting ? tr('new.submitting') : tr('new.submit')}
              </button>
              <Link href='/records'>
                <button type='button' className='secondary'>
                  {tr('common.cancel')}
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
