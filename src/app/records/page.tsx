'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dock from '@/components/Dock';
import type { ViolationRecord, ViolationType } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { supabase } from '@/lib/supabase';

const violationTypeOptions: Array<{ label: string; value: ViolationType | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Abuse', value: 'abuse' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Hate', value: 'hate' },
  { label: 'Spam', value: 'spam' },
  { label: 'Other', value: 'other' }
];

export default function RecordsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ViolationRecord[]>([]);
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterType, setFilterType] = useState<ViolationType | 'all'>('all');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      router.replace('/login');
      return;
    }
    setUserId(userData.user.id);

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
  }, [filterPlayer, filterType, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <main className='container stack'>
      <Dock />

      <section className='card stack'>
        <h1 className='title'>Violation Entries</h1>
        <p className='subtitle'>Only signed-in users can view records and evidence.</p>

        <div className='row'>
          <label style={{ flex: 1, minWidth: 220 }}>
            Player ID
            <input
              value={filterPlayer}
              onChange={(event) => setFilterPlayer(event.target.value)}
              placeholder='player_1234'
            />
          </label>
          <label style={{ width: 220 }}>
            Type
            <select value={filterType} onChange={(event) => setFilterType(event.target.value as ViolationType | 'all')}>
              {violationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type='button' onClick={() => void loadData()}>
            Refresh
          </button>
        </div>

        {error ? <p className='error'>{error}</p> : null}
        {loading ? <p>Loading...</p> : null}
        {!loading && records.length === 0 ? <p>No records.</p> : null}

        {!loading && records.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Player ID</th>
                  <th>Type</th>
                  <th>Occurred At</th>
                  <th>Reporter</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.player_uid}</td>
                    <td>{record.violation_type}</td>
                    <td>{formatDate(record.occurred_at)}</td>
                    <td>{record.reporter_id === userId ? 'Me' : record.reporter_id.slice(0, 8)}</td>
                    <td>{formatDate(record.created_at)}</td>
                    <td>
                      <Link href={`/records/${record.id}`}>Details</Link>
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

