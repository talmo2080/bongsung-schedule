import React, { useState, useEffect, useCallback } from 'react';
import UserSelect from './components/UserSelect';
import Header from './components/Header';
import Calendar from './components/Calendar';
import BulkAdd from './components/BulkAdd';
import NoticeList from './components/NoticeList';
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
    title: '방송스피치사관학교 26기',
    author: '정세연',
    category: '방송스피치 사관학교',
    description: '',
    startDate: `${nextWeekday('TU')}T19:00:00`,
    endDate: `${nextWeekday('TU')}T22:00:00`,
    isAllDay: false,
    recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=TU',
  },
  {
    title: '방송스피치사관학교 25기',
    author: '정세연',
    category: '방송스피치 사관학교',
    description: '',
    startDate: `${nextWeekday('WE')}T19:00:00`,
    endDate: `${nextWeekday('WE')}T22:00:00`,
    isAllDay: false,
    recurrenceRule: 'RRULE:FREQ=WEEKLY;BYDAY=WE',
  },
];

const TABS = [
  { key: 'calendar', label: '캘린더' },
  { key: 'bulk', label: '일괄등록' },
  { key: 'notice', label: '공지목록' },
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
  const [activeTab, setActiveTab] = useState('calendar');

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
  }

  async function handleCreateEvent(data) {
    const ev = await createEvent(data);
    await loadEvents();
    return ev;
  }

  // 일괄 등록용: 개별 생성, 완료 후 loadEvents는 BulkAdd에서 onDone으로 호출
  async function handleCreateEventSingle(data) {
    return await createEvent(data);
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
    if (!window.confirm(
      '정기 일정 3개를 구글 캘린더에 등록하시겠습니까?\n\n' +
      '• 싱글벙글나비축제 (매주 월요일 19:00~21:00)\n' +
      '• 방송스피치사관학교 26기 (매주 화요일 19:00~22:00)\n' +
      '• 방송스피치사관학교 25기 (매주 수요일 19:00~22:00)'
    )) return;
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

      {/* 탭 네비게이션 */}
      <div style={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            style={{ ...styles.tabBtn, ...(activeTab === tab.key ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
          <span style={styles.presetText}>정기 일정(나비축제·스피치 25/26기)을 아직 등록하지 않으셨나요?</span>
          <button style={styles.presetBtn} onClick={handleSetupPresets}>정기일정 등록</button>
        </div>
      )}

      {/* 탭 콘텐츠 */}
      <div style={styles.content}>
        {activeTab === 'calendar' && (
          <Calendar
            currentUser={currentUser}
            isSignedIn={signedIn}
            events={events}
            onCreateEvent={handleCreateEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onRefresh={loadEvents}
          />
        )}
        {activeTab === 'bulk' && (
          <BulkAdd
            currentUser={currentUser}
            isSignedIn={signedIn}
            onSave={handleCreateEventSingle}
            onDone={loadEvents}
          />
        )}
        {activeTab === 'notice' && (
          <NoticeList events={events} />
        )}
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    backgroundColor: '#FFFFFF', fontFamily: "'Noto Sans KR', sans-serif",
  },
  tabBar: {
    display: 'flex', borderBottom: '2px solid #E5E7EB',
    backgroundColor: '#FFFFFF', position: 'sticky', top: '66px', zIndex: 90,
  },
  tabBtn: {
    flex: 1, padding: '12px 0', border: 'none', background: 'none',
    fontSize: '15px', fontWeight: '600', color: '#6B7280',
    cursor: 'pointer', borderBottom: '3px solid transparent',
    transition: 'all 0.15s',
  },
  tabBtnActive: {
    color: '#1E3A8A',
    borderBottom: '3px solid #1E3A8A',
    backgroundColor: '#F8FAFF',
  },
  content: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
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
