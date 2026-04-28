export const MEMBERS = [
  { id: 'sung', name: '성창운', title: '총장', color: '#1E3A8A' },
  { id: 'oh', name: '오행자', title: '교수', color: '#DC2626' },
  { id: 'lee', name: '이문태', title: '교수', color: '#7C3AED' },
  { id: 'choi', name: '최일례', title: '교수', color: '#EA580C' },
  { id: 'jo', name: '조현정', title: '부장', color: '#059669' },
  { id: 'jung', name: '정세연', title: '편집국장', color: '#0891B2' },
];

export const CATEGORIES = [
  { id: 'butterfly', name: '나비문화축제', color: '#EC4899' },
  { id: 'broadcast', name: '방송스피치 사관학교', color: '#0F766E' },
  { id: 'ai_media', name: 'AI 미디어교육', color: '#6366F1' },
  { id: 'ai_book', name: 'AI 책쓰기', color: '#B45309' },
  { id: 'other_class', name: '기타강좌', color: '#64748B' },
  { id: 'meeting', name: '회의', color: '#2563EB' },
  { id: 'lecture', name: '강의', color: '#16A34A' },
  { id: 'event', name: '행사', color: '#DC2626' },
  { id: 'workshop', name: '워크샵', color: '#9333EA' },
  { id: 'picnic', name: '야유회', color: '#F59E0B' },
  { id: 'silver', name: '실버체조', color: '#0EA5E9' },
  { id: 'janggu', name: '웃자장구공연단', color: '#F43F5E' },
  { id: 'etc', name: '기타', color: '#94A3B8' },
];

export const RECURRENCE_OPTIONS = [
  { value: 'NONE', label: '반복 없음' },
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '매주' },
  { value: 'MONTHLY', label: '매월' },
  { value: 'YEARLY', label: '매년' },
];

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// 매주 반복되는 고정 정기 일정 (수정/삭제 불가)
export const FIXED_EVENTS = [
  { day: '월', rruleDay: 'MO', title: '싱글벙글나비축제', category: '나비문화축제', author: '정세연', startTime: '19:00', endTime: '21:00' },
  { day: '화', rruleDay: 'TU', title: '방송스피치사관학교 26기', category: '방송스피치 사관학교', author: '정세연', startTime: '19:00', endTime: '22:00' },
  { day: '수', rruleDay: 'WE', title: '방송스피치사관학교 25기', category: '방송스피치 사관학교', author: '정세연', startTime: '19:00', endTime: '22:00' },
];
