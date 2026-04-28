import React, { useState, useMemo } from 'react';
import { CATEGORIES, FIXED_EVENTS } from '../constants/data';
import { parseEventDescription, parseEventSummary } from '../utils/googleCalendar';

const KR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekBounds(offset = 0) {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateStr(monday), end: toDateStr(sunday) };
}

function getMonthBounds(offset = 0) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: toDateStr(start), end: toDateStr(end) };
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = KR_DAYS[d.getDay()];
  return `${m}/${day}(${wd})`;
}

function getEventStartDate(ev) {
  return ev.start?.date || ev.start?.dateTime?.substring(0, 10) || '';
}

function getEventStartDatetime(ev) {
  return ev.start?.dateTime || ev.start?.date || '';
}

function getEventTime(ev) {
  if (ev.start?.date) return '';
  const dt = ev.start?.dateTime || '';
  const m = dt.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '';
}

function getEventEndTime(ev) {
  if (ev.end?.date) return '';
  const dt = ev.end?.dateTime || '';
  const m = dt.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '';
}

function getTitle(ev) {
  const { title } = parseEventSummary(ev.summary);
  return title || ev.summary || '';
}

function getCategory(ev) {
  const { category } = parseEventDescription(ev.description);
  return category || '';
}

// 기간 내 고정 일정 발생일 생성
function generateFixedOccurrences(startDate, endDate) {
  const result = [];
  const dowMap = { '월': 1, '화': 2, '수': 3 };
  const current = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  while (current <= end) {
    const dow = current.getDay();
    FIXED_EVENTS.forEach(fe => {
      if (dow === dowMap[fe.day]) {
        const dateStr = toDateStr(current);
        result.push({
          id: `fixed-${fe.title}-${dateStr}`,
          summary: `[${fe.author}] ${fe.title}`,
          description: `${fe.category}/${fe.author}/`,
          start: { dateTime: `${dateStr}T${fe.startTime}:00+09:00` },
          end: { dateTime: `${dateStr}T${fe.endTime}:00+09:00` },
          isFixed: true,
        });
      }
    });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export default function NoticeList({ events }) {
  const thisWeek = getWeekBounds(0);
  const [period, setPeriod] = useState('week');
  const [startDate, setStartDate] = useState(thisWeek.start);
  const [endDate, setEndDate] = useState(thisWeek.end);
  const [copied, setCopied] = useState(false);

  function handlePeriod(p) {
    setPeriod(p);
    if (p === 'week') {
      const { start, end } = getWeekBounds(0);
      setStartDate(start);
      setEndDate(end);
    } else if (p === 'month') {
      const { start, end } = getMonthBounds(0);
      setStartDate(start);
      setEndDate(end);
    }
  }

  const filteredEvents = useMemo(() => {
    // 구글 캘린더 이벤트 필터
    const gcal = events.filter(ev => {
      const d = getEventStartDate(ev);
      return d >= startDate && d <= endDate;
    });

    // 고정 일정 발생일 생성
    const fixed = generateFixedOccurrences(startDate, endDate);

    // 병합 + 중복 제거 (구글 캘린더 이벤트 우선)
    const seen = new Set();
    const merged = [];
    [...gcal, ...fixed].forEach(ev => {
      const key = `${getTitle(ev)}|${getEventStartDate(ev)}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(ev);
      }
    });

    return merged.sort((a, b) =>
      getEventStartDatetime(a).localeCompare(getEventStartDatetime(b))
    );
  }, [events, startDate, endDate]);

  function buildCopyText() {
    const divider = '─────────────────';
    let text = `📅 수요봉숭아학당 일정안내\n${divider}\n`;
    if (filteredEvents.length === 0) {
      text += '(해당 기간 일정 없음)\n';
    } else {
      filteredEvents.forEach(ev => {
        const date = formatDisplayDate(getEventStartDate(ev));
        const startT = getEventTime(ev);
        const endT = getEventEndTime(ev);
        const ttl = getTitle(ev);
        let line = `📌 ${date} ${ttl}`;
        if (startT) line += ` (${startT}${endT ? `~${endT}` : ''})`;
        text += line + '\n';
      });
    }
    text += `${divider}\n봉숭아학당 드림 🌸`;
    return text;
  }

  async function handleCopy() {
    const text = buildCopyText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert(text);
    }
  }

  const getCategoryColor = (catName) =>
    CATEGORIES.find(c => c.name === catName)?.color || '#94A3B8';

  return (
    <div style={styles.container}>
      {/* 기간 선택 */}
      <div style={styles.periodSection}>
        <div style={styles.periodBtnRow}>
          {[
            { key: 'week', label: '이번 주' },
            { key: 'month', label: '이번 달' },
            { key: 'custom', label: '직접 선택' },
          ].map(p => (
            <button
              key={p.key}
              style={{ ...styles.periodBtn, ...(period === p.key ? styles.periodBtnActive : {}) }}
              onClick={() => handlePeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div style={styles.dateRangeRow}>
            <input type="date" style={styles.dateInput} value={startDate}
              onChange={e => setStartDate(e.target.value)} />
            <span style={styles.dateSep}>~</span>
            <input type="date" style={styles.dateInput} value={endDate}
              onChange={e => setEndDate(e.target.value)} />
          </div>
        )}
        <div style={styles.periodSummary}>
          {formatDisplayDate(startDate)} ~ {formatDisplayDate(endDate)}
          <span style={styles.countBadge}>{filteredEvents.length}개</span>
        </div>
      </div>

      {/* 일정 목록 */}
      <div style={styles.listContainer}>
        {filteredEvents.length === 0 ? (
          <div style={styles.empty}>해당 기간에 등록된 일정이 없습니다.</div>
        ) : (
          filteredEvents.map((ev, i) => {
            const catName = getCategory(ev);
            const catColor = getCategoryColor(catName);
            const startT = getEventTime(ev);
            const endT = getEventEndTime(ev);
            return (
              <div key={ev.id || i} style={{ ...styles.eventRow, borderLeft: `4px solid ${catColor}` }}>
                <div style={styles.eventLeft}>
                  <span style={styles.eventDate}>{formatDisplayDate(getEventStartDate(ev))}</span>
                  {startT && (
                    <span style={styles.eventTime}>{startT}{endT ? `~${endT}` : ''}</span>
                  )}
                </div>
                <div style={styles.eventRight}>
                  <span style={styles.eventTitle}>{getTitle(ev)}</span>
                  <div style={styles.eventTags}>
                    {catName && (
                      <span style={{ ...styles.catChip, backgroundColor: catColor }}>{catName}</span>
                    )}
                    {ev.isFixed && (
                      <span style={styles.fixedChip}>고정</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 카카오톡 복사 버튼 */}
      <div style={styles.footer}>
        <button
          style={{ ...styles.copyBtn, backgroundColor: copied ? '#059669' : '#F59E0B' }}
          onClick={handleCopy}
        >
          {copied ? '✓ 복사됨!' : '📋 카카오톡 공유용 텍스트 복사'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1, display: 'flex', flexDirection: 'column',
    backgroundColor: '#F9FAFB', overflow: 'hidden',
  },
  periodSection: {
    backgroundColor: '#FFFFFF', padding: '14px 16px',
    borderBottom: '1px solid #E5E7EB', flexShrink: 0,
  },
  periodBtnRow: { display: 'flex', gap: '8px', marginBottom: '10px' },
  periodBtn: {
    flex: 1, padding: '10px', borderRadius: '8px',
    border: '1.5px solid #D1D5DB', backgroundColor: '#F9FAFB',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#374151', minHeight: '44px',
  },
  periodBtnActive: {
    backgroundColor: '#1E3A8A', color: '#FFFFFF', borderColor: '#1E3A8A',
  },
  dateRangeRow: {
    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
  },
  dateInput: {
    flex: 1, padding: '10px 12px', borderRadius: '8px',
    border: '1.5px solid #D1D5DB', fontSize: '15px', outline: 'none',
  },
  dateSep: { fontSize: '16px', color: '#6B7280', fontWeight: '600' },
  periodSummary: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', color: '#6B7280',
  },
  countBadge: {
    fontSize: '12px', fontWeight: '700', color: '#1E3A8A',
    backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '10px',
  },
  listContainer: { flex: 1, overflowY: 'auto', padding: '12px 16px' },
  empty: { textAlign: 'center', color: '#9CA3AF', fontSize: '16px', padding: '60px 0' },
  eventRow: {
    display: 'flex', gap: '12px', padding: '12px 14px',
    backgroundColor: '#FFFFFF', borderRadius: '10px', marginBottom: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  eventLeft: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '76px' },
  eventDate: { fontSize: '14px', fontWeight: '700', color: '#1E3A8A', whiteSpace: 'nowrap' },
  eventTime: { fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' },
  eventRight: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  eventTitle: { fontSize: '15px', fontWeight: '600', color: '#1F2937' },
  eventTags: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  catChip: {
    fontSize: '11px', color: '#FFFFFF', padding: '2px 8px',
    borderRadius: '4px', fontWeight: '600', whiteSpace: 'nowrap',
  },
  fixedChip: {
    fontSize: '11px', color: '#6B7280', padding: '2px 8px',
    borderRadius: '4px', fontWeight: '600',
    backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
  },
  footer: {
    padding: '14px 16px', borderTop: '2px solid #E5E7EB',
    backgroundColor: '#FFFFFF', flexShrink: 0,
  },
  copyBtn: {
    width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
    color: '#FFFFFF', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', minHeight: '52px', transition: 'background-color 0.3s',
  },
};
