import React from 'react';


export default function Header({ currentUser, onChangeUser, isSignedIn, onSignIn, onSignOut }) {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <h1 style={styles.title}>봉숭아학당 스케줄 앱</h1>
      </div>
      <div style={styles.right}>
        <div
          style={{ ...styles.userBadge, backgroundColor: currentUser.color }}
          onClick={onChangeUser}
          title="사용자 변경"
        >
          <span style={styles.userName}>{currentUser.name}</span>
          <span style={styles.userTitle}>{currentUser.title}</span>
        </div>
        {isSignedIn ? (
          <button style={styles.signBtn} onClick={onSignOut}>로그아웃</button>
        ) : (
          <button style={{ ...styles.signBtn, backgroundColor: '#1E3A8A' }} onClick={onSignIn}>
            구글 연결
          </button>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E5E7EB',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    minWidth: '70px',
  },
  userName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 1.2,
  },
  userTitle: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.2,
  },
  signBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6B7280',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: '44px',
    minWidth: '44px',
  },
};
