'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ViolationType } from '@/lib/types';
import { toInputDatetimeLocal } from '@/lib/date';
import { supabase } from '@/lib/supabase';

const violationTypeOptions: Array<{ label: string; value: ViolationType }> = [
  { label: '辱骂', value: 'abuse' },
  { label: '骚扰', value: 'harassment' },
  { label: '仇恨言论', value: 'hate' },
  { label: '刷屏', value: 'spam' },
  { label: '其他', value: 'other' }
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

  useEffect(() => {
    async function ensureAuth() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace('/login');
      }
    }

    void ensureAuth();
  }, [router]);

  const fileSummary = useMemo(() => {
    if (files.length === 0) {
      return '未选择文件';
    }
    return `已选择 ${files.length} 个文件`;
  }, [files.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError('登录状态失效，请重新登录。');
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
      setError(recordError?.message ?? '创建记录失败');
      setSubmitting(false);
      return;
    }

    if (files.length > 0) {
      for (const file of files) {
        const safeName = file.name.replace(/\s+/g, '_');
        const storagePath = `${record.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('evidence').upload(storagePath, file);

        if (uploadError) {
          setError(`文件上传失败: ${file.name}，${uploadError.message}`);
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
          setError(`证据记录写入失败: ${file.name}，${evidenceError.message}`);
          setSubmitting(false);
          return;
        }
      }
    }

    setSuccess('创建成功，2 秒后跳转到详情页。');
    setSubmitting(false);
    setTimeout(() => {
      router.push(`/records/${record.id}`);
    }, 2000);
  }

  return (
    <main className='container stack'>
      <section className='card row' style={{ justifyContent: 'space-between' }}>
        <div className='stack' style={{ gap: 6 }}>
          <h1 className='title'>新建违规记录</h1>
          <p className='subtitle'>提交后将写入 `violation_records`，证据上传至 `evidence`。</p>
        </div>
        <Link href='/records'>
          <button type='button' className='secondary'>
            返回列表
          </button>
        </Link>
      </section>

      <section className='card'>
        <form className='stack' onSubmit={handleSubmit}>
          <label className='stack' style={{ gap: 6 }}>
            <span>玩家 ID</span>
            <input
              required
              value={playerUid}
              onChange={(event) => setPlayerUid(event.target.value)}
              placeholder='player_123456'
            />
          </label>

          <label className='stack' style={{ gap: 6 }}>
            <span>违规发言内容</span>
            <textarea
              required
              rows={4}
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder='填写原始发言文本...'
            />
          </label>

          <div className='row'>
            <label style={{ flex: 1, minWidth: 220 }}>
              违规类型
              <select value={violationType} onChange={(event) => setViolationType(event.target.value as ViolationType)}>
                {violationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ flex: 1, minWidth: 220 }}>
              发生时间
              <input
                type='datetime-local'
                required
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
              />
            </label>
          </div>

          <label className='stack' style={{ gap: 6 }}>
            <span>备注</span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder='可选：记录上下文、频道信息、补充说明'
            />
          </label>

          <label className='stack' style={{ gap: 6 }}>
            <span>证据文件（可多选）</span>
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
              {submitting ? '提交中...' : '提交记录'}
            </button>
            <Link href='/records'>
              <button type='button' className='secondary'>
                取消
              </button>
            </Link>
          </div>
        </form>

        {success ? <p className='success'>{success}</p> : null}
        {error ? <p className='error'>{error}</p> : null}
      </section>
    </main>
  );
}

