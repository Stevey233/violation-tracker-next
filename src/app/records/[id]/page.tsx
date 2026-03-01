'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
        setError(recordError?.message ?? '未找到记录');
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

      const rows = evidenceRows ?? [];
      const list: EvidenceWithUrl[] = [];

      for (const row of rows) {
        const { data: urlData } = await supabase.storage.from('evidence').createSignedUrl(row.storage_path, 3600);
        list.push({
          ...row,
          signedUrl: urlData?.signedUrl ?? null
        });
      }

      setEvidenceList(list);
      setLoading(false);
    }

    void loadData();
  }, [params.id, router]);

  return (
    <main className='container stack'>
      <section className='card row' style={{ justifyContent: 'space-between' }}>
        <div className='stack' style={{ gap: 6 }}>
          <h1 className='title'>记录详情</h1>
          <p className='subtitle'>记录 ID: {params.id}</p>
        </div>
        <div className='row'>
          <Link href='/records'>
            <button type='button' className='secondary'>
              返回列表
            </button>
          </Link>
          <Link href='/records/new'>
            <button type='button'>新建记录</button>
          </Link>
        </div>
      </section>

      {loading ? <section className='card'>加载中...</section> : null}
      {error ? <section className='card error'>{error}</section> : null}

      {!loading && !error && record ? (
        <>
          <section className='card stack'>
            <h2 style={{ margin: 0, fontSize: 18 }}>基础信息</h2>
            <div className='row'>
              <span className='badge'>玩家 ID: {record.player_uid}</span>
              <span className='badge'>类型: {record.violation_type}</span>
            </div>
            <p className='subtitle'>发生时间：{formatDate(record.occurred_at)}</p>
            <p className='subtitle'>创建时间：{formatDate(record.created_at)}</p>
            <div className='stack' style={{ gap: 6 }}>
              <strong>违规发言</strong>
              <div className='card' style={{ background: '#f8fafc' }}>
                {record.message_text}
              </div>
            </div>
            {record.note ? (
              <div className='stack' style={{ gap: 6 }}>
                <strong>备注</strong>
                <div className='card' style={{ background: '#f8fafc' }}>
                  {record.note}
                </div>
              </div>
            ) : null}
          </section>

          <section className='card stack'>
            <h2 style={{ margin: 0, fontSize: 18 }}>证据文件</h2>
            {evidenceList.length === 0 ? <p className='subtitle'>暂无证据</p> : null}
            {evidenceList.map((item) => (
              <div key={item.id} className='card' style={{ background: '#f8fafc' }}>
                <p className='subtitle' style={{ marginBottom: 8 }}>
                  {item.storage_path}
                </p>
                {item.signedUrl ? (
                  <a href={item.signedUrl} target='_blank' rel='noreferrer'>
                    打开文件
                  </a>
                ) : (
                  <span className='error'>签名地址生成失败</span>
                )}
              </div>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}

