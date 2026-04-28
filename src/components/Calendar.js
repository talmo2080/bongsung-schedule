import React, { useState } from 'react';
import { MEMBERS, CATEGORIES, WEEKDAYS, MONTHS } from '../constants/data';
import { parseEventDescription, parseEventSummary } from '../utils/googleCalendar';
import EventModal from './EventModal';

export default function Calendar({
  currentUser,
  isSignedIn,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  events,
  onRefresh,
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterMember, setFilterMember] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  function getColorForEvent(ev) {
    // 1순위: description의 두 번째 필드(카테고리/작성자/상세)
    const { author: authorFromDesc } = parseEventDescription(ev.description);
    // 2순위: summary의 [작성자] 형식
    const { author: authorFromSummary } = parseEventSummary(ev.summary);
    const authorName = (authorFromDesc || authorFromSummary || '').trim();

    if (authorName) {
      const member = MEMBERS.find(m => m.name === authorName);
      if (member) return member.color;
    }

    // 3순위: description 또는 summary 전체 텍스트에서 구성원 이름 직접 검색
    const fullText = `${ev.summary || ''} ${ev.description || ''}`;
    const found = MEMBERS.find(m => fullText.includes(m.name));
    return found?.color || '#94A3B8';
  }

  function filterEvents(evs) {
    return evs.filter(ev => {
      const { author } = parseEventSummary(ev.summary);
      const { category } = parseEventDescription(ev.description);
      const memberOk = filterMember === 'ALL' || author === filterMember;
      const catOk = filterCategory === 'ALL' || category === filterCategory;
      return memberOk && catOk;
    });
  }

  function getEventsForDay(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const filtered = filterEvents(events);

    const dayEvents = filtered.filter(ev => {
      // split('T')[0] 대신 substring(0,10) 사용: "+09:00", "Z" 모두 안전 처리
      const start = ev.start?.date || ev.start?.dateTime?.substring(0, 10);
      const end = ev.end?.date || ev.end?.dateTime?.substring(0, 10);
      return start <= dateStr && dateStr <= (end || start);
    });

    // 같은 날 동일 제목 중복 제거 (정기일정 중복 등록 방지)
    const seen = new Set();
    return dayEvents.filter(ev => {
      const key = (ev.summary || ev.id || '').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function handleDayClick(day) {
    if (!isSignedIn) {
      alert('구글 캘린더 연결 후 일정을 등록할 수 있습니다.\n헤더의 [구글 연결] 버튼을 눌러주세요.');
      return;
    }
    const d = new Date(year, month, day);
    setSelectedDate(d);
    setSelectedEvent(null);
    setShowModal(true);
  }

  function handleEventClick(e, ev) {
    e.stopPropagation();
    if (!isSignedIn) {
      alert('구글 캘린더 연결 후 일정을 수정할 수 있습니다.');
      return;
    }
    const parsedSummary = parseEventSummary(ev.summary);
    const parsedDesc = parseEventDescription(ev.description);
    setSelectedEvent({ ...ev, parsedSummary, parsedDesc });
    setSelectedDate(null);
    setShowModal(true);
  }

  function handleSave(data) {
    if (data.id) return onUpdateEvent(data.id, data);
    return onCreateEvent(data);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div style={styles.container}>
      {/* 필터 */}
      <div style={styles.filterRow}>
        <select
          style={styles.filterSelect}
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
        >
          <option value="ALL">전체 구성원</option>
          {MEMBERS.map(m => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <select
          style={styles.filterSelect}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="ALL">전체 카테고리</option>
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button style={styles.refreshBtn} onClick={onRefresh} title="새로고침">↺</button>
      </div>

      {/* 월 네비게이션 */}
      <div style={styles.nav}>
        <button style={styles.navBtn} onClick={prevMonth}>‹</button>
        <div style={styles.navCenter}>
          <span style={styles.navTitle}>{year}년 {MONTHS[month]}</span>
          <button style={styles.todayBtn} onClick={goToday}>오늘</button>
        </div>
        <button style={styles.navBtn} onClick={nextMonth}>›</button>
      </div>

      {/* 요일 헤더 */}
      <div style={styles.weekHeader}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} style={{ ...styles.weekDay, color: i === 0 ? '#DC2626' : i === 6 ? '#2563EB' : '#6B7280' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={styles.grid}>
        {Array.from({ length: totalCells }).map((_, idx) => {
          const day = idx - firstDay + 1;
          const isValid = day >= 1 && day <= daysInMonth;
          const dayEvents = isValid ? getEventsForDay(day) : [];
          const dow = idx % 7;
          const isSun = dow === 0;
          const isSat = dow === 6;

          return (
            <div
              key={idx}
              style={{
                ...styles.cell,
                backgroundColor: isValid && isToday(day) ? '#FEF3C7' : '#FFFFFF',
                cursor: isValid ? 'pointer' : 'default',
                borderLeft: isSun ? 'none' : '1px solid #E5E7EB',
              }}
              onClick={() => isValid && handleDayClick(day)}
            >
              {isValid && (
                <>
                  <span style={{
                    ...styles.dayNum,
                    color: isSun ? '#DC2626' : isSat ? '#2563EB' : '#1F2937',
                    fontWeight: isToday(day) ? '700' : '400',
                  }}>
                    {day}
                  </span>
                  <div style={styles.eventList}>
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        style={{ ...styles.eventChip, backgroundColor: getColorForEvent(ev) }}
                        onClick={(e) => handleEventClick(e, ev)}
                        title={ev.summary}
                      >
                        {ev.summary?.replace(/^\[.+?\]\s*/, '').slice(0, 10)}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={styles.moreChip}>+{dayEvents.length - 3}개</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div style={styles.legend}>
        <span style={styles.legendTitle}>구성원:</span>
        {MEMBERS.map(m => (
          <span key={m.id} style={styles.legendItem}>
            <span style={{ ...styles.dot, backgroundColor: m.color }} />
            {m.name}
          </span>
        ))}
      </div>

      {showModal && (
        <EventModal
          event={selectedEvent}
          selectedDate={selectedDate}
          currentUser={currentUser}
          onSave={handleSave}
          onDelete={onDeleteEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid #E5E7EB',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1.5px solid #D1D5DB',
    fontSize: '14px',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: '44px',
    flex: '1 1 140px',
  },
  refreshBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1.5px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: '20px',
    cursor: 'pointer',
    minHeight: '44px',
    minWidth: '44px',
    color: '#374151',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '2px solid #E5E7EB',
  },
  navBtn: {
    background: 'none',
    border: '1.5px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 14px',
    color: '#374151',
    minHeight: '44px',
    minWidth: '44px',
  },
  navCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1F2937',
  },
  todayBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1.5px solid #1E3A8A',
    backgroundColor: '#FFFFFF',
    color: '#1E3A8A',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: '44px',
  },
  weekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '2px solid #E5E7EB',
  },
  weekDay: {
    textAlign: 'center',
    padding: '10px 0',
    fontSize: '15px',
    fontWeight: '700',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderTop: '1px solid #E5E7EB',
  },
  cell: {
    minHeight: '90px',
    borderBottom: '1px solid #E5E7EB',
    padding: '4px 4px 4px 6px',
    position: 'relative',
    transition: 'background-color 0.1s',
  },
  dayNum: {
    fontSize: '16px',
    display: 'block',
    marginBottom: '2px',
    lineHeight: 1.4,
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  eventChip: {
    fontSize: '11px',
    color: '#FFFFFF',
    borderRadius: '4px',
    padding: '2px 5px',
    cursor: 'pointer',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontWeight: '600',
    lineHeight: 1.4,
  },
  moreChip: {
    fontSize: '11px',
    color: '#6B7280',
    padding: '2px 4px',
    fontWeight: '600',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '12px 16px',
    borderTop: '2px solid #E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  legendTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#374151',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#374151',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
};
