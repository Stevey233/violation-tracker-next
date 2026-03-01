'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Dock from '@/components/Dock';
import { useLocale } from '@/components/LocaleProvider';
import type { AppRole, ViolationRecord, ViolationType } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { getViolationTypeLabel } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function RecordsPage() {
  const { locale, tr } = useLocale();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ViolationRecord[]>([]);
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterType, setFilterType] = useState<ViolationType | 'all'>('all');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | 'guest'>('guest');

  const typeOptions = useMemo<Array<{ value: ViolationType | 'all'; label: string }>>(
    () => [
      { value: 'all', label: getViolationTypeLabel(locale, 'all') },
      { value: 'tk', label: getViolationTypeLabel(locale, 'tk') },
      { value: 'troll', label: getViolationTypeLabel(locale, 'troll') },
      { value: 'improper', label: getViolationTypeLabel(locale, 'improper') }
    ],
    [locale]
  );

  const isAdmin = role === 'admin';
  const canViewImages = Boolean(userId);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id ?? null;
    setUserId(currentUserId);

    if (currentUserId) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUserId).single();
      setRole((profile?.role as AppRole | undefined) ?? 'user');
    } else {
      setRole('guest');
    }

    let query = supabase.from('violation_records').select('*').order('created_at', { ascending: false });

    const playerValue = filterPlayer.trim();
    if (playerValue) {
      query = query.ilike('player_uid', `%${playerValue}%`);
    }
    if (filterType !== 'all') {
      query = query.eq('violation_type', filterType);
    }

    const { data, error: listError } = await query.limit(300);
    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }

    setRecords(data ?? []);
    setLoading(false);
  }, [filterPlayer, filterType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <main className='container stack'>
      <Dock />

      <section className='card stack'>
        <h1 className='title'>{tr('records.title')}</h1>
        <p className='subtitle'>{tr('records.subtitle')}</p>

        <div className='row'>
          <label style={{ flex: 1, minWidth: 220 }}>
            {tr('records.playerId')}
            <input
              value={filterPlayer}
              onChange={(event) => setFilterPlayer(event.target.value)}
              placeholder={tr('records.placeholderPlayer')}
            />
          </label>
          <label style={{ width: 220 }}>
            {tr('records.type')}
            <select value={filterType} onChange={(event) => setFilterType(event.target.value as ViolationType | 'all')}>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type='button' onClick={() => void loadData()}>
            {tr('common.refresh')}
          </button>
        </div>

        {error ? <p className='error'>{error}</p> : null}
        {loading ? <p>{tr('common.loading')}</p> : null}
        {!loading && records.length === 0 ? <p>{tr('records.empty')}</p> : null}

        {!loading && records.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>{tr('records.playerId')}</th>
                  <th>{tr('records.wtPlayerName')}</th>
                  <th>{tr('records.type')}</th>
                  <th>{tr('records.occurredAt')}</th>
                  {isAdmin ? <th>{tr('records.reporter')}</th> : null}
                  {isAdmin ? <th>{tr('records.createdAt')}</th> : null}
                  <th>{tr('records.note')}</th>
                  <th>{tr('records.viewImage')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.player_uid}</td>
                    <td>{record.wt_player_name || '-'}</td>
                    <td>{getViolationTypeLabel(locale, record.violation_type)}</td>
                    <td>{formatDate(record.occurred_at, locale)}</td>
                    {isAdmin ? <td>{record.reporter_id === userId ? tr('records.me') : record.reporter_id.slice(0, 8)}</td> : null}
                    {isAdmin ? <td>{formatDate(record.created_at, locale)}</td> : null}
                    <td>{record.note || '-'}</td>
                    <td>
                      {canViewImages ? (
                        <Link href={`/records/${record.id}#evidence`}>{tr('records.viewImage')}</Link>
                      ) : (
                        <Link href='/login'>{tr('records.signInToView')}</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
