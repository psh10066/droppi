# 랄프톤 — 데이터 스키마

모든 데이터는 Supabase (Postgres)에 저장한다. Supabase JS SDK로 접근하며, RLS(Row Level Security)로 사용자 격리.

---

## Supabase 테이블 설계

### users

사용자 식별. 텔레그램 uid 기반 자동 생성, 별도 로그인 없음.

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  telegram_uid text unique,          -- 텔레그램 사용자 ID
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### essence_profiles

에센스 분석 결과. 새 분석마다 row 추가 → 최신 1건이 현재 에센스, 나머지는 변화 이력.

```sql
create table essence_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  headline text not null,              -- "손 닿는 곳의 아늑함을 모으는 사람"
  palette text[] not null,             -- ["#C4A882", "#D4A5A5", ...]
  topic_tags text[],                   -- 가장 많이 나온 주제 태그 top 5
  style_tags text[],                   -- 가장 많이 나온 스타일 태그 top 5
  created_at timestamptz default now()
);
```

### sessions

대화 세션 단위.

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  input_type text not null check (input_type in ('image', 'text', 'link', 'memo')),
  input_preview text,                  -- "풍경 사진"
  confirmed_patterns text[],
  created_at timestamptz default now()
);
```

### messages

세션 내 개별 메시지.

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  type text check (type in ('question', 'insight')),
  input_type text check (input_type in ('image', 'text', 'link', 'memo')),
  created_at timestamptz default now()
);
```

### insights

대화에서 발견된 인사이트.

```sql
create table insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  text text not null,                  -- "준비 안 된 채로 꺼내는 연습이 필요해"
  tags text[],                         -- ["#완성", "#속도"]
  connected_essence text,              -- "volume" | "texture" | ...
  created_at timestamptz default now()
);
```

### theme_clusters

주제 클러스터.

```sql
create table theme_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  label text not null,                 -- "안전한 구석"
  reading_ids uuid[],                  -- 이 주제에 속한 읽기 ID들
  keywords text[],                     -- ["#안전", "#구석"]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### readings

읽기 결과 단위.

```sql
create table readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id uuid references sessions(id),  -- 대화가 있으면 연결
  input_type text not null check (input_type in ('image', 'text', 'link', 'memo')),
  input_preview text,                  -- "카페 사진", "아티클 제목"
  insight text,                        -- "등 뒤가 막혀있어야 안심이 되는 거 아닐까"
  observation text,                    -- 관찰 사실
  tags text[],                         -- ["#안전한구석", "#관찰자"]
  topic_tags text[],                   -- 주제 태그 (예: ["공간", "여행"])
  style_tags text[],                   -- 스타일 태그 (예: ["따뜻한", "고요한"])
  had_conversation boolean default false,
  created_at timestamptz default now()
);
```

### monthly_flows

월별 흐름 분석 결과.

```sql
create table monthly_flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  period text not null,                -- "2026-03"
  topic_distribution jsonb not null,   -- [{"tag": "여행", "count": 5}, ...]
  style_distribution jsonb not null,   -- [{"tag": "따뜻한", "count": 4}, ...]
  dominant_topic text,
  dominant_style text,
  previous_comparison text,
  created_at timestamptz default now()
);
```

---

## RLS (Row Level Security) 정책

모든 테이블에 RLS 활성화. 사용자는 자기 데이터만 접근 가능.

```sql
-- 예시: insights 테이블
alter table insights enable row level security;

create policy "Users can read own insights"
  on insights for select using (user_id = auth.uid());

create policy "Users can insert own insights"
  on insights for insert with check (user_id = auth.uid());
```

동일한 패턴을 `essence_profiles`, `sessions`, `messages`, `theme_clusters`, `readings`에 적용.

---

## Supabase JS SDK 사용

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 현재 에센스 조회
const { data: essence } = await supabase
  .from('essence_profiles')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// 인사이트 저장
const { error } = await supabase
  .from('insights')
  .insert({ user_id: userId, session_id, text, tags, connected_essence });
```

---

## TypeScript 인터페이스 (클라이언트용)

```typescript
interface EssenceProfile {
  id: string;
  user_id: string;
  headline: string;
  palette: string[];
  topTopics: string[];   // 가장 많이 나온 주제 태그 top 5
  topStyles: string[];   // 가장 많이 나온 스타일 태그 top 5
  created_at: string;
}

interface Session {
  id: string;
  user_id: string;
  input_type: "image" | "text" | "link" | "memo";
  input_preview: string;
  confirmed_patterns: string[];
  created_at: string;
}

interface Message {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  type?: "question" | "insight";
  input_type?: "image" | "text" | "link" | "memo";
  created_at: string;
}

interface Insight {
  id: string;
  user_id: string;
  session_id: string;
  text: string;
  tags: string[];
  connected_essence: string;
  created_at: string;
}

interface ThemeCluster {
  id: string;
  user_id: string;
  label: string;
  reading_ids: string[];
  keywords: string[];
  created_at: string;
  updated_at: string;
}

interface Reading {
  id: string;
  user_id: string;
  session_id?: string;
  input_type: "image" | "text" | "link" | "memo";
  input_preview: string;
  insight: string;
  observation: string;
  tags: string[];
  topic_tags: string[];   // 주제 태그 (예: ["공간", "여행"])
  style_tags: string[];   // 스타일 태그 (예: ["따뜻한", "고요한"])
  had_conversation: boolean;
  created_at: string;
}

interface MonthlyFlow {
  id: string;
  user_id: string;
  period: string;          // "2026-03"
  topic_distribution: { tag: string; count: number }[];
  style_distribution: { tag: string; count: number }[];
  dominant_topic: string | null;
  dominant_style: string | null;
  previous_comparison: string | null;
  created_at: string;
}
```
