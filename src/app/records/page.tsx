'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppRole, Profile, ViolationRecord, ViolationType } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { supabase } from '@/lib/supabase';

const violationTypeOptions: Array<{ label: string; value: ViolationType | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '辱骂', value: 'abuse' },
  { label: '骚扰', value: 'harassment' },
  { label: '仇恨言论', value: 'hate' },
  { label: '刷屏', value: 'spam' },
  { label: '其他', value: 'other' }
];

export default function RecordsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ViolationRecord[]>([]);
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterType, setFilterType] = useState<ViolationType | 'all'>('all');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const roleText = useMemo(() => {
    const role: AppRole | undefined = profile?.role;
    if (!role) {
      return '未知角色';
    }
    return role === 'admin' ? '管理员' : '成员';
  }, [profile?.role]);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      router.replace('/login');
      return;
    }
    setUserId(userData.user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    setProfile(profileData ?? null);

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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <main className='container stack'>
      <section className='card row' style={{ justifyContent: 'space-between' }}>
        <div className='stack' style={{ gap: 6 }}>
          <h1 className='title'>违规记录</h1>
          <p className='subtitle'>
            当前账号：
            {profile?.display_name ? ` ${profile.display_name} ` : ' '}
            <span className='badge'>{roleText}</span>
          </p>
        </div>
        <div className='row'>
          <Link href='/records/new'>
            <button type='button'>新建记录</button>
          </Link>
          <button type='button' className='secondary' onClick={handleSignOut}>
            退出登录
          </button>
        </div>
      </section>

      <section className='card stack'>
        <div className='row'>
          <label style={{ flex: 1, minWidth: 220 }}>
            玩家 ID 筛选
            <input
              value={filterPlayer}
              onChange={(event) => setFilterPlayer(event.target.value)}
              placeholder='例如: player_1234'
            />
          </label>
          <label style={{ width: 220 }}>
            违规类型
            <select value={filterType} onChange={(event) => setFilterType(event.target.value as ViolationType | 'all')}>
              {violationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type='button' onClick={() => void loadData()}>
            刷新
          </button>
        </div>

        {error ? <p className='error'>{error}</p> : null}
        {loading ? <p>加载中...</p> : null}

        {!loading && records.length === 0 ? <p>暂无记录</p> : null}

        {!loading && records.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>玩家 ID</th>
                  <th>违规类型</th>
                  <th>发生时间</th>
                  <th>记录人</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.player_uid}</td>
                    <td>{record.violation_type}</td>
                    <td>{formatDate(record.occurred_at)}</td>
                    <td>{record.reporter_id === userId ? '我' : record.reporter_id.slice(0, 8)}</td>
                    <td>{formatDate(record.created_at)}</td>
                    <td>
                      <Link href={`/records/${record.id}`}>查看详情</Link>
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

