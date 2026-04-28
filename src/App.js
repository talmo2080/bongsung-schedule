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

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [signedIn, setSignedIn] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeGapi(() => {
      setSignedIn(isSignedIn());
    });
  }, []);

  const loadEvents = useCallback(async () => {
    if (!signedIn) return;
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
  }, [signedIn]);

  useEffect(() => {
    if (signedIn) loadEvents();
  }, [signedIn, loadEvents]);

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

  async function handleUpdateEvent(id, data) {
    const ev = await updateEvent(id, data);
    await loadEvents();
    return ev;
  }

  async function handleDeleteEvent(id) {
    await deleteEvent(id);
    await loadEvents();
  }

  if (!currentUser) {
    return <UserSelect onSelect={setCurrentUser} />;
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
          <span style={styles.loadingText}>일정 불러오는 중...</span>
        </div>
      )}
      {!signedIn && (
        <div style={styles.notice}>
          <span>구글 캘린더와 연결하면 일정을 저장하고 공유할 수 있습니다.</span>
          <button style={styles.noticeBtn} onClick={handleSignIn}>구글 연결하기</button>
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
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  loadingBar: {
    backgroundColor: '#EFF6FF',
    padding: '10px 20px',
    textAlign: 'center',
    borderBottom: '1px solid #BFDBFE',
  },
  loadingText: {
    fontSize: '14px',
    color: '#1E40AF',
    fontWeight: '500',
  },
  notice: {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FCD34D',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '15px',
    color: '#92400E',
    fontWeight: '500',
  },
  noticeBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#1E3A8A',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: '44px',
    whiteSpace: 'nowrap',
  },
};
