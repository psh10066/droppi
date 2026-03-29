# 랄프톤 — API 설계

---

## 웹앱 API (7개)

### POST `/api/analyze`

입력(사진/글/링크/메모) → 읽기 결과 + 에센스 분석(사진일 때).

```json
// 요청
{ "type": "image" | "text" | "link" | "memo", "content": "..." }

// 응답
{
  "reading": {
    "insight": "등 뒤가 막혀있어야 안심이 되는 거 아닐까",
    "observation": "사진 속 카페는 구석 자리, 낮은 조명, 혼자 앉는 크기",
    "topicTags": ["공간"],
    "styleTags": ["따뜻한", "고요한"],
    "firstQuestion": "뭔가 떠오르면 말해줘요"
  },
  "essence": {
    "headline": "안전한 구석에서 전체를 보는 사람",
    "palette": ["#C4A882", "#D4A5A5", "#8FA68E", "#FAF6F1", "#3D3632"],
    "topTopics": ["공간"],
    "topStyles": ["따뜻한", "고요한"]
  }
}
```

> `essence` 필드는 type이 `image`일 때만 포함된다.

### POST `/api/chat`

입력 + 에센스 + 히스토리 → 메타대화 질문 생성.

```json
// 요청
{
  "input": {
    "type": "image | text | link | memo",
    "content": "...",
    "url": "https://..."
  },
  "essence": { "..." },
  "history": [ "..." ]
}

// 응답 — 일반 질문
{
  "message": "이 글에서 뭐가 걸렸어요?",
  "type": "question",
  "insight": null
}

// 응답 — 발견 감지 시
{
  "message": "...",
  "type": "insight",
  "insight": {
    "text": "준비 안 된 채로 꺼내는 연습이 필요해",
    "tags": ["#완성", "#속도"],
    "connectedEssence": "volume"
  }
}
```

### GET `/api/profile`

에센스 + 인사이트 + 키워드 + 변화 이력.

```json
{
  "essence": {
    "headline": "...",
    "palette": ["..."],
    "topTopics": ["공간", "여행", "음식"],
    "topStyles": ["따뜻한", "고요한", "미니멀"]
  },
  "essenceHistory": [
    { "date": "2026-03-25", "headline": "..." }
  ],
  "insights": ["..."],
  "keywords": ["#공간", "#따뜻한"],
  "monthlyFlow": {
    "period": "2026-03",
    "topicDistribution": [{"tag": "여행", "count": 5}, {"tag": "음식", "count": 3}],
    "styleDistribution": [{"tag": "따뜻한", "count": 4}],
    "dominantTopic": "여행",
    "dominantStyle": "따뜻한",
    "previousComparison": "지난달은 공간이 주였는데, 이번 달은 여행으로 옮겨감"
  }
}
```

### GET `/api/themes`

주제 클러스터 목록.

```json
{
  "themes": [
    {
      "id": "theme_001",
      "label": "안전한 구석",
      "readings": [
        { "id": "...", "date": "2026-03-28", "inputType": "image", "inputPreview": "카페 사진", "insight": "등 뒤가 막혀있어야 안심" }
      ],
      "readingCount": 3,
      "conversationCount": 2,
      "keywords": ["#안전", "#구석"]
    }
  ]
}
```

### GET `/api/sessions`

전체 읽기 세션 목록 (시간순).

```json
{
  "sessions": [
    {
      "id": "session_001",
      "date": "2026-03-28",
      "inputType": "image",
      "inputPreview": "카페 구석 자리",
      "insight": "등 뒤가 막혀있어야 안심이 되는 거 아닐까",
      "observation": "카페 구석 자리, 낮은 조명",
      "topicTags": ["공간"],
      "styleTags": ["따뜻한", "고요한"],
      "hasImage": true,
      "hadConversation": true
    }
  ]
}
```

### GET `/api/sessions/:id`

세션 상세 — 대화 전문 + 발견 + 패턴.

```json
{
  "id": "session_001",
  "date": "2026-03-28",
  "messages": [ "..." ],
  "insights": [
    {
      "text": "넓은 곳이 필요한 상태",
      "tags": ["#공간", "#상태"],
      "connectedEssence": "volume"
    }
  ],
  "confirmedPatterns": ["공간 감각과 심리 상태의 연결"]
}
```

### POST `/api/share`

공유용 이미지 생성.

```json
// 요청
{ "essence": { "..." }, "format": "kakao | instagram" }

// 응답
{
  "imageUrl": "https://...",
  "kakaoShare": {
    "title": "손 닿는 곳의 아늑함을 모으는 사람",
    "description": "나의 읽기 결과",
    "imageUrl": "https://...",
    "link": "https://..."
  }
}
```

---

## 텔레그램 봇 API

### Webhook 수신

텔레그램에서 사용자가 보낸 메시지를 받아 처리한다.

```
POST /api/telegram/webhook
```

**입력 종류별 처리:**

| 입력 | 처리 |
|------|------|
| 사진 | 이미지 다운로드 → `/api/chat` 호출 (type: image) |
| 텍스트 | 텍스트 추출 → `/api/chat` 호출 (type: text or memo) |
| 링크 | URL 감지 → `/api/chat` 호출 (type: link) |

**흐름:**

```
사용자 → 텔레그램 메시지 전송
  → Webhook 수신
  → 입력 타입 판별 (사진/텍스트/링크)
  → /api/chat 호출 (essence + history 포함)
  → 질문 메시지 → 텔레그램으로 전송
```

### 응답 전송

일반 질문이면 텍스트 메시지로 전송.

인사이트 감지 시:

```
"발견이 있어요!

'준비 안 된 채로 꺼내는 연습이 필요해'

웹에서 더 자세히 확인해보세요 👉 https://ralphton.vercel.app/profile"
```

### 첫 진입 (온보딩)

에센스가 없는 사용자가 처음 메시지를 보내면:

```
"반가워요! 먼저 당신의 에센스를 알아볼까요?
뭐든 하나 보내주세요. 사진, 글, 링크 아무거나요."
```

입력 수신 시 → `/api/analyze` 호출 → 읽기 결과 텍스트로 전송 + 웹 링크.
