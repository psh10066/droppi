# MetaProfile 통합 스키마

사용자의 자기 이해 전체를 담는 최상위 구조.
28세션 축적된 보경의 메타프로필을 서비스 스키마로 변환한 것.

---

## MetaProfile 인터페이스

```typescript
interface MetaProfile {
  // === 지금 나의 프레임 ===
  essence: EssenceProfile;
  currentFrame: {
    summary: string;           // "손 닿는 곳의 아늑함을 모으는 사람"
    patterns: Pattern[];
    lastUpdated: string;
  };

  // === 프레임이 바뀐 순간들 ===
  breakthroughs: Breakthrough[];

  // === 아직 안 깨진 것 ===
  blindSpots: string[];

  // === 축적 데이터 ===
  insights: InsightLog[];
  sessions: SessionSummary[];
  tensions: TensionItem[];
  monthlyFlows: MonthlyFlow[];

  // === 변화 추적 ===
  essenceHistory: EssenceChange[];
  keywordTrend: KeywordTrend[];

  // === 시간축 ===
  timeline: TimelineEntry[];

  // === 메타 ===
  sessionCount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 하위 인터페이스

### Pattern
```typescript
interface Pattern {
  id: string;
  description: string;          // "만드는 건 빠른데 닫는 게 안 된다"
  confirmedCount: number;
  firstSeen: string;
  connectedEssence?: string;    // 관련 에센스 헤드라인 키워드
  status: 'active' | 'challenged' | 'broken';
}
```

### Breakthrough
```typescript
interface Breakthrough {
  date: string;
  sessionNumber: number;
  before: string;               // "취향이 부족하다"
  after: string;                // "나만의 목소리를 미루고 있었다"
  trigger: string;              // 무엇이 계기였나
}
```

### BlindSpots
`string[]` — 반복되지만 한 번도 흔들려본 적 없는 프레임.
예: "이름을 붙이면 다룰 수 있게 된다 — 23세션 작동, 한계 지점 1회 감지"

### KeywordTrend
```typescript
interface KeywordTrend {
  keyword: string;
  counts: { week: string; count: number }[];
}
```

### TensionItem
```typescript
interface TensionItem {
  text: string;
  status: "active" | "structural" | "dormant" | "absorbed";
  lastMentioned: string;
  sessionCount: number;
}
```

### EssenceChange
```typescript
interface EssenceChange {
  before: string;       // previous headline
  after: string;        // new headline
  narrative: string;    // "미니멀에서 따뜻한 쪽으로"
  triggerTags: string[];
}
```

### MonthlyFlow
```typescript
interface MonthlyFlow {
  period: string;                    // "2026-03"
  topicDistribution: TagCount[];
  styleDistribution: TagCount[];
  dominantTopic: string;
  dominantStyle: string;
  previousComparison?: string;
}
```

---

## 시간축 데이터 구조

"그때의 나"를 시간순으로 볼 수 있게 하는 타임라인.
에센스가 바뀌고, 패턴이 발견되고, 깨지는 순간들이 기록된다.

```typescript
interface TimelineEntry {
  date: string;
  type: 'essence_created' | 'essence_changed' | 'pattern_found'
      | 'pattern_broken' | 'breakthrough';
  title: string;
  before?: string;    // essence_changed, pattern_broken, breakthrough에서 사용
  after?: string;
  sessionId?: string;
}
```

### 타임라인 기록 규칙

| 이벤트 | type | title 예시 | before/after |
|--------|------|-----------|-------------|
| 첫 사진 분석 | essence_created | "첫 에센스: 손 닿는 곳의 아늑함을 모으는 사람" | - |
| 에센스 변화 | essence_changed | "에센스 변화" | "손 닿는 곳의 아늑함" → "열린 곳에서 혼자 숨 쉬기" |
| 패턴 발견 | pattern_found | "만드는 건 빠른데 닫는 게 안 된다" | - |
| 패턴 깨짐 | pattern_broken | "방법론 쌓기 = 실행 대체" | "방법론을 쌓는 게 실행을 대체한다" → "일하면서 방법을 만드는 게 작동 방식 자체다" |
| 돌파 | breakthrough | "에이전트 시스템 재정의" | before/after 그대로 |

---

## 업데이트 규칙

| 트리거 | 업데이트 대상 | 조건 |
|--------|-------------|------|
| 새 읽기 추가 | `essence`, `essenceHistory`, `monthlyFlows` | 이전 에센스와 비교, 태그 집계 갱신 |
| 대화에서 발견 | `insights`, `keywordTrend` | 즉시 |
| 패턴 3회 확인 | `currentFrame.patterns` | confirmedCount 증가 |
| 패턴 깨짐 감지 | `breakthroughs`, `timeline` | 사용자 확인 후 |
| 3세션 미언급 | `tensions` 감쇠 | Active → Dormant 제안 |
| 세션 종료 | `sessions` | 자동 |

---

## 실제 예시 (보경의 메타프로필)

```json
{
  "currentFrame": {
    "summary": "손 닿는 곳의 아늑함을 모으는 사람",
    "patterns": [
      {
        "description": "만드는 건 빠른데 닫는 게 안 된다",
        "confirmedCount": 5,
        "status": "active"
      },
      {
        "description": "방법론을 쌓는 게 실행을 대체한다",
        "confirmedCount": 3,
        "status": "challenged"
      }
    ]
  },
  "breakthroughs": [
    {
      "before": "에이전트 시스템 구축은 유혹이다",
      "after": "일하면서 일하는 방법을 만드는 게 작동 방식 자체다",
      "trigger": "취소건 매핑 중 adversarial refinement 발견"
    }
  ],
  "blindSpots": [
    "이름을 붙이면 다룰 수 있게 된다 — 23세션 작동, 한계 지점 1회 감지",
    "밖으로 꺼내면 이해가 깊어진다 — 안으로 들어오는 것의 가치 미탐색"
  ],
  "timeline": [
    {
      "date": "2025-12-31",
      "type": "essence_created",
      "title": "첫 에센스: 손 닿는 곳의 아늑함을 모으는 사람",
      "sessionId": "session-1"
    },
    {
      "date": "2026-02-10",
      "type": "pattern_found",
      "title": "만드는 건 빠른데 닫는 게 안 된다",
      "sessionId": "session-8"
    },
    {
      "date": "2026-03-15",
      "type": "breakthrough",
      "title": "에이전트 시스템 재정의",
      "before": "에이전트 시스템 구축은 유혹이다",
      "after": "일하면서 일하는 방법을 만드는 게 작동 방식 자체다",
      "sessionId": "session-22"
    }
  ]
}
```

---

## 저장소

Supabase 테이블에 분산 저장. MetaProfile은 클라이언트에서 여러 테이블을 조합해서 구성한다.

```typescript
// Supabase 테이블 → MetaProfile 매핑
// essence         → essence_profiles 테이블 (최신 1건, dimensions 없음)
// essenceHistory  → essence_profiles 테이블 (전체 이력)
// monthlyFlows    → monthly_flows 테이블 (월별 태그 분포)
// insights        → insights 테이블
// sessions        → sessions + messages 테이블
// timeline        → 각 테이블의 created_at 기반 조합
```

| 항목 | 상태 | 이유 |
|------|------|------|
| 인증/로그인 | 텔레그램 uid 기반 자동 식별 | 별도 로그인 없음. 텔레그램에서 시작하면 uid로 자동 매칭 |
| 멀티 유저 | RLS로 격리 | 각 사용자는 자기 데이터만 접근 |
| 외부 API | 안 함 | 사용자가 직접 붙여넣기 |

---

*Source: ralphton-core-engine.md MetaProfile 섹션*
