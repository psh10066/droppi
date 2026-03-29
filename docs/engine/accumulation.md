# Engine 3: 축적 (Accumulation Engine)

시간이 지날수록 떠날 수 없게 만드는 엔진.
1회는 대체 가능하지만 30회는 불가능하게.

---

## 입력/출력 인터페이스

```typescript
// 입력
interface AccumulationInput {
  essence: EssenceProfile;
  insightLog: InsightLog[];
  sessionHistory: SessionSummary[];
  newImages?: string[];
}

interface InsightLog {
  text: string;
  tags: string[];
  connectedEssence?: string;
  sessionId: string;
  createdAt: string;
}

interface SessionSummary {
  id: string;
  date: string;
  articleTitle?: string;
  insights: InsightLog[];
  essenceConnections: string[];
}

// 출력
interface ProfileUpdate {
  repeatingKeywords: string[];
  insightClusters: InsightCluster[];
  essenceChange?: EssenceChange;
  tensionDecay: TensionItem[];
}

interface WeeklyReport {
  period: string;
  movingToward: string;       // "이번 주 관심사의 방향"
  previousComparison?: string; // "지난주 대비 변화"
  topKeywords: string[];
  newInsights: InsightLog[];
  patternUpdate?: string;
  timelineEvents?: TimelineEntry[];  // 이 기간의 변화 이벤트
}
```

---

## 처리 파이프라인

```
1. 인사이트 간 패턴 감지 → 반복 키워드 + 주제 클러스터
2. 에센스 변화 추적 (새 사진 추가 시)
3. 긴장 감쇠 관리
4. 시간의 흐름 기록 (타임라인)
5. 주기적 리포트 생성
```

### 1. 반복 키워드 추출
- 단순 빈도가 아니라 의미적 반복을 감지
- "통제", "컨트롤", "관리" → 하나의 클러스터
- 사용자의 원래 표현 보존

### 2. 인사이트 클러스터링

```typescript
interface InsightCluster {
  theme: string;       // "통제와 내려놓기" (사용자 언어에서)
  insights: InsightLog[];
  firstSeen: string;
  lastSeen: string;
}
```

클러스터가 성장하고 있는지, 정체되었는지 판단한다.

### 3. 에센스 변화 추적

```typescript
interface EssenceChange {
  before: EssenceProfile;
  after: EssenceProfile;
  changedDimensions: string[];
  narrative: string;  // "미니멀에서 따뜻한 쪽으로"
}
```

---

## 긴장 감쇠 관리

```typescript
interface TensionItem {
  text: string;
  status: "active" | "structural" | "dormant" | "absorbed";
  lastMentioned: string;
  sessionCount: number;
}
```

| 상태 | 조건 | 대화에서의 취급 |
|------|------|---------------|
| Active | 최근 3세션 내 언급 | 맥락으로 자연스럽게 가져올 수 있음 |
| Structural | 여러 세션에 걸쳐 반복 확인 | 배경으로 인지. 직접 꺼내진 않음 |
| Dormant | 3세션 이상 미언급 | 사용자가 먼저 꺼내지 않는 한 절대 언급 안 함 |
| Absorbed | 상위 패턴에 흡수됨 | 독립 항목으로 존재하지 않음 |

전이 규칙:
- **승격**: Dormant가 대화에서 3회 자연 발생 → Active로 승격 제안
- **냉각**: Active가 3세션 연속 미언급 → Dormant로 냉각 제안

---

## 시간의 흐름 표현

축적 엔진의 핵심 — "그때의 나"를 시간순으로 볼 수 있게 만든다.

### 에센스 변화 기록
3개월 전엔 "손 닿는 곳의 아늑함"이었는데 지금은 "열린 곳에서 혼자 숨 쉬기"로 바뀌었다 — 이런 변화를 추적하고 보여준다. 에센스가 바뀔 때마다 `essenceHistory`에 before/after가 쌓인다.

### 패턴의 생애주기
패턴은 고정된 게 아니라 살아있는 가설이다.

```
발견 → 확인(2~3회 반복) → 도전(반례 등장) → 깨짐 or 흡수
```

- **발견**: 처음 감지. "만드는 건 빠른데 닫는 게 안 된다"
- **확인**: 여러 세션에서 반복. confirmedCount 증가
- **도전**: "이번엔 닫았잖아?" 같은 반례. status → challenged
- **깨짐**: 더 이상 유효하지 않음. breakthrough로 기록
- **흡수**: 상위 패턴에 합쳐짐. 독립 항목에서 제거

### 주간/월간 리포트에 시간 비교 포함
- 주간: "이번 주 관심사는 여기로 움직이고 있어요" + "지난주와 비교하면..."
- 월간: 에센스 변화 + 반복 키워드 맵 + 이전 달 대비 변화
- N세션 후: "나의 변화사" 타임라인

톤: 분석 보고서가 아니라 "이번 주 당신은 여기를 맴돌고 있었어요" 정도의 가벼움. 진단하지 않음. 관찰만.

---

## 주제 클러스터 (Theme Clusters)

읽기가 쌓이면서 비슷한 것끼리 묶이는 구조. 세션 날짜별이 아니라 주제별로 축적된다.

### 인터페이스

```typescript
interface ThemeCluster {
  id: string;
  label: string;              // "안전한 구석" (사용자 언어에서)
  keywords: string[];
  readingIds: string[];
  readingCount: number;
  conversationCount: number;
  recentActivity: string;
  createdAt: string;
  updatedAt: string;
}
```

### 생성 로직
1. 새 읽기의 태그에서 키워드 추출
2. 기존 주제의 키워드와 의미 유사도 비교 (LLM)
3. 유사도 높으면 기존 주제에 추가
4. 없으면 새 읽기로 대기
5. 3개 이상 읽기가 모이면 주제로 승격

### 클러스터링 규칙
- 키워드가 아니라 "의미"로 묶는다
- 라벨은 사용자의 언어에서 가져온다
- 3개 이상의 읽기가 모여야 주제로 인정
- 한 읽기가 여러 주제에 속할 수 있음

---

## 시스템 프롬프트

```
당신은 사용자의 자기 이해가 축적되는 과정을 관리하는 엔진입니다.

## 처리 규칙

### 반복 키워드: 의미적 반복 감지. 사용자 표현 보존.
### 클러스터링: 사용자 언어로 이름. 성장/정체 판단.
### 에센스 변화: 어떤 축이 바뀌었는지 + 내러티브 한 문장.
### 긴장 감쇠: Active/Structural/Dormant/Absorbed 규칙 적용.
### 리포트: "이번 주 당신은 여기를 맴돌고 있었어요" 톤. 이전 기간 대비 변화 포함.

## 출력 형식
{
  "repeatingKeywords": [...],
  "insightClusters": [...],
  "essenceChange": null 또는 {...},
  "tensionDecay": [...],
  "weeklyReport": {
    "period": "...",
    "movingToward": "...",
    "previousComparison": "지난주 대비 ...",
    "topKeywords": [...],
    "newInsights": [...],
    "patternUpdate": "..."
  }
}

## 하지 않는 것
- 패턴을 결론으로 확정하지 않음 (가설로 유지)
- 사용자의 언어를 AI 용어로 치환하지 않음
- Dormant 항목을 능동적으로 꺼내지 않음
- 변화를 좋고 나쁨으로 판단하지 않음 ("성장했네요" 금지)
```

---

*Source: ralphton-core-engine.md Engine 3*
