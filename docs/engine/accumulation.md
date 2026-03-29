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
  essenceUpdate?: {
    before: string;   // previous headline
    after: string;    // new headline
    narrative: string; // "공간에서 사람 쪽으로 이동"
  };
  tensionDecay: TensionItem[];
  monthlyFlow: MonthlyFlow;
}

interface MonthlyFlow {
  period: string;                    // "2026-03"
  topicDistribution: TagCount[];     // [{tag: "여행", count: 5}, {tag: "음식", count: 3}]
  styleDistribution: TagCount[];     // [{tag: "따뜻한", count: 4}, {tag: "빈티지", count: 3}]
  dominantTopic: string;             // "여행"
  dominantStyle: string;             // "따뜻한"
  previousComparison?: string;       // "지난달은 공간이 주였는데, 이번 달은 여행으로 옮겨감"
  newTags: string[];                 // 이번 달에 처음 등장한 태그
}

interface TagCount {
  tag: string;
  count: number;
}

interface WeeklyReport {
  period: string;
  movingToward: string;
  previousComparison?: string;
  topTopics: TagCount[];        // was topKeywords
  topStyles: TagCount[];        // NEW
  newInsights: InsightLog[];
  patternUpdate?: string;
  tagShift?: string;            // "여행에서 음식 쪽으로 관심 이동"
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
  before: string;       // previous headline
  after: string;        // new headline
  narrative: string;    // "미니멀에서 따뜻한 쪽으로"
  triggerTags: string[]; // 변화를 촉발한 태그들
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

## 시간 흐름 (Temporal Flow)

읽기가 쌓이면서 주제·스타일의 흐름이 보인다. 단순 시간순 나열이 아니라, 어떤 분야와 감각이 언제 두드러졌는지 보여준다.

### 월별 흐름

매월 주제 태그와 스타일 태그의 분포를 집계한다.

예시:
- 3월: 여행 40%, 음식 30%, 공간 20% / 스타일: 따뜻한 우세
- 4월: 일 50%, 사람 25% / 스타일: 묵직한 우세
- → "3월에는 따뜻한 여행·음식 위주였는데, 4월에 일과 사람 쪽으로 넘어감"

### 흐름 생성 규칙
1. 해당 월의 모든 읽기에서 태그 집계
2. 상위 3개 주제 + 상위 3개 스타일 추출
3. 이전 월과 비교 → 이동 방향 서술
4. 새로 등장한 태그 감지
5. 사라진 태그 감지 (이전 월 상위에 있다가 이번 월에 0인 것)

### 톤
"이번 달은 여기를 맴돌고 있었어요" 정도의 가벼움. 진단하지 않음. 관찰만.
"여행에서 일로 넘어갔다"는 좋고 나쁨이 아니라 움직임일 뿐.

---

## 시스템 프롬프트

```
당신은 사용자의 자기 이해가 축적되는 과정을 관리하는 엔진입니다.

## 처리 규칙

### 반복 키워드: 의미적 반복 감지. 사용자 표현 보존.
### 클러스터링: 사용자 언어로 이름. 성장/정체 판단.
### 에센스 변화: 한 줄이 어떻게 바뀌었는지 + 내러티브 한 문장.
### 긴장 감쇠: Active/Structural/Dormant/Absorbed 규칙 적용.
### 리포트: "이번 주 당신은 여기를 맴돌고 있었어요" 톤. 이전 기간 대비 변화 포함.
### 시간 흐름: 월별 주제·스타일 분포 집계. 이전 월 대비 이동 방향.

## 출력 형식
{
  "repeatingKeywords": [...],
  "insightClusters": [...],
  "essenceUpdate": null 또는 {...},
  "tensionDecay": [...],
  "monthlyFlow": {...},
  "weeklyReport": {
    "period": "...",
    "movingToward": "...",
    "previousComparison": "지난주 대비 ...",
    "topTopics": [...],
    "topStyles": [...],
    "newInsights": [...],
    "patternUpdate": "...",
    "tagShift": "..."
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
