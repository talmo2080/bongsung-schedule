import React, { useState } from 'react';
import { MEMBERS } from '../constants/data';

const BG_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E5E7EB' fill-opacity='0.7'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

export default function UserSelect({ onSelect }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div style={{ ...styles.container, backgroundImage: BG_PATTERN }}>
      <div style={styles.inner}>
        {/* 로고 & 타이틀 */}
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <span style={styles.logoIcon}>🌸</span>
          </div>
          <h1 style={styles.title}>봉숭아학당</h1>
          <p style={styles.subtitle}>업무 스케줄 관리</p>
        </div>

        <div style={styles.divider} />

        <p style={styles.guide}>사용자를 선택하세요</p>

        <div style={styles.grid}>
          {MEMBERS.map((member) => {
            const isHovered = hoveredId === member.id;
            return (
              <button
                key={member.id}
                style={{
                  ...styles.card,
                  backgroundColor: member.color,
                  transform: isHovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
                  boxShadow: isHovered
                    ? `0 16px 36px ${member.color}55, 0 4px 12px rgba(0,0,0,0.18)`
                    : `0 4px 14px ${member.color}44, 0 1px 4px rgba(0,0,0,0.10)`,
                }}
                onMouseEnter={() => setHoveredId(member.id)}
                onMouseLeave={() => setHoveredId(null)}
                onTouchStart={() => setHoveredId(member.id)}
                onTouchEnd={() => setHoveredId(null)}
                onClick={() => onSelect(member)}
              >
                <span style={styles.personIcon}>👤</span>
                <span style={styles.name}>{member.name}</span>
                <span style={styles.memberTitle}>{member.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    backgroundSize: '60px 60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '520px',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '24px',
    padding: '40px 32px 36px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid rgba(229,231,235,0.8)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  logoWrap: {
    marginBottom: '10px',
  },
  logoIcon: {
    fontSize: '44px',
  },
  title: {
    fontSize: '34px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6B7280',
    margin: 0,
    letterSpacing: '0.5px',
  },
  divider: {
    width: '48px',
    height: '3px',
    borderRadius: '2px',
    backgroundColor: '#1E3A8A',
    margin: '20px 0 18px',
    opacity: 0.5,
  },
  guide: {
    fontSize: '16px',
    color: '#374151',
    marginBottom: '20px',
    fontWeight: '500',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '14px',
    width: '100%',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '26px 16px 22px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    minHeight: '120px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    gap: '5px',
  },
  personIcon: {
    fontSize: '26px',
    marginBottom: '4px',
  },
  name: {
    fontSize: '21px',
    fontWeight: '700',
    color: '#FFFFFF',
    textShadow: '0 1px 3px rgba(0,0,0,0.25)',
  },
  memberTitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
};
