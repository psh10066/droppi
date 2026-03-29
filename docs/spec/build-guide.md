# 빌드 가이드

> 랄프루프가 이 문서를 따라 자율 빌드한다.
> README.md → 이 파일 → 각 스펙 파일 순서로 읽는다.

---

## 빌드 순서

```
Phase 1: 뼈대
  프로젝트 셋업 → 페이지 라우팅 → 레이아웃 → 디자인 토큰
      ↓
Phase 2: 에센스 엔진
  /api/analyze 구현 → 프롬프트 삽입 → eval 실행 → 통과까지 반복
      ↓
Phase 3: 대화 엔진
  /api/chat 구현 → 프롬프트 삽입 → eval 실행 → 통과까지 반복
      ↓
Phase 4: 축적 엔진
  /api/profile, /api/themes → eval 실행
      ↓
Phase 5: 화면 조립
  랜딩 → 홈 → 대화 UI → 프로필 → 세션 로그
      ↓
Phase 6: 텔레그램 봇
  Webhook → /api/chat 연결 → 인사이트 감지 → 웹 링크
      ↓
Phase 7: 통합 테스트
  시나리오 1~3 수동 실행
```

---

## 핵심 규칙: Eval-Fix 루프

**모든 엔진은 빌드 직후 eval을 돌리고, 통과할 때까지 프롬프트를 수정한다.**

```
┌─────────────┐
│  엔진 구현   │
└──────┬──────┘
       ↓
┌─────────────┐
│  eval 실행   │ ← spec/eval.md의 해당 섹션
└──────┬──────┘
       ↓
   PASS? ──Yes──→ 다음 Phase로
       │
      No
       ↓
┌─────────────┐
│  실패 진단   │ ← 어떤 기준이 FAIL인지 확인
└──────┬──────┘
       ↓
┌─────────────┐
│  프롬프트    │ ← engine/ 폴더의 시스템 프롬프트 수정
│  수정        │    few-shot 예시 추가 or 규칙 강화
└──────┬──────┘
       ↓
    eval 재실행 ──→ (최대 3회 반복)
       │
   3회 실패 시
       ↓
┌─────────────┐
│  에스컬레이션 │ ← 실패 원인 + 시도한 수정 기록 후 사람에게 보고
└─────────────┘
```

---

## Phase별 상세

### Phase 1: 뼈대

**참조**: `spec/product.md`, `design/principles.md`

| 작업 | 참조 파일 | 완료 기준 |
|------|----------|----------|
| `npx create-next-app` (Next.js 14 + TS + Tailwind) | - | 프로젝트 실행 |
| 6개 페이지 라우팅 | `spec/product.md` 페이지 구조 | 모든 경로 접근 가능 |
| 디자인 토큰 (CSS variables) | `design/principles.md` 컬러/타이포 | 토큰 적용된 빈 페이지 |
| 공통 레이아웃 | `design/components.md` | 네비게이션, 여백 |
| Supabase 프로젝트 셋업 + 테이블 마이그레이션 | `spec/data-schema.md` | 모든 테이블 생성 + RLS 적용 + SDK 연결 확인 |

### Phase 2: 에센스 엔진

**참조**: `engine/essence.md`, `spec/api.md`

| 작업 | 완료 기준 |
|------|----------|
| `POST /api/analyze` 구현 | Claude Vision API 호출 성공 |
| 시스템 프롬프트 삽입 | `engine/essence.md`의 프롬프트 그대로 |
| JSON 파싱 | EssenceProfile 타입으로 파싱 성공 |
| **eval 실행** | `spec/eval.md` 섹션 1 전체 |

**Eval-Fix 루프 상세**:

```
eval 1-1 (골든 셋):
  FAIL → FAIL 조건 키워드가 나온 사진 세트 확인
       → 프롬프트에 "이런 사진이 들어오면 ~방향으로" few-shot 추가
       → 재실행

eval 1-2 (일관성):
  FAIL → 3회 중 방향이 다른 결과 확인
       → 프롬프트에 "topicTags/styleTags 방향(따뜻↔서늘 등)은 일관되게" 규칙 강화
       → temperature 파라미터 낮추기 (0.3 → 0.1)
       → 재실행

eval 1-3 (품질 체크리스트):
  "따뜻한 사람" 수준의 뻔한 결과 → 프롬프트의 나쁜 예에 추가
  진단 형태("~유형입니다") → "관찰하라, 진단하지 마라" 규칙 강화
  에센스 한 줄 너무 짧거나 김 → 길이 가이드 조정
```

### Phase 3: 대화 엔진

**참조**: `engine/dialogue.md`, `spec/api.md`

| 작업 | 완료 기준 |
|------|----------|
| `POST /api/chat` 구현 | 입력 타입별 분기 동작 |
| 시스템 프롬프트 삽입 | `engine/dialogue.md`의 프롬프트 |
| 에센스 컨텍스트 주입 | EssenceProfile이 프롬프트에 포함 |
| 인사이트 감지 | type: 'insight' 응답 생성 |
| **eval 실행** | `spec/eval.md` 섹션 2 전체 |

**Eval-Fix 루프 상세**:

```
eval 2-1 (질문 품질):
  FAIL "요약" 질문이 나옴
       → 프롬프트 첫 줄에 "절대 요약하지 마라" 강화
       → 나쁜 예에 실제 FAIL 질문 추가
       → 재실행

eval 2-2 (질문 분류):
  판정 LLM으로 자동 분류 → FAIL 비율 확인
  요약/진단이 20% 이상 → 프롬프트 전면 리뷰
  일상 대화가 나옴 → "사진 내용에 반응하지 마라, 선택 이유를 물어라" 추가

eval 2-3 (에센스 연결):
  첫 턴에서 바로 연결 → "3턴 이후에만 연결" 규칙 추가
  매 턴마다 연결 → "세션당 1~2회만" 빈도 제한 추가
  억지 연결 → 연결 판단 기준을 프롬프트에 명시
```

### Phase 4: 축적 엔진

**참조**: `engine/accumulation.md`, `engine/meta-profile.md`

| 작업 | 완료 기준 |
|------|----------|
| 인사이트 저장 | Supabase insights 테이블에 저장 |
| 패턴 감지 | 3개+ 인사이트 → 패턴 자동 감지 |
| 주제 클러스터 생성 | `GET /api/themes` 동작 |
| 세션 관리 | `GET /api/sessions` 동작, `GET /api/themes` 동작 |
| **eval 실행** | `spec/eval.md` 섹션 3 전체 |

**Eval-Fix 루프 상세**:

```
eval 3-1 (패턴 감지):
  각각 별개로 처리됨 → 클러스터링 프롬프트에 "의미가 같으면 하나로" 강화
  키워드만 나열 → "사용자의 언어로 라벨링" 규칙 강화

eval 3-2 (주제 클러스터):
  1개짜리 클러스터 → "최소 3개 인사이트" 규칙 확인
  모든 클러스터가 연결 → 연결 강도 threshold 조정
```

### Phase 5: 화면 조립

**참조**: `spec/screens.md`, `design/components.md`

| 작업 | 참조 |
|------|------|
| 글로벌 레이아웃 (헤더, 하단탭, 반응형) | `design/components.md` 헤더, 하단 탭 |
| 랜딩 (풀스크린, 블랙 pill 버튼, 예시 카드) | `spec/screens.md`, `spec/funnel.md` |
| 읽기 결과 (인사이트 + 관찰 + 태그 + 자유입력 + 스킵) | `spec/screens.md` |
| 홈 (drop 입력 + 최근 읽기 + 주제 모음 칩) | `spec/screens.md` |
| 세션 (매거진 그리드 전체 목록) | `spec/screens.md`, `design/components.md` 세션 카드 |
| 대화 UI | `design/components.md` 대화 버블, 인사이트 카드 |
| 주제 (폴더 카드 스택) | `spec/screens.md`, `design/components.md` 주제 폴더 카드 |
| 프로필 (에센스 + 흐름 + 발견 + 태그) | `spec/screens.md` |
| 공유 이미지 생성 | `spec/api.md` POST /api/share |

**eval**: `spec/eval.md` 섹션 4 (수동 UI/UX 체크리스트)

### 디자인 참조

<HARD-RULE>
디자인 톤은 레퍼런스 이미지가 기준이다. 목업을 그대로 따르지 않는다.

1. **레퍼런스 이미지** (`docs/design/references/*.png`) — 톤, 여백, 컬러 사용량의 기준. 구현 전에 반드시 이미지를 열어보고 느낌을 맞춘다
2. **목업** (`mockup/`) — 구조와 흐름의 참고. `npm run dev`로 확인 가능. 디자인 퀄리티의 기준이 아님
3. **디자인 원칙** (`design/principles.md`) — 레퍼런스에서 읽어야 할 포인트 정리

목업의 컬러, 여백, 폰트 크기를 그대로 복사하면 안 된다.
레퍼런스 이미지의 절제된 느낌 — 거의 무색, 여백이 콘텐츠보다 많음, 텍스트 중심 — 을 따른다.
</HARD-RULE>

목업 페이지: `/` (랜딩), `/result` (읽기 결과), `/home` (홈), `/sessions` (세션), `/themes` (주제), `/profile` (프로필)

### Phase 6: 텔레그램 봇

**참조**: `spec/api.md` 텔레그램 봇 섹션

| 작업 | 완료 기준 |
|------|----------|
| 봇 생성 + Webhook 설정 | 메시지 수신 동작 |
| 사진 → /api/chat 연결 | 사진 보내면 질문 응답 |
| 텍스트/링크 → /api/chat 연결 | 입력별 적절한 질문 |
| 인사이트 감지 → 웹 링크 | "웹에서 확인해보세요" 메시지 |
| 첫 진입 온보딩 | 에센스 분석 안내 |

### Phase 7: 통합 테스트

**참조**: `spec/eval.md` 섹션 5

시나리오 1~3을 순서대로 실행. 전부 PASS해야 완료.

---

## 프롬프트 수정 원칙

프롬프트를 고칠 때:

1. **실패한 출력을 "나쁜 예"에 추가** — 가장 효과적
2. **규칙을 강화하되, 규칙 수를 늘리기보다 기존 규칙을 명확히** — 규칙이 10개 넘으면 무시됨
3. **few-shot 예시 추가** — 골든 셋의 좋은 예를 프롬프트에 직접 삽입
4. **temperature 조정** — 일관성 문제면 낮추기 (0.3 → 0.1)
5. **3회 반복해도 안 되면 프롬프트 구조 자체를 재설계** — 접근 방식 변경

---

## 파일 참조 맵

```
Phase 1 → spec/product.md, design/principles.md, spec/data-schema.md
Phase 2 → engine/essence.md, spec/api.md, spec/eval.md §1
Phase 3 → engine/dialogue.md, spec/api.md, spec/eval.md §2
Phase 4 → engine/accumulation.md, engine/meta-profile.md, spec/eval.md §3
Phase 5 → spec/screens.md, spec/funnel.md, design/components.md, spec/eval.md §4
Phase 6 → spec/api.md (텔레그램), spec/eval.md §5
Phase 7 → spec/eval.md §5
```

---

*Last updated: 2026-03-29*
