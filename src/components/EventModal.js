import React, { useState, useEffect } from 'react';
import { CATEGORIES, MEMBERS } from '../constants/data';

const RRULE_DAYS = [
  { code: 'MO', label: '월' },
  { code: 'TU', label: '화' },
  { code: 'WE', label: '수' },
  { code: 'TH', label: '목' },
  { code: 'FR', label: '금' },
  { code: 'SA', label: '토' },
  { code: 'SU', label: '일' },
];

const FREQ_OPTIONS = [
  { value: 'NONE',    label: '반복 없음' },
  { value: 'DAILY',   label: '매일' },
  { value: 'WEEKLY',  label: '매주' },
  { value: 'MONTHLY', label: '매월' },
  { value: 'YEARLY',  label: '매년' },
];

function buildRRULE(freq, days, until) {
  if (!freq || freq === 'NONE') return null;
  let rule = `RRULE:FREQ=${freq}`;
  if (freq === 'WEEKLY' && days.length > 0) {
    rule += `;BYDAY=${days.join(',')}`;
  }
  if (until) {
    rule += `;UNTIL=${until.replace(/-/g, '')}T235959Z`;
  }
  return rule;
}

function parseRRULE(rrules) {
  if (!rrules || rrules.length === 0) return { freq: 'NONE', days: [], until: '' };
  const inner = rrules[0].replace(/^RRULE:/, '');
  const params = {};
  inner.split(';').forEach(part => {
    const [k, v] = part.split('=');
    if (k) params[k] = v || '';
  });
  const until = params.UNTIL
    ? `${params.UNTIL.slice(0,4)}-${params.UNTIL.slice(4,6)}-${params.UNTIL.slice(6,8)}`
    : '';
  return {
    freq: params.FREQ || 'NONE',
    days: params.BYDAY ? params.BYDAY.split(',') : [],
    until,
  };
}

export default function EventModal({ event, selectedDate, currentUser, onSave, onDelete, onClose }) {
  const isEdit = !!event;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(currentUser.name);
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState('NONE');
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [recurrenceUntil, setRecurrenceUntil] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEdit && event) {
      const { parsedSummary, parsedDesc, start, end, recurrence: rec } = event;
      setTitle(parsedSummary?.title || '');
      setAuthor(parsedSummary?.author || currentUser.name);
      setCategory(parsedDesc?.category || CATEGORIES[0].name);
      setDescription(parsedDesc?.detail || '');

      if (start?.date) {
        setIsAllDay(true);
        setStartDate(start.date);
        setEndDate(end.date || start.date);
      } else if (start?.dateTime) {
        const s = new Date(start.dateTime);
        const e = new Date(end.dateTime);
        setStartDate(toDateStr(s));
        setStartTime(toTimeStr(s));
        setEndDate(toDateStr(e));
        setEndTime(toTimeStr(e));
      }

      const parsed = parseRRULE(rec);
      setRecurrenceFreq(parsed.freq);
      setRecurrenceDays(parsed.days);
      setRecurrenceUntil(parsed.until);
    } else if (selectedDate) {
      const d = toDateStr(selectedDate);
      setStartDate(d);
      setEndDate(d);
    }
  }, [event, selectedDate, currentUser.name, isEdit]);

  function toDateStr(d) {
    // toISOString()은 UTC 변환 → 새벽 시간대 날짜 밀림 발생. 로컬 시간 그대로 사용
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function toTimeStr(d) {
    return d.toTimeString().slice(0, 5);
  }
  function toggleDay(code) {
    setRecurrenceDays(prev =>
      prev.includes(code) ? prev.filter(d => d !== code) : [...prev, code]
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      alert('일정 제목을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      let startISO, endISO;
      if (isAllDay) {
        startISO = startDate;
        endISO = endDate || startDate;
      } else {
        startISO = `${startDate}T${startTime}:00`;
        endISO = `${endDate}T${endTime}:00`;
      }
      await onSave({
        id: event?.id,
        title: title.trim(),
        author,
        category,
        description,
        startDate: startISO,
        endDate: endISO,
        isAllDay,
        recurrenceRule: buildRRULE(recurrenceFreq, recurrenceDays, recurrenceUntil),
      });
      onClose();
    } catch (e) {
      alert('저장 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{isEdit ? '일정 수정' : '일정 등록'}</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          <label style={styles.label}>일정 제목 *</label>
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 제목을 입력하세요"
          />

          <label style={styles.label}>작성자</label>
          <select style={styles.select} value={author} onChange={(e) => setAuthor(e.target.value)}>
            {MEMBERS.map((m) => (
              <option key={m.id} value={m.name}>{m.name} ({m.title})</option>
            ))}
          </select>

          <label style={styles.label}>카테고리</label>
          <select style={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <div style={styles.checkRow}>
            <input
              type="checkbox"
              id="allday"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="allday" style={styles.checkLabel}>종일 일정</label>
          </div>

          <div style={styles.dateRow}>
            <div style={styles.dateGroup}>
              <label style={styles.label}>시작일</label>
              <input type="date" style={styles.input} value={startDate}
                onChange={(e) => setStartDate(e.target.value)} />
              {!isAllDay && (
                <input type="time" style={styles.input} value={startTime}
                  onChange={(e) => setStartTime(e.target.value)} />
              )}
            </div>
            <div style={styles.dateGroup}>
              <label style={styles.label}>종료일</label>
              <input type="date" style={styles.input} value={endDate}
                onChange={(e) => setEndDate(e.target.value)} />
              {!isAllDay && (
                <input type="time" style={styles.input} value={endTime}
                  onChange={(e) => setEndTime(e.target.value)} />
              )}
            </div>
          </div>

          {/* 반복 설정 */}
          <label style={styles.label}>반복</label>
          <select style={styles.select} value={recurrenceFreq}
            onChange={(e) => { setRecurrenceFreq(e.target.value); setRecurrenceDays([]); }}>
            {FREQ_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {recurrenceFreq === 'WEEKLY' && (
            <div style={styles.dayBox}>
              <p style={styles.dayLabel}>반복 요일 선택</p>
              <div style={styles.dayRow}>
                {RRULE_DAYS.map(({ code, label }) => (
                  <button
                    key={code}
                    type="button"
                    style={{
                      ...styles.dayBtn,
                      backgroundColor: recurrenceDays.includes(code) ? '#1E3A8A' : '#F3F4F6',
                      color: recurrenceDays.includes(code) ? '#FFFFFF' : '#374151',
                      border: recurrenceDays.includes(code) ? '2px solid #1E3A8A' : '2px solid #E5E7EB',
                    }}
                    onClick={() => toggleDay(code)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurrenceFreq !== 'NONE' && (
            <>
              <label style={styles.label}>반복 종료일 (선택)</label>
              <input type="date" style={styles.input} value={recurrenceUntil}
                onChange={(e) => setRecurrenceUntil(e.target.value)}
                placeholder="종료일 없음" />
            </>
          )}

          <label style={styles.label}>상세 내용</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상세 내용을 입력하세요 (선택)"
            rows={3}
          />
        </div>

        <div style={styles.footer}>
          {isEdit && (
            <button style={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          )}
          <div style={styles.footerRight}>
            <button style={styles.cancelBtn} onClick={onClose}>취소</button>
            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : (isEdit ? '수정' : '저장')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '16px',
  },
  modal: {
    backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%',
    maxWidth: '500px', maxHeight: '90vh', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 16px', borderBottom: '1px solid #E5E7EB',
  },
  modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1F2937', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
    color: '#6B7280', padding: '4px 8px', minWidth: '44px', minHeight: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: '16px 24px', overflowY: 'auto', flex: 1 },
  label: {
    display: 'block', fontSize: '15px', fontWeight: '600',
    color: '#374151', marginBottom: '6px', marginTop: '14px',
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: '8px',
    border: '1.5px solid #D1D5DB', fontSize: '16px', color: '#1F2937',
    boxSizing: 'border-box', outline: 'none', marginBottom: '4px',
  },
  select: {
    width: '100%', padding: '12px 14px', borderRadius: '8px',
    border: '1.5px solid #D1D5DB', fontSize: '16px', color: '#1F2937',
    backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none',
  },
  textarea: {
    width: '100%', padding: '12px 14px', borderRadius: '8px',
    border: '1.5px solid #D1D5DB', fontSize: '16px', color: '#1F2937',
    boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
  },
  checkRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer' },
  checkLabel: { fontSize: '16px', color: '#374151', cursor: 'pointer' },
  dateRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  dateGroup: { display: 'flex', flexDirection: 'column' },
  dayBox: {
    marginTop: '10px', padding: '14px', backgroundColor: '#F9FAFB',
    borderRadius: '10px', border: '1px solid #E5E7EB',
  },
  dayLabel: { fontSize: '14px', color: '#6B7280', margin: '0 0 10px 0', fontWeight: '600' },
  dayRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  dayBtn: {
    width: '40px', height: '40px', borderRadius: '50%', fontWeight: '700',
    fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s',
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', borderTop: '1px solid #E5E7EB', gap: '10px',
  },
  footerRight: { display: 'flex', gap: '10px', marginLeft: 'auto' },
  cancelBtn: {
    padding: '12px 20px', borderRadius: '8px', border: '1.5px solid #D1D5DB',
    backgroundColor: '#FFFFFF', color: '#374151', fontSize: '16px',
    fontWeight: '600', cursor: 'pointer', minHeight: '44px',
  },
  saveBtn: {
    padding: '12px 24px', borderRadius: '8px', border: 'none',
    backgroundColor: '#1E3A8A', color: '#FFFFFF', fontSize: '16px',
    fontWeight: '600', cursor: 'pointer', minHeight: '44px',
  },
  deleteBtn: {
    padding: '12px 20px', borderRadius: '8px', border: 'none',
    backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '16px',
    fontWeight: '600', cursor: 'pointer', minHeight: '44px',
  },
};
