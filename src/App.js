import React, { useState, useEffect, useCallback } from 'react';
import UserSelect from './components/UserSelect';
import Header from './components/Header';
import Calendar from './components/Calendar';
import {
  initializeGapi,
  signIn,
  signOut,
  isSignedIn,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from './utils/googleCalendar';

const USER_KEY = 'bongsung_user';

// 다음 해당 요일 날짜 반환 (YYYY-MM-DD)
function nextWeekday(dayCode) {
  const map = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const target = map[dayCode];
  const today = new Date();
  let diff = target - today.getDay();
  if (diff <= 0) diff += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toISOString().split('T')[0];
}

const PRESET_EVENTS = [
  {
    title: '싱글벙글나비축제',
    author: '정세연',
    category: '나비문화축제',
    description: '',
    startDate: `${nextWeekday('MO')}T19:00:00`,
    endDate: `${nextWeekday('MO')}T21:00:00`,
    isAllDay: false,
    recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
  },
  {
    title: '스피치사관학교',
    author: '정세연',
    category: '방송스피치 사관학교',
    description: '',
    startDate: `${nextWeekday('TU')}T19:00:00`,
    endDate: `${nextWeekday('TU')}T22:00:00`,
    isAllDay: false,
    recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=TU,WE',
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [signedIn, setSignedIn] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [presetDone, setPresetDone] = useState(false);

  useEffect(() => {
    initializeGapi((autoSignedIn) => {
      setSignedIn(autoSignedIn);
    });
  }, []);

  const loadEvents = useCallback(async () => {
    if (!isSignedIn()) return;
    setLoading(true);
    try {
      const now = new Date();
      const min = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const max = new Date(now.getFullYear(), now.getMonth() + 4, 1);
      const evs = await listEvents(min, max);
      setEvents(evs);
    } catch (e) {
      console.error('일정 로딩 오류:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (signedIn) loadEvents();
  }, [signedIn, loadEvents]);

  function handleSelectUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }

  async function handleSignIn() {
    try {
      await signIn();
      setSignedIn(true);
    } catch (e) {
      console.error('로그인 오류:', e);
      alert('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
    }
  }

  function handleSignOut() {
    signOut();
    setSignedIn(false);
    setEvents([]);
    // 사용자 선택은 유지 (토큰만 삭제)
  }

  async function handleCreateEvent(data) {
    const ev = await createEvent(data);
    await loadEvents();
    return ev;
  }

  async function handleUpdateEvent(id, data) {
    const ev = await updateEvent(id, data);
    await loadEvents();
    return ev;
  }

  async function handleDeleteEvent(id) {
    await deleteEvent(id);
    await loadEvents();
  }

  async function handleSetupPresets() {
    if (!window.confirm('정기 일정 2개를 구글 캘린더에 등록하시겠습니까?\n\n• 싱글벙글나비축제 (매주 월요일 19:00~21:00)\n• 스피치사관학교 (매주 화·수요일 19:00~22:00)')) return;
    setLoading(true);
    try {
      for (const ev of PRESET_EVENTS) {
        await createEvent(ev);
      }
      await loadEvents();
      setPresetDone(true);
      alert('정기 일정이 등록되었습니다!');
    } catch (e) {
      alert('등록 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser) {
    return <UserSelect onSelect={handleSelectUser} />;
  }

  return (
    <div style={styles.app}>
      <Header
        currentUser={currentUser}
        onChangeUser={() => setCurrentUser(null)}
        isSignedIn={signedIn}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
      {loading && (
        <div style={styles.loadingBar}>
          <span style={styles.loadingText}>처리 중...</span>
        </div>
      )}
      {!signedIn && (
        <div style={styles.notice}>
          <span>구글 캘린더와 연결하면 일정을 저장하고 공유할 수 있습니다.</span>
          <button style={styles.noticeBtn} onClick={handleSignIn}>구글 연결하기</button>
        </div>
      )}
      {signedIn && !presetDone && (
        <div style={styles.presetBar}>
          <span style={styles.presetText}>정기 일정(나비축제·스피치)을 아직 등록하지 않으셨나요?</span>
          <button style={styles.presetBtn} onClick={handleSetupPresets}>정기일정 등록</button>
        </div>
      )}
      <Calendar
        currentUser={currentUser}
        isSignedIn={signedIn}
        events={events}
        onCreateEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        onRefresh={loadEvents}
      />
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    backgroundColor: '#FFFFFF', fontFamily: "'Noto Sans KR', sans-serif",
  },
  loadingBar: {
    backgroundColor: '#EFF6FF', padding: '10px 20px',
    textAlign: 'center', borderBottom: '1px solid #BFDBFE',
  },
  loadingText: { fontSize: '14px', color: '#1E40AF', fontWeight: '500' },
  notice: {
    backgroundColor: '#FFFBEB', border: '1px solid #FCD34D',
    padding: '12px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
    fontSize: '15px', color: '#92400E', fontWeight: '500',
  },
  noticeBtn: {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    backgroundColor: '#1E3A8A', color: '#FFFFFF', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', minHeight: '44px', whiteSpace: 'nowrap',
  },
  presetBar: {
    backgroundColor: '#F0FDF4', border: '1px solid #86EFAC',
    padding: '10px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
    fontSize: '14px', color: '#166534',
  },
  presetText: { fontWeight: '500' },
  presetBtn: {
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    backgroundColor: '#059669', color: '#FFFFFF', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', minHeight: '44px', whiteSpace: 'nowrap',
  },
};
