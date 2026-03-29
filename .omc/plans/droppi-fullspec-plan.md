# droppi 풀 스펙 구현 계획

## RALPLAN-DR Summary

### Principles (5)
1. **SSOT 준수** -- screens.md가 화면 설계 정본, data-schema.md가 데이터 정본. 스펙 문서에 정의된 것을 그대로 구현한다
2. **엔진 우선, 화면 후순** -- AI 엔진(읽기/대화/축적)이 핵심 루프의 품질을 결정. 엔진을 먼저 만들고 검증한 뒤 화면을 조립한다
3. **모바일 퍼스트** -- 375px 기준 설계, 데스크톱 max-width 480px 센터 정렬
4. **익명 우선 인증** -- 로그인 없이 브라우저 세션/로컬스토리지로 사용자 식별. Supabase RLS는 anonymous user 기반
5. **Eval-Fix 루프** -- 각 엔진은 빌드 직후 eval을 돌리고, 통과할 때까지 프롬프트를 수정한다 (최대 3회)

### Decision Drivers (top 3)
1. **AI ralph-loop 자율 실행** -- 사람 개발자 없이 AI가 태스크 단위로 자율 구현. 태스크 간 의존성이 명확해야 한다
2. **완성도 > 속도** -- 마감 없음. 각 Phase가 완전히 동작한 뒤 다음으로 넘어간다
3. **QA HARD-GATE** -- 빌드 성공은 절반. 로컬QA -> 배포 -> 배포QA -> 반응형QA까지 통과해야 완료

### Viable Options (2)

#### Option A: 빌드 가이드 순서 (엔진 우선 -> 화면 조립 -> QA)
- Pros: build-guide.md의 검증된 순서. 엔진별 eval-fix 루프로 품질 확보. 화면 조립 시 이미 동작하는 API가 있어 통합이 쉬움
- Cons: 초반에 눈에 보이는 결과물이 없어 진행 체감이 늦음
- Bounded risk: eval 반복이 3회 넘어가면 에스컬레이션 규칙으로 제어

#### Option B: 화면 + 엔진 동시 진행 (페이지별로 엔진+UI 같이)
- Pros: 매 Phase마다 동작하는 화면이 나옴
- Cons: 엔진 프롬프트 수정 시 화면도 같이 수정해야 해서 재작업 발생. AI 단일 에이전트에서 동시 진행은 컨텍스트 스위칭 비용이 큼
- Bounded risk: 재작업 루프에 빠질 수 있음

### Chosen: Option A (빌드 가이드 순서)
- Why: build-guide.md가 이미 이 프로젝트에 최적화된 빌드 순서를 정의하고 있음. 엔진 품질이 서비스의 핵심 가치이므로 엔진을 먼저 안정화하는 것이 합리적. ralph-loop 단일 에이전트 실행 환경에서는 순차 실행이 컨텍스트 관리에 유리
- Invalidation of Option B: AI 단일 에이전트가 엔진 eval-fix 루프와 UI 조립을 동시에 처리하면 프롬프트 수정 -> UI 수정 -> 프롬프트 재수정의 재작업 체인이 발생. 완성도 우선 원칙에 위배

---

## Implementation Plan

### Phase 1: 프로젝트 초기화 + 인프라 (Day 1)

#### Task 1-1: Next.js 프로젝트 셋업
- `npx create-next-app@14` (App Router + TypeScript + Tailwind CSS v4)
- ESLint, Prettier 설정
- **파일**: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`
- **Acceptance**: `npm run dev` 실행 시 localhost:3000 접근 가능

#### Task 1-2: 디자인 토큰 + 공통 레이아웃
- screens.md 기반 디자인 톤: 투명, 여백, 콘텐츠 중심
- 모바일 퍼스트 375px, 데스크톱 max-width 480px 센터 정렬
- 컬러: `#3D3632`(주), `#C4C0BC`(비활성), `#F5F3F0`(배경), `#FAF6F1`(카드)
- 타이포: Pretendard 15px/300 기본, 세리프(에센스 한줄용)
- 하단 탭바 (홈/주제/프로필) -- interactions.md 0-1 기반
- 채팅 중에는 탭바 숨김
- **파일**: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/TabBar.tsx`
- **Acceptance**: 빈 페이지에 탭바 표시, 375px/480px에서 레이아웃 정상

#### Task 1-3: 페이지 라우팅 (7개)
- `/` (온보딩 퍼널)
- `/home` (홈)
- `/chat` (메타대화)
- `/chat/[sessionId]` (대화 상세 -- 읽기 전용)
- `/themes` (주제 모음)
- `/themes/[themeId]` (주제 상세)
- `/profile` (프로필)
- **파일**: `src/app/page.tsx`, `src/app/home/page.tsx`, `src/app/chat/page.tsx`, `src/app/chat/[sessionId]/page.tsx`, `src/app/themes/page.tsx`, `src/app/themes/[themeId]/page.tsx`, `src/app/profile/page.tsx`
- **Acceptance**: 모든 경로 접근 가능, 빈 페이지 렌더링

#### Task 1-4: Supabase 연결 + 테이블 마이그레이션
- data-schema.md 기반 8개 테이블 생성: `users`, `essence_profiles`, `sessions`, `messages`, `insights`, `theme_clusters`, `readings`, `monthly_flows`
- RLS 정책 적용 (사용자 자기 데이터만 접근)
- users 테이블: `id = auth.uid()` (Supabase Anonymous Auth 기반). `telegram_uid`, `browser_session_id` 컬럼 없음
- **파일**: `supabase/migrations/001_initial_schema.sql`, `src/lib/supabase.ts`
- **Acceptance**: Supabase 대시보드에서 테이블 확인, SDK로 CRUD 테스트 통과

#### Task 1-5: 익명 사용자 식별 시스템
- Supabase Anonymous Auth로 확정 (`supabase.auth.signInAnonymously()`)
- 첫 방문 시 자동 익명 로그인 → `auth.uid()` 기반으로 모든 데이터 소유권 관리
- access_token은 localStorage에 Supabase SDK가 자동 저장 (재방문 시 동일 세션 복원)
- **파일**: `src/lib/auth.ts`, `src/hooks/useUser.ts`
- **Acceptance**: 새 브라우저에서 자동 사용자 생성, 재방문 시 동일 사용자 식별, 다른 브라우저에서 별도 사용자

#### Task 1-6: TypeScript 타입 정의
- data-schema.md의 인터페이스 그대로 정의
- `EssenceProfile`, `Session`, `Message`, `Insight`, `ThemeCluster`, `Reading`, `MonthlyFlow`
- **파일**: `src/types/index.ts`
- **Acceptance**: 모든 인터페이스 정의 완료, import 시 타입 체크 통과

---

### Phase 2: 읽기 엔진 (Day 2)

> 참조: `engine/essence.md`, `spec/api.md`

#### Task 2-1: POST /api/analyze 구현
- 입력: `{ type: 'image' | 'text' | 'link' | 'memo', content: string }`
- Claude API 호출 (image면 Vision API)
- essence.md의 시스템 프롬프트 그대로 삽입
- 3겹 읽기 파이프라인: 표면 -> 맥락 -> 연결
- 출력: `{ reading: { insight, observation, topicTags, styleTags, firstQuestion }, essence: { headline, palette, topTopics, topStyles } }`
- **[확정]** essence 필드는 image뿐 아니라 모든 입력 타입(text/link/memo 포함)에서 생성/갱신. 이유: 사용자 경험의 일관성. api.md와 다를 경우 이 스펙이 우선함.
- JSON 파싱 + EssenceProfile 타입 검증
- try-catch 필수, 파싱 실패 시 자동 재시도 1회
- **파일**: `src/app/api/analyze/route.ts`, `src/lib/prompts/essence.ts`
- **Acceptance**: 사진/글/링크/메모 각각 입력 시 올바른 형식의 JSON 응답. topicTags/styleTags가 포함됨. 모든 입력 타입에서 essence 필드 존재 확인

#### Task 2-2: 이미지 리사이즈 파이프라인 (클라이언트)
- screens.md 기반: Canvas API -> max 1920px -> JPEG 0.8
- 5MB 초과 -> quality 0.6 재압축
- 그래도 초과 -> max 1280px 추가 리사이즈
- HEIC/HEIF -> JPEG 변환 (`heic2any`)
- GIF -> 첫 프레임 추출
- 동영상 -> 무시 + 토스트
- **파일**: `src/lib/image-processor.ts`
- **Acceptance**: HEIC 변환, 대용량 이미지 리사이즈, 1장당 < 1초 처리

#### Task 2-3: 읽기 결과 저장 로직
- /api/analyze 응답을 readings 테이블에 저장
- essence_profiles 테이블에 새 row 추가 (버전 관리)
- 에센스 갱신 로직: 읽기 축적에 따라 headline/topTopics/topStyles 정교화
- **파일**: `src/lib/reading-service.ts`
- **Acceptance**: 분석 후 readings + essence_profiles에 데이터 저장 확인

#### Task 2-4: 읽기 엔진 Eval
- build-guide.md의 eval 기준 적용
- 3겹 읽기 검증 (표면/맥락/연결 모두 있는지)
- 태그 품질 검증 (주제 태그가 소재, 스타일 태그가 분위기)
- 에센스 구체성 검증 ("따뜻한 사람" 수준이면 FAIL)
- 실패 시 프롬프트 수정 -> 재eval (최대 3회)
- **에스컬레이션**: 3회 실패 시 문제 진단 보고서 생성 후 사람에게 보고 (자율 진행 중단)
- **Acceptance (인라인 PASS/FAIL 기준)**:
  - 골든 셋 E1~E4: 각 입력에 대해 FAIL 키워드 미포함 (E1: "미니멀/차가운/기하학적" 없어야, E2: "좁은/실내/무거운" 없어야, E3: "부드러운/파스텔/가벼운" 없어야, E4: "채워진/화려한/따뜻한 나무" 없어야)
  - 일관성: 같은 입력 3회 분석 시 에센스 방향 동일 (3회 중 반대 방향 0건)
  - 에센스 한 줄: 15~20자, "따뜻한 사람" 수준이면 FAIL
  - styleTags: 감각적 언어 (#따뜻한결, #유기적), 형용사 나열이면 FAIL
  - 첫 질문: 관찰 사실 + 열린 호기심. "~아닌가요?" 가설이면 FAIL
  - 톤: "이렇게 읽어봤어요" (겸손). "당신의 에센스입니다" 이면 FAIL
  - 사진 3종 + 텍스트 2종 + 링크 1종 전부 PASS

---

### Phase 3: 대화 엔진 (Day 3)

> 참조: `engine/dialogue.md`, `spec/api.md`

#### Task 3-1: POST /api/chat 구현
- 입력: `{ input: { type, content }, essence, history }`
- dialogue.md의 시스템 프롬프트 그대로 삽입
- 에센스 컨텍스트 주입, 인사이트 로그 주입
- 입력 타입별 분기 (photo/article/memo/link)
- 턴별 전략: 질문 40%, 가설 30%, 연결/발견 30%
- 출력: `{ message, type: 'question' | 'insight', insight?: { text, tags, connectedEssence } }`
- 인사이트 감지 로직 (dialogue.md의 5가지 감지 조건)
- **파일**: `src/app/api/chat/route.ts`, `src/lib/prompts/dialogue.ts`
- **Acceptance**: 입력 타입별 적절한 첫 질문, 3턴 이상 진행 시 인사이트 카드 1회 이상 생성

#### Task 3-2: 세션 + 메시지 저장 로직
- 새 세션 생성 (sessions 테이블)
- 메시지 저장 (messages 테이블) -- role, content, type, input_type
- 인사이트 저장 (insights 테이블) -- text, tags, connected_essence
- 24시간 이내 세션 이어가기 로직
- **파일**: `src/lib/session-service.ts`
- **Acceptance**: 대화 진행 시 세션/메시지/인사이트가 정확히 저장됨

#### Task 3-3: 대화 엔진 Eval
- build-guide.md eval 기준 적용
- 질문 품질 검증 (요약 질문이 나오면 FAIL)
- 에센스 연결 규칙 (3턴 이후, 세션당 1-2회)
- 안전장치 검증 (자기부정 반복 감지, 확증편향 감지)
- 실패 시 프롬프트 수정 -> 재eval (최대 3회)
- **에스컬레이션**: 3회 실패 시 문제 진단 보고서 생성 후 사람에게 보고 (자율 진행 중단)
- **Acceptance (인라인 PASS/FAIL 기준)**:
  - 골든 셋 D1~D5: 각 입력에 대해 좋은 질문 방향 출력, FAIL 질문 패턴 미출력
  - 질문 분류: 10턴 중 요약/진단/일상대화 = 0건 (탐색/역추적/연결만 PASS)
  - 에센스 연결: 3턴 이후에만, 세션당 1~2회, "에센스에서 ~라고 했는데" 형태
  - 연속 질문 금지: 3턴 연속 질문만인 구간 없어야 함 (가설/연결 섞임)
  - 짧은 응답("응") 대응: "더 이야기해줄래요?" 아닌 구체적 질문
  - 오타 무시: 사용자 오타를 지적하지 않음
  - 5턴 대화 시나리오 3개 (사진/글/메모 각 1개) 전부 PASS

---

### Phase 4: 축적 엔진 + 주제 클러스터 (Day 4)

> 참조: `engine/accumulation.md`

#### Task 4-1: 주제 클러스터링 로직
- 새 읽기의 태그 -> 기존 주제 키워드와 의미 유사도 비교 (LLM)
- 유사도 높으면 기존 주제에 추가, 없으면 대기
- 3개 이상 읽기가 모이면 주제로 승격
- 라벨은 사용자 언어에서 가져옴
- theme_clusters 테이블 관리
- **파일**: `src/lib/accumulation-service.ts`, `src/lib/prompts/accumulation.ts`
- **Acceptance**: 읽기 5개 이상 축적 시 자동 클러스터링, 주제 라벨이 사용자 언어 기반

#### Task 4-2: GET /api/themes 구현
- 사용자의 주제 클러스터 목록 반환
- 각 테마: id, label, readings, readingCount, conversationCount, keywords, ai_summary
- **파일**: `src/app/api/themes/route.ts`
- **Acceptance**: 클러스터링된 주제 목록이 정확히 반환됨

#### Task 4-3: GET /api/profile 구현
- 에센스 (최신) + 인사이트 목록 + 키워드 + 에센스 변화 이력
- monthlyFlow: 월별 주제/스타일 분포 집계
- api.md의 응답 형식 그대로
- **파일**: `src/app/api/profile/route.ts`
- **Acceptance**: 프로필 데이터가 올바른 형식으로 반환됨

#### Task 4-4: GET /api/sessions/:id 구현
- 세션 상세: 대화 전문 + 발견 + 패턴
- **파일**: `src/app/api/sessions/[id]/route.ts`
- **Acceptance**: 세션 ID로 조회 시 메시지 + 인사이트 + confirmedPatterns 반환

#### Task 4-5: 월별 흐름 집계 로직
- 해당 월의 모든 읽기에서 태그 집계
- 상위 3개 주제 + 상위 3개 스타일 추출
- 이전 월과 비교 -> 이동 방향 서술
- monthly_flows 테이블 저장
- **파일**: `src/lib/monthly-flow-service.ts`
- **Acceptance**: 읽기 데이터 기반 월별 흐름이 정확히 집계됨

#### Task 4-6: 축적 엔진 Eval
- 패턴 감지 검증 (의미적 반복 감지)
- 클러스터링 검증 (키워드가 아닌 의미로 묶는지)
- 실패 시 프롬프트 수정 (최대 3회)
- **에스컬레이션**: 3회 실패 시 문제 진단 보고서 생성 후 사람에게 보고 (자율 진행 중단)
- **Acceptance (인라인 PASS/FAIL 기준)**:
  - 골든 셋 A1~A3: 각 인사이트 로그에서 기대 패턴 감지 (A1: "닫는 게 어렵다", A2: "혼자 완성하려는 패턴", A3: "음식/카페에서 충전")
  - FAIL: 각각 별개 패턴으로 처리하거나 키워드만 나열
  - 주제 이름: 사용자 언어 기반 (AI 추상 라벨이면 FAIL)
  - 클러스터 수: 인사이트 10개당 2~4개 (1:1이면 FAIL)
  - 클러스터 최소 크기: 3개 이상 (1개짜리 존재하면 FAIL)
  - 에센스 변화 감지: 새 입력 분석 시 이전과 비교 + 변화 서술 (매번 독립 분석이면 FAIL)
  - 인사이트 5개 이상 시나리오에서 패턴 감지 + 클러스터링 전부 PASS

---

### Phase 5: 화면 조립 -- 온보딩 퍼널 (Day 5)

> 참조: `spec/screens.md`, `spec/funnel.md`, `spec/interactions.md`

#### Task 5-1: 랜딩 페이지 (`/`)
- 카피: "뭐든 넣으면 당신이 보입니다."
- 흰 배경, 큰 세리프, 여백
- drop 영역: 사진/글/링크/메모 입력
- 예시 읽기 결과 카드 3개 가로 스크롤 (`scroll-snap-type: x mandatory`)
- 카드 탭 -> 상세 바텀시트 -> "나도 해볼래" CTA
- 에센스 있는 재방문 사용자 -> `/home` 리다이렉트
- **파일**: `src/app/page.tsx`, `src/components/landing/ExampleCards.tsx`, `src/components/landing/DropZone.tsx`
- **Acceptance**: 모바일 375px에서 랜딩 레이아웃 정상, 예시 카드 스와이프, drop 영역 동작

#### Task 5-2: 업로드 + 입력 처리
- 사진: 갤러리 멀티셀렉트 (최대 5장, 온보딩), 카메라 촬영, 드래그앤드롭
- 글/링크/메모: 텍스트 입력 영역
- 이미지 리사이즈 파이프라인 연동 (Task 2-2)
- 입력 미리보기 (사진 썸네일 / 텍스트 카드 / 링크 카드)
- `[ 읽기 시작 ]` 버튼 -- 입력 없으면 비활성
- interactions.md 1-2의 모든 엣지케이스 처리
- **파일**: `src/components/upload/UploadArea.tsx`, `src/components/upload/PhotoPreview.tsx`
- **Acceptance**: 사진/글/링크/메모 각각 입력 + 미리보기 정상, 엣지케이스 (HEIC, GIF, 동영상, 빈 텍스트) 처리

#### Task 5-3: 로딩 화면
- 입력별 3단계 로딩 카피 (사진: "뭐가 찍혀있는지 보는 중" -> ..., 글: "어떤 내용인지 읽는 중" -> ...)
- 완료=체크, 현재=채워진 원, 대기=빈 원
- drop한 항목 미리보기 함께 표시
- 타이밍 규칙: 12초 내 응답 -> 4단계 완료, 30초+ -> "시간이 좀 걸리고 있어요", 60초+ -> 재시도
- **파일**: `src/components/loading/AnalysisLoading.tsx`
- **Acceptance**: 로딩 애니메이션 자연스러움, API 응답과 동기화, 타임아웃 처리

#### Task 5-4: 읽기 결과 화면
- drop한 항목 미리보기 상단
- "이렇게 읽어봤어요" + 인사이트 한 덩어리 (세리프, 32px+)
- 주제/스타일 태그 칩
- 팔레트 (사진인 경우)
- 관찰 사실 목록
- 자유 입력 필드 + "답하기" 버튼
- "그냥 넘어갈래요" -> 읽기만 저장 후 `/home`
- 자유 입력 시 -> `/chat`으로 전환 (fade 300ms)
- 공유 / 저장 버튼
- **파일**: `src/components/reading/ReadingResult.tsx`, `src/components/reading/InputField.tsx`
- **Acceptance**: 읽기 결과가 screens.md 와이어프레임대로 표시, 대화 전환 동작, 스킵 동작

---

### Phase 6: 화면 조립 -- 홈 + 채팅 (Day 6-7)

#### Task 6-1: 홈 화면 (`/home`)
- 에센스 한 줄 (최상단, 탭 -> `/profile`)
- "오늘은 뭘 가져왔어?" 카피
- 입력 영역: 사진/글/링크/메모 drop (최대 3장)
- 입력 -> 로딩 -> 읽기 결과 흐름 연동
- 최근 읽기 카드 목록 (카드 탭 -> `/chat/:sessionId`)
- 주제 모음 칩 (세션 3개 미만이면 숨김)
- 빈 상태 처리 (interactions.md 0-4 기반)
- **파일**: `src/app/home/page.tsx`, `src/components/home/RecentReadings.tsx`, `src/components/home/TopicChips.tsx`
- **Acceptance**: screens.md 와이어프레임대로 홈 레이아웃, 입력 -> 분석 흐름 동작, 빈 상태 표시

#### Task 6-2: 채팅 화면 (`/chat`)
- 레이아웃: 고정 헤더(`<- 홈`) + 스크롤 메시지 영역 + 고정 입력 영역
- 채팅 중 하단 탭바 숨김
- 읽기 결과 요약 상단 고정 표시
- 메시지 렌더링: AI(왼쪽, 배경없음) / 사용자(오른쪽, #F5F3F0)
- AI 타이핑 인디케이터 (점 3개 순차 페이드)
- 인사이트 카드 인라인 표시 (발견 + 태그 + "기록할까요?" / "넘어가기")
- 스크롤 규칙: 자동 스크롤, 위로 스크롤 시 "새 메시지" 플로팅 버튼
- 입력: 텍스트 + 사진 첨부(최대 3장), Enter=줄바꿈, `[->]`=전송
- 전송 후 상태 리셋, AI 응답 대기 중 전송 불가
- 2000자 제한 + 카운터
- **파일**: `src/app/chat/page.tsx`, `src/components/chat/MessageList.tsx`, `src/components/chat/ChatInput.tsx`, `src/components/chat/InsightCard.tsx`, `src/components/chat/TypingIndicator.tsx`
- **Acceptance**: screens.md 채팅 와이어프레임대로, 메시지 전송/수신 동작, 인사이트 카드 표시, 스크롤 규칙 준수, 키보드 위 입력 고정

#### Task 6-3: 채팅 세션 관리
- 24시간 이내 세션 이어가기 ("이어서 이야기할까요?" 배너)
- 브라우저 닫기 -> 재방문 시 세션 복원
- 대화 종료 감지: "고마워"/"됐어" -> 자연스러운 마무리
- 네트워크 끊김 시 로컬 큐 저장 + 재연결 시 자동 전송
- **파일**: `src/hooks/useSession.ts`, `src/lib/message-queue.ts`
- **Acceptance**: 세션 이어가기 동작, 네트워크 복원 시 메시지 재전송

#### Task 6-4: 대화 상세 (`/chat/[sessionId]`)
- 읽기 전용. 과거 대화 원문 + 발견 목록
- 헤더: `<- 주제 목록` + 날짜
- **파일**: `src/app/chat/[sessionId]/page.tsx`
- **Acceptance**: 세션 ID로 과거 대화 조회 + 표시

---

### Phase 7: 화면 조립 -- 주제 + 프로필 (Day 8)

#### Task 7-1: 주제 모음 (`/themes`)
- 주제 카드 목록: 라벨 + 읽기 N개/대화 N개
- 카드 탭 -> `/themes/:themeId`
- 빈 상태: "아직 주제가 없어요. 뭐든 drop하면 비슷한 것끼리 묶여요."
- **파일**: `src/app/themes/page.tsx`, `src/components/themes/ThemeCard.tsx`
- **Acceptance**: screens.md 주제 모음 와이어프레임대로, 빈 상태 처리

#### Task 7-2: 주제 상세 (`/themes/[themeId]`)
- 테마 이름 + AI 관찰
- 시간순 읽기 목록 (날짜 + 입력 타입 + 인사이트)
- 이 테마에서 나온 발견 목록
- **파일**: `src/app/themes/[themeId]/page.tsx`
- **Acceptance**: screens.md 주제 상세 와이어프레임대로

#### Task 7-3: 프로필 (`/profile`)
- 에센스 한줄 + 컬러 팔레트
- 이번 달 흐름: 주제 분포 칩 + 스타일 분포 칩 + 이전 달 비교 텍스트
- 나의 주제들 리스트
- 축적된 발견 목록
- 상위 주제 태그 + 상위 스타일 태그
- 빈 상태 처리 (interactions.md 0-4 기반)
- **파일**: `src/app/profile/page.tsx`, `src/components/profile/EssenceSection.tsx`, `src/components/profile/MonthlyFlow.tsx`, `src/components/profile/InsightList.tsx`
- **Acceptance**: screens.md 프로필 와이어프레임대로, 빈 상태/데이터 있는 상태 모두 정상

#### Task 7-4: POST /api/share (공유 이미지)
- 에센스 + 읽기 결과 기반 공유 카드 이미지 생성
- 카카오 공유 메타데이터 (`og:title`, `og:image`)
- **파일**: `src/app/api/share/route.ts`, `src/lib/share-image.ts`
- **Acceptance**: 공유 이미지 생성, 카카오 공유 메타데이터 올바름

---

### Phase 8: 에러 핸들링 + 엣지케이스 통합 (Day 9)

#### Task 8-1: 에러 핸들링 통합
- error-handling.md의 9개 에러 케이스 전부 구현
  - 유사 사진 과다 -> 토스트
  - URL 접근 불가 -> 텍스트 전환 유도
  - Claude API 파싱 실패 -> 자동 재시도 1회
  - 텍스트 스크린샷 감지 -> 전환 제안
  - 이미지 업로드 실패 -> 재시도
  - 대화 중 네트워크 끊김 -> 로컬 큐
  - Supabase 네트워크 오류 -> 재시도 2회 + 로컬 큐
  - Supabase RLS 오류 -> 로깅 + 복구
  - Supabase 초기화 실패 -> 재시도 + 알림
- **파일**: `src/lib/error-handler.ts`, `src/components/common/Toast.tsx`
- **Acceptance (시나리오별 expected behavior)**:
  - 유사 사진 과다 → 토스트 "비슷한 사진이 여러 장이에요..." 표시, 분석은 진행
  - URL 접근 불가 → "이 링크를 열 수 없어요. 글의 핵심 부분을 직접 붙여넣어볼래요?" + 텍스트 입력 전환
  - Claude API 파싱 실패 → "다시 읽어볼게요..." + 자동 재시도 1회. 재실패 시 "잠시 후 다시 시도해주세요"
  - 텍스트 스크린샷 → "이건 글이네요! 텍스트로 넣으면 더 잘 읽을 수 있어요." + 전환 제안
  - 이미지 업로드 실패 → "사진을 올리지 못했어요. 다시 시도해볼게요." + 자동 재시도 1회, 실패 시 수동 재시도 버튼
  - 대화 중 네트워크 끊김 → 전송 실패 메시지 로컬 큐 저장 + 빨간 `!` 표시, 재연결 시 자동 전송
  - Supabase 네트워크 오류 → "저장하는 데 잠깐 문제가 있었어요." + 재시도 2회(1초/3초), 실패 시 로컬 큐 + 백그라운드 재시도
  - Supabase RLS 오류 → 사용자 노출 없음, 콘솔 로깅 + 세션 복구 시도
  - Supabase 초기화 실패 → "서비스에 연결할 수 없어요." + 재시도 버튼, 3회 실패 시 관리자 알림
  - **검증 방법**: Playwright에서 네트워크 인터셉트로 각 에러 시뮬레이션 → expected 메시지/동작 확인

#### Task 8-2: 글로벌 인터랙션 규칙 적용
- interactions.md 0-3 (로딩 상태: 300ms 대기 -> 스켈레톤 -> 지연 텍스트 -> 타임아웃)
- interactions.md 0-4 (빈 상태 전체 적용)
- interactions.md 0-5 (네트워크 상태 감지 + 오프라인 배너)
- interactions.md 0-7 (모바일 키보드 처리: `visualViewport` API)
- **파일**: `src/hooks/useNetworkStatus.ts`, `src/components/common/Skeleton.tsx`, `src/components/common/EmptyState.tsx`
- **Acceptance**: 오프라인/재연결 감지, 빈 상태 메시지, 키보드 올라올 때 채팅 입력 고정

---

### Phase QA: 전체 검증 (Day 10-11)

> CLAUDE.md HARD-GATE 기반. 이 Phase의 모든 태스크는 순차 실행이며 건너뛸 수 없다.

#### Task QA-1: 빌드 검증 + 테스트
- `npm run build` 성공
- Jest 단위 테스트 작성 및 통과
  - 이미지 리사이즈 유틸
  - 세션 관리 로직
  - 에러 핸들링 로직
  - API 라우트 응답 형식
- Playwright E2E 테스트 작성
  - 전체 온보딩 플로우 (랜딩 -> 업로드 -> 로딩 -> 읽기 결과)
  - 홈 -> 채팅 -> 인사이트 저장 플로우
  - 주제 모음 + 프로필 조회
- **blockedBy**: Phase 1~8 전체
- **Acceptance**: 빌드 성공 + 모든 테스트 통과

#### Task QA-2: 로컬 QA -- Playwright MCP로 전체 기능 확인
- 모든 페이지/메뉴/기능을 Playwright MCP로 직접 검증
- 체크리스트:
  - [ ] 랜딩: 카피, 예시 카드 스와이프, drop 영역
  - [ ] 업로드: 사진/글/링크/메모 각각
  - [ ] 로딩: 3단계 카피, 타이밍
  - [ ] 읽기 결과: 인사이트, 태그, 팔레트, 자유 입력 -> 채팅 전환, 스킵
  - [ ] 홈: 에센스 한줄, 입력 영역, 최근 읽기, 주제 칩
  - [ ] 채팅: 메시지 전송/수신, 인사이트 카드, 스크롤, 키보드
  - [ ] 대화 상세: 읽기 전용 과거 대화
  - [ ] 주제 모음: 목록, 주제 상세
  - [ ] 프로필: 에센스, 월별 흐름, 발견, 태그
  - [ ] 빈 상태: 모든 화면에서 데이터 없는 경우
  - [ ] 에러: 네트워크 끊김, API 실패
- 증거: Playwright 실행 로그 + 각 페이지 스크린샷
- **blockedBy**: QA-1
- **Acceptance**: 모든 체크리스트 항목 통과, 브라우저 콘솔 에러 0건

#### Task QA-3: Vercel 배포
- Vercel에 배포
- 환경변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY, CLAUDE_API_KEY)
- **blockedBy**: QA-2
- **Acceptance**: 배포 URL 접속 가능

#### Task QA-4: 배포 QA -- Playwright MCP로 배포 URL 전체 기능 재확인
- QA-2와 동일한 체크리스트를 배포 URL에서 재실행
- 증거: 배포 URL + Playwright로 접속한 스크린샷
- **blockedBy**: QA-3
- **Acceptance**: 배포 환경에서 모든 기능 동작, 콘솔 에러 0건

#### Task QA-5: 반응형 QA -- 모바일 뷰포트(390px) 검증
- 배포 URL에서 모바일 뷰포트(390px)로 전체 기능 재확인
- 특히: 키보드 올라올 때 입력 고정, 탭바 터치, 스와이프 제스처
- 증거: 모바일 뷰포트(390px) 스크린샷
- **blockedBy**: QA-4
- **Acceptance**: 390px에서 전체 기능 정상, 레이아웃 깨짐 없음

---

## ADR (Architecture Decision Record)

### Decision
Next.js 14 App Router + Supabase + Claude API 기반의 모바일 퍼스트 웹앱으로 구현. 익명 사용자 식별, 서버사이드 AI 엔진, 클라이언트 사이드 이미지 처리.

### Drivers
1. Greenfield 프로젝트 -- 기존 코드/레거시 제약 없음
2. AI ralph-loop 자율 실행 -- 명확한 태스크 분해 필요
3. 익명 사용자 -- 인증 복잡도 최소화
4. 모바일 퍼스트 375px -- 터치 인터랙션 중심

### Alternatives considered
1. **React SPA + 별도 백엔드**: Next.js가 API Route를 내장하므로 별도 백엔드 불필요. 배포도 Vercel 원스톱.
2. **Firebase 대신 Supabase**: 이미 Supabase 프로젝트가 준비된 상태. Postgres 기반 RLS가 익명 사용자 격리에 적합.
3. **OpenAI 대신 Claude**: 스펙에서 Claude API로 명시. 읽기 엔진의 "관찰하되 진단하지 않는" 톤에 Claude가 더 적합.

### Why chosen
- Next.js 14 App Router: 서버 컴포넌트 + API Route 통합, Vercel 배포 최적화
- Supabase: 인프라 준비 완료, RLS 기반 사용자 격리, 실시간 구독 가능
- Claude API: 스펙 명시, Vision API로 이미지 분석 통합
- Tailwind CSS v4: 유틸리티 퍼스트로 모바일 퍼스트 구현 효율적

### Consequences
- Claude API 비용이 사용량에 비례하여 증가 (특히 이미지 분석)
- 익명 인증은 브라우저 변경/초기화 시 데이터 접근 불가
- Supabase free tier 제한 (500MB DB, 1GB storage)

### Follow-ups
- 사용량 증가 시 Claude API 비용 모니터링 + rate limiting
- 브라우저 간 데이터 이전 방안 (QR 코드 등)
- Supabase 유료 전환 시점 판단
- 텔레그램 봇은 향후 별도 이터레이션으로 구현 (현재 스코프에서 제외)

---

## File Structure

```
ralphthon/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # 공통 레이아웃 + 탭바
│   │   ├── globals.css                   # 디자인 토큰 + 글로벌 스타일
│   │   ├── page.tsx                      # / (온보딩 퍼널)
│   │   ├── home/
│   │   │   └── page.tsx                  # /home
│   │   ├── chat/
│   │   │   ├── page.tsx                  # /chat (활성 대화)
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx              # /chat/:sessionId (대화 상세)
│   │   ├── themes/
│   │   │   ├── page.tsx                  # /themes (주제 모음)
│   │   │   └── [themeId]/
│   │   │       └── page.tsx              # /themes/:themeId (주제 상세)
│   │   ├── profile/
│   │   │   └── page.tsx                  # /profile
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts              # POST /api/analyze
│   │       ├── chat/
│   │       │   └── route.ts              # POST /api/chat
│   │       ├── profile/
│   │       │   └── route.ts              # GET /api/profile
│   │       ├── themes/
│   │       │   └── route.ts              # GET /api/themes
│   │       ├── sessions/
│   │       │   └── [id]/
│   │       │       └── route.ts          # GET /api/sessions/:id
│   │       └── share/
│   │           └── route.ts              # POST /api/share
│   ├── components/
│   │   ├── common/
│   │   │   ├── TabBar.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── BottomSheet.tsx
│   │   ├── landing/
│   │   │   ├── ExampleCards.tsx
│   │   │   └── DropZone.tsx
│   │   ├── upload/
│   │   │   ├── UploadArea.tsx
│   │   │   └── PhotoPreview.tsx
│   │   ├── loading/
│   │   │   └── AnalysisLoading.tsx
│   │   ├── reading/
│   │   │   ├── ReadingResult.tsx
│   │   │   └── InputField.tsx
│   │   ├── home/
│   │   │   ├── RecentReadings.tsx
│   │   │   └── TopicChips.tsx
│   │   ├── chat/
│   │   │   ├── MessageList.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── themes/
│   │   │   └── ThemeCard.tsx
│   │   └── profile/
│   │       ├── EssenceSection.tsx
│   │       ├── MonthlyFlow.tsx
│   │       └── InsightList.tsx
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── useSession.ts
│   │   └── useNetworkStatus.ts
│   ├── lib/
│   │   ├── supabase.ts                   # Supabase 클라이언트
│   │   ├── auth.ts                       # 익명 인증
│   │   ├── image-processor.ts            # 이미지 리사이즈/변환
│   │   ├── reading-service.ts            # 읽기 결과 저장
│   │   ├── session-service.ts            # 세션/메시지 관리
│   │   ├── accumulation-service.ts       # 주제 클러스터링
│   │   ├── monthly-flow-service.ts       # 월별 흐름 집계
│   │   ├── error-handler.ts              # 에러 핸들링
│   │   ├── message-queue.ts              # 오프라인 메시지 큐
│   │   ├── share-image.ts                # 공유 이미지 생성
│   │   └── prompts/
│   │       ├── essence.ts                # 읽기 엔진 시스템 프롬프트
│   │       ├── dialogue.ts               # 대화 엔진 시스템 프롬프트
│   │       └── accumulation.ts           # 축적 엔진 시스템 프롬프트
│   └── types/
│       └── index.ts                      # 전체 TypeScript 인터페이스
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql        # 테이블 + RLS 마이그레이션
├── tests/
│   ├── unit/
│   │   ├── image-processor.test.ts
│   │   ├── session-service.test.ts
│   │   └── error-handler.test.ts
│   └── e2e/
│       ├── onboarding.spec.ts
│       ├── chat-flow.spec.ts
│       └── profile-themes.spec.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local                            # 환경변수 (커밋 제외)
```

---

## Risk & Mitigation

| 위험 | 가능성 | 영향 | 대응 |
|------|--------|------|------|
| Claude API 응답 품질 불일치 | 높음 | 높음 | Eval-Fix 루프 3회 반복. 실패 시 에스컬레이션 |
| 이미지 리사이즈 크로스 브라우저 이슈 | 중간 | 중간 | Canvas API 폴백 + HEIC 변환 라이브러리 사전 검증 |
| Supabase RLS + 익명 인증 조합 복잡도 | 중간 | 높음 | Phase 1에서 인증 + RLS 먼저 검증 후 진행 |
| 모바일 키보드 + 채팅 레이아웃 이슈 (iOS Safari) | 높음 | 중간 | `visualViewport` API + CSS env() 활용, 실기기 테스트 필수 |
| Claude Vision API 비용 (이미지 분석) | 중간 | 낮음 | 이미지 리사이즈로 토큰 비용 절감, 일일 사용량 모니터링 |
| 주제 클러스터링 정확도 | 중간 | 중간 | LLM 기반 의미 유사도 비교, 최소 3개 읽기 필요 규칙으로 노이즈 방지 |

---

*Generated: 2026-03-29*
*Source: deep-interview-droppi-fullspec.md + 11개 스펙 문서*
