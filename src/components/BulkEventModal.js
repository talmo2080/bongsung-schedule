import React, { useState } from 'react';
import { MEMBERS, CATEGORIES } from '../constants/data';

export default function BulkEventModal({ onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [selectedIds, setSelectedIds] = useState([]);
  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState('');

  function toggleMember(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function selectAll() { setSelectedIds(MEMBERS.map(m => m.id)); }
  function clearAll() { setSelectedIds([]); }

  async function handleSave() {
    if (!title.trim()) { alert('일정 제목을 입력해 주세요.'); return; }
    if (selectedIds.length === 0) { alert('구성원을 1명 이상 선택해 주세요.'); return; }
    if (!date) { alert('날짜를 선택해 주세요.'); return; }

    setSaving(true);
    try {
      for (let i = 0; i < selectedIds.length; i++) {
        const member = MEMBERS.find(m => m.id === selectedIds[i]);
        setProgress(`${member.name} 등록 중... (${i + 1}/${selectedIds.length})`);
        await onSave({
          title: title.trim(),
          author: member.name,
          category,
          description: location,
          startDate: isAllDay ? date : `${date}T${startTime}:00`,
          endDate: isAllDay ? date : `${date}T${endTime}:00`,
          isAllDay,
          recurrenceRule: null,
        });
      }
      alert(`${selectedIds.length}명의 일정이 등록되었습니다!`);
      onClose();
    } catch (e) {
      alert('저장 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setSaving(false);
      setProgress('');
    }
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>일괄 일정 등록</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {/* 날짜 */}
          <label style={styles.label}>날짜 *</label>
          <input type="date" style={styles.input} value={date}
            onChange={e => setDate(e.target.value)} />

          {/* 구성원 */}
          <div style={styles.memberHeader}>
            <span style={styles.label}>구성원 선택 * ({selectedIds.length}명 선택)</span>
            <div style={styles.selBtns}>
              <button style={styles.selBtn} onClick={selectAll}>전체</button>
              <button style={styles.selBtn} onClick={clearAll}>해제</button>
            </div>
          </div>
          <div style={styles.memberGrid}>
            {MEMBERS.map(m => {
              const checked = selectedIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  style={{
                    ...styles.memberCard,
                    backgroundColor: checked ? m.color : '#F9FAFB',
                    border: `2px solid ${checked ? m.color : '#E5E7EB'}`,
                  }}
                  onClick={() => toggleMember(m.id)}
                >
                  <span style={{ ...styles.memberName, color: checked ? '#FFFFFF' : '#1F2937' }}>
                    {m.name}
                  </span>
                  <span style={{ ...styles.memberRole, color: checked ? 'rgba(255,255,255,0.8)' : '#6B7280' }}>
                    {m.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 제목 */}
          <label style={styles.label}>일정 제목 *</label>
          <input style={styles.input} value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="일정 제목을 입력하세요" />

          {/* 종일 */}
          <div style={styles.checkRow}>
            <input type="checkbox" id="bulk-allday" checked={isAllDay}
              onChange={e => setIsAllDay(e.target.checked)} style={styles.checkbox} />
            <label htmlFor="bulk-allday" style={styles.checkLabel}>종일 일정</label>
          </div>

          {/* 시간 */}
          {!isAllDay && (
            <div style={styles.timeRow}>
              <div style={styles.timeGroup}>
                <label style={styles.label}>시작 시간</label>
                <input type="time" style={styles.input} value={startTime}
                  onChange={e => setStartTime(e.target.value)} />
              </div>
              <div style={styles.timeGroup}>
                <label style={styles.label}>종료 시간</label>
                <input type="time" style={styles.input} value={endTime}
                  onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          {/* 장소 */}
          <label style={styles.label}>장소 (선택)</label>
          <input style={styles.input} value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="장소를 입력하세요" />

          {/* 카테고리 */}
          <label style={styles.label}>카테고리</label>
          <select style={styles.select} value={category}
            onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* 미리보기 */}
          {selectedIds.length > 0 && title && (
            <div style={styles.preview}>
              <p style={styles.previewTitle}>등록 미리보기</p>
              {selectedIds.map(id => {
                const m = MEMBERS.find(x => x.id === id);
                return (
                  <div key={id} style={styles.previewItem}>
                    <span style={{ ...styles.previewDot, backgroundColor: m.color }} />
                    <span style={styles.previewText}>
                      [{m.name}] {title}
                      {!isAllDay && ` ${startTime}~${endTime}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {saving && progress && (
            <p style={styles.progressText}>{progress}</p>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose} disabled={saving}>취소</button>
          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? '등록 중...' : `${selectedIds.length}명 일괄 등록`}
          </button>
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
    maxWidth: '520px', maxHeight: '92vh', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px 14px', borderBottom: '1px solid #E5E7EB',
  },
  title: { fontSize: '20px', fontWeight: '700', color: '#1F2937', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
    color: '#6B7280', minWidth: '44px', minHeight: '44px',
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
    boxSizing: 'border-box', outline: 'none',
  },
  select: {
    width: '100%', padding: '12px 14px', borderRadius: '8px',
    border: '1.5px solid #D1D5DB', fontSize: '16px', color: '#1F2937',
    backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none',
  },
  memberHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '14px', marginBottom: '8px',
  },
  selBtns: { display: 'flex', gap: '6px' },
  selBtn: {
    padding: '4px 10px', borderRadius: '6px', border: '1px solid #D1D5DB',
    backgroundColor: '#F9FAFB', fontSize: '13px', cursor: 'pointer', color: '#374151',
  },
  memberGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
  },
  memberCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '12px 8px', borderRadius: '10px', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  memberName: { fontSize: '15px', fontWeight: '700', lineHeight: 1.3 },
  memberRole: { fontSize: '11px', lineHeight: 1.3 },
  checkRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer' },
  checkLabel: { fontSize: '16px', color: '#374151', cursor: 'pointer' },
  timeRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  timeGroup: { display: 'flex', flexDirection: 'column' },
  preview: {
    marginTop: '16px', padding: '14px', backgroundColor: '#F8FAFF',
    borderRadius: '10px', border: '1px solid #DBEAFE',
  },
  previewTitle: { fontSize: '13px', fontWeight: '700', color: '#1E40AF', margin: '0 0 8px 0' },
  previewItem: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  previewDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  previewText: { fontSize: '14px', color: '#374151' },
  progressText: { fontSize: '14px', color: '#059669', fontWeight: '600', marginTop: '8px', textAlign: 'center' },
  footer: {
    display: 'flex', gap: '10px', justifyContent: 'flex-end',
    padding: '14px 24px', borderTop: '1px solid #E5E7EB',
  },
  cancelBtn: {
    padding: '12px 20px', borderRadius: '8px', border: '1.5px solid #D1D5DB',
    backgroundColor: '#FFFFFF', color: '#374151', fontSize: '16px',
    fontWeight: '600', cursor: 'pointer', minHeight: '44px',
  },
  saveBtn: {
    padding: '12px 24px', borderRadius: '8px', border: 'none',
    backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '16px',
    fontWeight: '600', cursor: 'pointer', minHeight: '44px',
  },
};
