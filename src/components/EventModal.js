import React, { useState, useEffect } from 'react';
import { CATEGORIES, MEMBERS, RECURRENCE_OPTIONS } from '../constants/data';

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
  const [recurrence, setRecurrence] = useState('NONE');
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

      if (rec && rec.length > 0) {
        const match = rec[0].match(/FREQ=(\w+)/);
        if (match) setRecurrence(match[1]);
      }
    } else if (selectedDate) {
      const d = toDateStr(selectedDate);
      setStartDate(d);
      setEndDate(d);
    }
  }, [event, selectedDate, currentUser.name, isEdit]);

  function toDateStr(d) {
    return d.toISOString().split('T')[0];
  }

  function toTimeStr(d) {
    return d.toTimeString().slice(0, 5);
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
        recurrence,
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
              <input
                type="date"
                style={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {!isAllDay && (
                <input
                  type="time"
                  style={styles.input}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              )}
            </div>
            <div style={styles.dateGroup}>
              <label style={styles.label}>종료일</label>
              <input
                type="date"
                style={styles.input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {!isAllDay && (
                <input
                  type="time"
                  style={styles.input}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              )}
            </div>
          </div>

          <label style={styles.label}>반복</label>
          <select style={styles.select} value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            {RECURRENCE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

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
            <button
              style={styles.deleteBtn}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          )}
          <div style={styles.footerRight}>
            <button style={styles.cancelBtn} onClick={onClose}>취소</button>
            <button
              style={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
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
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #E5E7EB',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6B7280',
    padding: '4px 8px',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: '16px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  label: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
    marginTop: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1.5px solid #D1D5DB',
    fontSize: '16px',
    color: '#1F2937',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: '4px',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1.5px solid #D1D5DB',
    fontSize: '16px',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1.5px solid #D1D5DB',
    fontSize: '16px',
    color: '#1F2937',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '14px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  checkLabel: {
    fontSize: '16px',
    color: '#374151',
    cursor: 'pointer',
  },
  dateRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  dateGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderTop: '1px solid #E5E7EB',
    gap: '10px',
  },
  footerRight: {
    display: 'flex',
    gap: '10px',
    marginLeft: 'auto',
  },
  cancelBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1.5px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: '44px',
  },
  saveBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#1E3A8A',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: '44px',
  },
  deleteBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: '44px',
  },
};
