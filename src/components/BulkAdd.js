import React, { useState } from 'react';
import { CATEGORIES, MEMBERS, FIXED_EVENTS } from '../constants/data';

const FREQ_OPTIONS = [
  { value: 'NONE', label: '반복 없음' },
  { value: 'WEEKLY', label: '매주' },
  { value: 'MONTHLY', label: '매월' },
];

function getTodayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export default function BulkAdd({ onSave, onDone, isSignedIn, currentUser }) {
  const [pendingList, setPendingList] = useState([]);
  const [form, setForm] = useState({
    date: getTodayStr(),
    title: '',
    author: currentUser?.name || MEMBERS[0].name,
    category: CATEGORIES[0].name,
    startTime: '09:00',
    endTime: '10:00',
    isAllDay: false,
    freq: 'NONE',
  });
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  function updateForm(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function addToPending() {
    if (!form.date || !form.title.trim()) {
      alert('날짜와 제목을 입력해 주세요.');
      return;
    }
    setPendingList(prev => [...prev, { ...form, id: Date.now() }]);
    setForm(f => ({ ...f, title: '' }));
    setResult(null);
  }

  function removeFromPending(id) {
    setPendingList(prev => prev.filter(e => e.id !== id));
  }

  async function handleBulkRegister() {
    if (!isSignedIn) {
      alert('구글 캘린더 연결 후 등록할 수 있습니다.');
      return;
    }
    if (pendingList.length === 0) {
      alert('등록할 일정을 추가해 주세요.');
      return;
    }
    setProgress({ current: 0, total: pendingList.length });
    setResult(null);
    let success = 0;
    let fail = 0;

    for (let i = 0; i < pendingList.length; i++) {
      const ev = pendingList[i];
      setProgress({ current: i + 1, total: pendingList.length });
      try {
        let recurrenceRule = null;
        if (ev.freq === 'WEEKLY') recurrenceRule = 'RRULE:FREQ=WEEKLY';
        else if (ev.freq === 'MONTHLY') recurrenceRule = 'RRULE:FREQ=MONTHLY';

        const startDate = ev.isAllDay ? ev.date : `${ev.date}T${ev.startTime}:00`;
        const endDate = ev.isAllDay ? ev.date : `${ev.date}T${ev.endTime}:00`;

        const res = await onSave({
          title: ev.title.trim(),
          author: ev.author,
          category: ev.category,
          description: '',
          startDate,
          endDate,
          isAllDay: ev.isAllDay,
          recurrenceRule,
        });
        if (res !== null && res !== undefined) success++;
        else fail++;
      } catch (e) {
        fail++;
      }
    }

    setProgress(null);
    setResult({ success, fail });
    if (success > 0) {
      setPendingList([]);
      if (onDone) onDone();
    }
  }

  const getCategoryColor = (catName) =>
    CATEGORIES.find(c => c.name === catName)?.color || '#94A3B8';

  return (
    <div style={styles.container}>
      {/* 고정 정기 일정 */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>고정 정기 일정</span>
          <span style={styles.sectionNote}>매주 반복 · 수정 불가</span>
        </div>
        <div style={styles.fixedList}>
          {FIXED_EVENTS.map((fe, i) => {
            const catColor = getCategoryColor(fe.category);
            return (
              <div key={i} style={styles.fixedCard}>
                <div style={{ ...styles.fixedDayBadge, backgroundColor: catColor }}>
                  {fe.day}요일
                </div>
                <div style={styles.fixedInfo}>
                  <span style={styles.fixedTitle}>{fe.title}</span>
                  <span style={styles.fixedTime}>{fe.startTime}~{fe.endTime}</span>
                </div>
                <span style={styles.lockIcon}>🔒</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 일정 추가 폼 */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>일정 추가</span>
        </div>
        <div style={styles.formGrid}>
          <div style={styles.formRow}>
            <label style={styles.label}>날짜 *</label>
            <input type="date" style={styles.input} value={form.date}
              onChange={e => updateForm('date', e.target.value)} />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>제목 *</label>
            <input
              style={styles.input}
              value={form.title}
              onChange={e => updateForm('title', e.target.value)}
              placeholder="일정 제목을 입력하세요"
              onKeyDown={e => e.key === 'Enter' && addToPending()}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>작성자</label>
            <select style={styles.select} value={form.author}
              onChange={e => updateForm('author', e.target.value)}>
              {MEMBERS.map(m => (
                <option key={m.id} value={m.name}>{m.name} ({m.title})</option>
              ))}
            </select>
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>카테고리</label>
            <select style={styles.select} value={form.category}
              onChange={e => updateForm('category', e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.formRowHalf}>
            <div>
              <label style={styles.label}>시작 시간</label>
              <input type="time" style={styles.input} value={form.startTime}
                onChange={e => updateForm('startTime', e.target.value)} />
            </div>
            <div>
              <label style={styles.label}>종료 시간</label>
              <input type="time" style={styles.input} value={form.endTime}
                onChange={e => updateForm('endTime', e.target.value)} />
            </div>
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>반복</label>
            <select style={styles.select} value={form.freq}
              onChange={e => updateForm('freq', e.target.value)}>
              {FREQ_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button style={styles.addBtn} onClick={addToPending}>+ 목록에 추가</button>
      </div>

      {/* 등록 대기 목록 */}
      {pendingList.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>등록 대기 목록</span>
            <span style={styles.pendingCount}>{pendingList.length}개</span>
          </div>
          <div style={styles.pendingList}>
            {pendingList.map(ev => {
              const catColor = getCategoryColor(ev.category);
              const freqLabel = FREQ_OPTIONS.find(f => f.value === ev.freq)?.label;
              return (
                <div key={ev.id} style={styles.pendingCard}>
                  <div style={{ ...styles.pendingDot, backgroundColor: catColor }} />
                  <div style={styles.pendingInfo}>
                    <span style={styles.pendingTitle}>{ev.title}</span>
                    <span style={styles.pendingMeta}>
                      {ev.date} · {ev.author} · {ev.category}
                      {ev.freq !== 'NONE' && ` · ${freqLabel}`}
                    </span>
                  </div>
                  <button style={styles.removeBtn} onClick={() => removeFromPending(ev.id)}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 진행 상황 */}
      {progress && (
        <div style={styles.progressBox}>
          <span style={styles.progressText}>{progress.current}/{progress.total} 등록 중...</span>
          <div style={styles.progressTrack}>
            <div style={{
              ...styles.progressFill,
              width: `${(progress.current / progress.total) * 100}%`,
            }} />
          </div>
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div style={{ ...styles.resultBox, borderColor: result.fail === 0 ? '#059669' : '#F59E0B' }}>
          <span style={styles.resultText}>
            {result.fail === 0
              ? `✓ ${result.success}개 모두 등록 완료!`
              : `✓ ${result.success}개 성공 · ${result.fail}개 실패/중복`}
          </span>
        </div>
      )}

      {/* 일괄 등록 버튼 */}
      <div style={styles.registerRow}>
        <button
          style={{
            ...styles.registerBtn,
            opacity: pendingList.length === 0 || !!progress ? 0.5 : 1,
            cursor: pendingList.length === 0 || !!progress ? 'not-allowed' : 'pointer',
          }}
          onClick={handleBulkRegister}
          disabled={pendingList.length === 0 || !!progress}
        >
          {progress
            ? `${progress.current}/${progress.total} 등록 중...`
            : `일괄 등록 (${pendingList.length}개)`}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1, overflowY: 'auto', padding: '16px',
    maxWidth: '640px', margin: '0 auto', width: '100%', boxSizing: 'border-box',
  },
  section: {
    backgroundColor: '#FFFFFF', borderRadius: '12px',
    border: '1px solid #E5E7EB', padding: '16px', marginBottom: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '12px',
  },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1F2937' },
  sectionNote: { fontSize: '12px', color: '#9CA3AF', fontWeight: '500' },
  fixedList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fixedCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 14px', backgroundColor: '#F9FAFB',
    borderRadius: '8px', border: '1px solid #E5E7EB',
  },
  fixedDayBadge: {
    color: '#FFFFFF', fontSize: '13px', fontWeight: '700',
    padding: '5px 10px', borderRadius: '6px', whiteSpace: 'nowrap',
  },
  fixedInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  fixedTitle: { fontSize: '15px', fontWeight: '600', color: '#1F2937' },
  fixedTime: { fontSize: '12px', color: '#6B7280' },
  lockIcon: { fontSize: '16px' },
  formGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  formRowHalf: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  input: {
    padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB',
    fontSize: '15px', color: '#1F2937', boxSizing: 'border-box',
    outline: 'none', width: '100%',
  },
  select: {
    padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB',
    fontSize: '15px', color: '#1F2937', backgroundColor: '#FFFFFF',
    boxSizing: 'border-box', outline: 'none', width: '100%',
  },
  addBtn: {
    marginTop: '12px', width: '100%', padding: '12px', borderRadius: '8px',
    border: 'none', backgroundColor: '#1E3A8A', color: '#FFFFFF',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer', minHeight: '44px',
  },
  pendingCount: { fontSize: '14px', fontWeight: '700', color: '#6366F1' },
  pendingList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  pendingCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', backgroundColor: '#F9FAFB',
    borderRadius: '8px', border: '1px solid #E5E7EB',
  },
  pendingDot: { width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0 },
  pendingInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  pendingTitle: { fontSize: '15px', fontWeight: '600', color: '#1F2937' },
  pendingMeta: { fontSize: '12px', color: '#6B7280' },
  removeBtn: {
    background: 'none', border: 'none', color: '#9CA3AF',
    cursor: 'pointer', fontSize: '16px', padding: '4px',
    minWidth: '32px', minHeight: '32px',
  },
  progressBox: {
    margin: '8px 0', padding: '16px', backgroundColor: '#EFF6FF',
    borderRadius: '8px', border: '1px solid #BFDBFE',
  },
  progressText: {
    fontSize: '15px', color: '#1E40AF', fontWeight: '600',
    display: 'block', marginBottom: '10px',
  },
  progressTrack: {
    height: '8px', backgroundColor: '#BFDBFE',
    borderRadius: '4px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#1E3A8A',
    borderRadius: '4px', transition: 'width 0.3s',
  },
  resultBox: {
    padding: '14px', borderRadius: '8px', border: '2px solid',
    backgroundColor: '#F0FDF4', marginBottom: '8px', textAlign: 'center',
  },
  resultText: { fontSize: '16px', fontWeight: '700', color: '#059669' },
  registerRow: { paddingBottom: '24px' },
  registerBtn: {
    width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
    backgroundColor: '#059669', color: '#FFFFFF', fontSize: '17px',
    fontWeight: '700', minHeight: '56px', transition: 'opacity 0.2s',
  },
};
