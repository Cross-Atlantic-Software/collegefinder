'use client';

import { useState, useCallback, useRef, KeyboardEvent } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { sendInstituteReferralEmail } from '@/api/admin/institutes';
import { useToast } from '@/components/shared';

function EmailTags({
  tags,
  onChange,
  disabled,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  disabled?: boolean;
}) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const valid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const add = useCallback(
    (raw: string) => {
      const v = raw.trim().toLowerCase();
      if (!v) return;
      if (!valid(v)) return setErr('Invalid email');
      if (tags.includes(v)) return setErr('Already added');
      if (tags.length >= 10) return setErr('Max 10 recipients');
      onChange([...tags, v]);
      setVal('');
      setErr('');
    },
    [tags, onChange]
  );

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      add(val);
    } else if (e.key === 'Backspace' && !val && tags.length) {
      onChange(tags.slice(0, -1));
    } else setErr('');
  };

  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5 min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 cursor-text"
        onClick={() => ref.current?.focus()}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800"
          >
            {t}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="text-slate-500 hover:text-slate-800"
              >
                <FiX className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={ref}
          type="email"
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setErr('');
          }}
          onKeyDown={onKey}
          onBlur={() => val && add(val)}
          placeholder={tags.length ? 'Add another…' : 'Email, then Enter…'}
          disabled={disabled}
          className="flex-1 min-w-[140px] bg-transparent text-sm outline-none"
        />
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function InstituteReferralSendModal({
  instituteId,
  instituteName,
  emailSubject,
  initialRecipients,
  onClose,
  onSent,
}: {
  instituteId: number;
  instituteName: string;
  emailSubject: string;
  initialRecipients: string[];
  onClose: () => void;
  onSent: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [tags, setTags] = useState<string[]>(() =>
    [...new Set(initialRecipients.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  );
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!tags.length) {
      showError('Add at least one recipient');
      return;
    }
    setBusy(true);
    try {
      const res = await sendInstituteReferralEmail(instituteId, { recipients: tags });
      if (res.success && res.data) {
        const { sent, failed } = res.data;
        if (failed.length === 0) {
          showSuccess(`Sent to ${sent.length} recipient(s)`);
          onSent();
          onClose();
        } else {
          showError(`Sent: ${sent.length}, failed: ${failed.join(', ')}`);
        }
      } else {
        showError(res.message || 'Send failed');
      }
    } catch {
      showError('Send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Send referral invite</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">{instituteName}</span> — emails use the{' '}
            <code className="text-[10px] bg-slate-100 px-1 rounded">REFERRAL_INSTITUTE_INVITE</code> template.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject (preview)</label>
            <p className="text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-[#F6F8FA]">
              {emailSubject}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">To</label>
            <EmailTags tags={tags} onChange={setTags} disabled={busy} />
            <p className="mt-1 text-[11px] text-slate-500">
              Pre-filled from institute referral emails. Edit before send · max 10.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy || !tags.length}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? (
              'Sending…'
            ) : (
              <>
                <FiSend className="h-3.5 w-3.5" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
