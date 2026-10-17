import { Task, Habit, Note } from '../types';

export const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Q4 분기 핵심 프로덕트 런칭 로드맵 검토',
    description: '주요 피처 스펙 확정 및 팀 내 스프린트 일정 조율하기',
    category: 'work',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-10-17',
    subtasks: [
      { id: 'st-1', title: '사용자 피드백 데이터 취합', completed: true },
      { id: 'st-2', title: '핵심 요구사항 문서 최종 검토', completed: true },
      { id: 'st-3', title: '디자인 및 엔지니어링 리소스 배분', completed: false },
    ],
    createdAt: '2026-10-15',
  },
  {
    id: 't-2',
    title: '신규 UI 컴포넌트 라이브러리 리팩토링',
    description: '웹 접근성(WCAG AA) 및 모바일 반응형 최적화 점검',
    category: 'study',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-10-18',
    subtasks: [
      { id: 'st-4', title: '포커스 링 및 명도 대비 4.5:1 검증', completed: false },
      { id: 'st-5', title: '터치 타깃 최소 44px 크기 확보', completed: false },
    ],
    createdAt: '2026-10-16',
  },
  {
    id: 't-3',
    title: '주간 회고 및 다음 주 우선순위 3가지 선정',
    description: '성과 정리와 병목 지점 파악하여 개선 루틴 도출',
    category: 'personal',
    priority: 'medium',
    status: 'completed',
    dueDate: '2026-10-17',
    subtasks: [
      { id: 'st-6', title: '완료된 마일스톤 점검', completed: true },
      { id: 'st-7', title: '다음 주 캘린더 블로킹', completed: true },
    ],
    createdAt: '2026-10-14',
  },
  {
    id: 't-4',
    title: '저녁 유산소 러닝 5km & 스트레칭',
    description: '체력 증진 및 리프레시를 위한 가벼운 조깅',
    category: 'health',
    priority: 'low',
    status: 'todo',
    dueDate: '2026-10-17',
    subtasks: [],
    createdAt: '2026-10-17',
  },
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'h-1',
    title: '기상 직후 미온수 500ml 음용',
    category: 'health',
    streak: 12,
    targetDaysPerWeek: 7,
    reminderTime: '07:30',
    history: {
      '2026-10-11': true,
      '2026-10-12': true,
      '2026-10-13': true,
      '2026-10-14': true,
      '2026-10-15': true,
      '2026-10-16': true,
      '2026-10-17': true,
    },
  },
  {
    id: 'h-2',
    title: '기술 도서 또는 아티클 20분 독서',
    category: 'study',
    streak: 8,
    targetDaysPerWeek: 5,
    reminderTime: '21:00',
    history: {
      '2026-10-11': true,
      '2026-10-12': true,
      '2026-10-13': false,
      '2026-10-14': true,
      '2026-10-15': true,
      '2026-10-16': true,
      '2026-10-17': false,
    },
  },
  {
    id: 'h-3',
    title: '딥워크 몰입 뽀모도로 2세트 달성',
    category: 'work',
    streak: 5,
    targetDaysPerWeek: 5,
    reminderTime: '10:00',
    history: {
      '2026-10-12': true,
      '2026-10-13': true,
      '2026-10-14': true,
      '2026-10-15': true,
      '2026-10-16': true,
      '2026-10-17': false,
    },
  },
  {
    id: 'h-4',
    title: '하루 10분 감사 일기 & 아이디어 정리',
    category: 'personal',
    streak: 4,
    targetDaysPerWeek: 7,
    reminderTime: '22:30',
    history: {
      '2026-10-13': true,
      '2026-10-14': true,
      '2026-10-15': true,
      '2026-10-16': true,
      '2026-10-17': false,
    },
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n-1',
    title: '생산성을 3배 끌어올리는 딥워크 원칙',
    category: 'work',
    tags: ['포커스', '원칙', '효율'],
    pinned: true,
    updatedAt: '2026-10-17 11:20',
    content: `## 딥워크(Deep Work) 핵심 요약
1. **주의력 잔여물 줄이기**: 작업 전환을 최소화하고 50분 단위 단일 태스크 몰입
2. **사전 환경 셋팅**: 스마트폰 무음, 브라우저 탭 정리, 백색소음 가동
3. **하루 핵심 3가지(The Rule of 3)**: 매일 아침 완료 시 큰 임팩트를 주는 3가지를 정하고 우선 처리`,
  },
  {
    id: 'n-2',
    title: '디자인 시스템 아키텍처 아이디어',
    category: 'study',
    tags: ['UI/UX', '디자인', '시스템'],
    pinned: false,
    updatedAt: '2026-10-16 16:45',
    content: `### 핵심 컴포넌트 구조
- 디자인 토큰: Spacing, Radius, Color, Typography
- WCAG AA 명도 대비 4.5:1 철저 준수
- 무분별한 뱃지/필 태그 남용 금지, 타이포그래픽 구분점('·') 활용
- 상태 표현은 색상에만 의존하지 않고 라벨/아이콘 병행 표기`,
  },
  {
    id: 'n-3',
    title: '올해 읽고 싶은 추천 도서 리스트',
    category: 'personal',
    tags: ['독서', '자기계발'],
    pinned: false,
    updatedAt: '2026-10-15 20:10',
    content: `1. **아주 작은 습관의 힘** - 제임스 클리어
2. **딥워크** - 칼 뉴포트
3. **도둑맞은 집중력** - 요한 하리
4. **생각의 탄생** - 로버트 루트번스타인`,
  },
];

export const STORAGE_KEYS = {
  TASKS: 'flowspace_tasks',
  HABITS: 'flowspace_habits',
  NOTES: 'flowspace_notes',
  ONE_GOAL: 'flowspace_one_goal',
  TODAY_FOCUS_MINUTES: 'flowspace_focus_minutes',
};

export function loadStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function saveStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}
