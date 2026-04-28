import React, { useState, useMemo } from 'react';
import { MEMBERS } from '../constants/data';
import { parseEventDescription, parseEventSummary } from '../utils/googleCalendar';

const KR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekBounds(offset = 0) {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: toDateStr(monday),
    end: toDateStr(sunday),
  };
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function getEventTime(ev) {
  if (ev.start?.date) return ''; // 종일
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

function getAuthor(ev) {
  const { author: a1 } = parseEventDescription(ev.description);
  const { author: a2 } = parseEventSummary(ev.summary);
  return (a1 || a2 || '').trim();
}

function getTitle(ev) {
  const { title } = parseEventSummary(ev.summary);
  return title || ev.summary || '';
}

function getLocation(ev) {
  const { detail } = parseEventDescription(ev.description);
  return detail?.trim() || '';
}

export default function NoticeList({ events, onClose }) {
  const thisWeek = getWeekBounds(0);
  const [startDate, setStartDate] = useState(thisWeek.start);
  const [endDate, setEndDate] = useState(thisWeek.end);
  const [copied, setCopied] = useState(false);

  function setPreset(offset) {
    const { start, end } = getWeekBounds(offset);
    setStartDate(start);
    setEndDate(end);
  }

  // 날짜 범위 내 일정 필터 + 날짜순 정렬
  const filteredEvents = useMemo(() => {
    return events
      .filter(ev => {
        const d = getEventStartDate(ev);
        return d >= startDate && d <= endDate;
      })
      .sort((a, b) => getEventStartDate(a).localeCompare(getEventStartDate(b)));
  }, [events, startDate, endDate]);

  // 구성원별 그룹화
  const grouped = useMemo(() => {
    const map = {};
    MEMBERS.forEach(m => { map[m.name] = []; });
    filteredEvents.forEach(ev => {
      const author = getAuthor(ev);
      if (map[author]) {
        map[author].push(ev);
      }
    });
    return map;
  }, [filteredEvents]);

  // 카카오톡 공유 텍스트 생성
  function buildCopyText() {
    const sd = formatDisplayDate(startDate);
    const ed = formatDisplayDate(endDate);
    let text = `📅 봉숭아학당 주간 일정\n(${sd} ~ ${ed})\n`;

    let hasAny = false;
    MEMBERS.forEach(m => {
      const evs = grouped[m.name];
      if (!evs || evs.length === 0) return;
      hasAny = true;
      text += `\n👤 ${m.name} ${m.title}\n`;
      evs.forEach(ev => {
        const date = formatDisplayDate(getEventStartDate(ev));
        const startT = getEventTime(ev);
        const endT = getEventEndTime(ev);
        const loc = getLocation(ev);
        const ttl = getTitle(ev);

        let line = `• ${date}`;
        if (startT) line += ` ${startT}${endT ? `~${endT}` : ''}`;
        if (loc) line += ` ${loc}`;
        line += ` ${ttl}`;
        text += line + '\n';
      });
    });

    if (!hasAny) text += '\n(해당 기간 일정 없음)\n';
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

  const activeMembers = MEMBERS.filter(m => grouped[m.name]?.length > 0);

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.panel}>
        {/* 헤더 */}
        <div style={styles.header}>
          <h2 style={styles.title}>공지 목록</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 기간 선택 */}
        <div style={styles.periodSection}>
          <div style={styles.presetRow}>
            <button style={styles.presetBtn} onClick={() => setPreset(-1)}>지난 주</button>
            <button style={{ ...styles.presetBtn, backgroundColor: '#1E3A8A', color: '#FFF' }}
              onClick={() => setPreset(0)}>이번 주</button>
            <button style={styles.presetBtn} onClick={() => setPreset(1)}>다음 주</button>
          </div>
          <div style={styles.dateRangeRow}>
            <input type="date" style={styles.dateInput} value={startDate}
              onChange={e => setStartDate(e.target.value)} />
            <span style={styles.dateSep}>~</span>
            <input type="date" style={styles.dateInput} value={endDate}
              onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* 일정 목록 */}
        <div style={styles.body}>
          {activeMembers.length === 0 ? (
            <div style={styles.empty}>해당 기간에 등록된 일정이 없습니다.</div>
          ) : (
            activeMembers.map(m => (
              <div key={m.name} style={styles.memberSection}>
                <div style={{ ...styles.memberBadge, backgroundColor: m.color }}>
                  <span style={styles.badgeName}>👤 {m.name}</span>
                  <span style={styles.badgeTitle}>{m.title}</span>
                </div>
                <div style={styles.eventList}>
                  {grouped[m.name].map((ev, i) => {
                    const startT = getEventTime(ev);
                    const endT = getEventEndTime(ev);
                    const loc = getLocation(ev);
                    return (
                      <div key={ev.id || i} style={styles.eventRow}>
                        <span style={styles.eventDate}>{formatDisplayDate(getEventStartDate(ev))}</span>
                        {startT && (
                          <span style={styles.eventTime}>{startT}{endT ? `~${endT}` : ''}</span>
                        )}
                        {loc && <span style={styles.eventLoc}>{loc}</span>}
                        <span style={styles.eventTitle}>{getTitle(ev)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 푸터 */}
        <div style={styles.footer}>
          <span style={styles.countText}>
            총 {filteredEvents.length}개 일정 / {activeMembers.length}명
          </span>
          <button style={{ ...styles.copyBtn, backgroundColor: copied ? '#059669' : '#F59E0B' }}
            onClick={handleCopy}>
            {copied ? '✓ 복사됨!' : '📋 카카오톡 복사'}
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
  panel: {
    backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%',
    maxWidth: '560px', maxHeight: '92vh', display: 'flex',
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
  periodSection: { padding: '12px 24px', borderBottom: '1px solid #F3F4F6' },
  presetRow: { display: 'flex', gap: '8px', marginBottom: '10px' },
  presetBtn: {
    flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #D1D5DB',
    backgroundColor: '#F9FAFB', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', color: '#374151', minHeight: '44px',
  },
  dateRangeRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  dateInput: {
    flex: 1, padding: '10px 12px', borderRadius: '8px',
    border: '1.5px solid #D1D5DB', fontSize: '15px', outline: 'none',
  },
  dateSep: { fontSize: '16px', color: '#6B7280', fontWeight: '600' },
  body: { flex: 1, overflowY: 'auto', padding: '16px 24px' },
  empty: { textAlign: 'center', color: '#9CA3AF', fontSize: '16px', padding: '40px 0' },
  memberSection: { marginBottom: '20px' },
  memberBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '8px 16px', borderRadius: '10px', marginBottom: '10px',
  },
  badgeName: { fontSize: '16px', fontWeight: '700', color: '#FFFFFF' },
  badgeTitle: { fontSize: '12px', color: 'rgba(255,255,255,0.85)' },
  eventList: { paddingLeft: '8px' },
  eventRow: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center',
    gap: '6px', padding: '8px 12px', marginBottom: '4px',
    backgroundColor: '#F9FAFB', borderRadius: '8px',
    borderLeft: '3px solid #E5E7EB',
  },
  eventDate: { fontSize: '14px', fontWeight: '700', color: '#1E3A8A', whiteSpace: 'nowrap' },
  eventTime: { fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' },
  eventLoc: {
    fontSize: '13px', color: '#FFFFFF', backgroundColor: '#6B7280',
    padding: '1px 7px', borderRadius: '4px', whiteSpace: 'nowrap',
  },
  eventTitle: { fontSize: '14px', color: '#1F2937', fontWeight: '500', flex: 1 },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 24px', borderTop: '1px solid #E5E7EB',
  },
  countText: { fontSize: '14px', color: '#6B7280' },
  copyBtn: {
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    color: '#FFFFFF', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', minHeight: '44px', transition: 'background-color 0.3s',
  },
};
