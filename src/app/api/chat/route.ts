import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import * as cheerio from "cheerio";

const DIALOGUE_SYSTEM_PROMPT = `당신은 사용자와 편하게 대화하면서 자기 이해를 돕는 파트너입니다.
질문만 하지 않습니다. 3가지 역할을 자연스럽게 오갑니다:

1. **질문** (35%): 더 깊이 파고드는 열린 질문
2. **가설** (30%): "혹시 이런 건 아닐까?" 틀려도 되는 해석을 던짐
3. **정리** (35%): 여기까지 나온 이야기들의 실을 잡아줌. 요약이 아니라 연결.

## 핵심 원칙
- 질문만 연속 2턴 하지 않는다. 반드시 가설이나 정리를 섞는다.
- 정리는 "~라고 하셨는데요" 식의 요약이 아니라, 사용자 말 사이에서 보이는 패턴을 짚어주는 것.
- 짧고 편하게. 한 번에 3문장 이내. 길게 말하지 않는다.
- 사용자가 짧게 답해도 괜찮다. 억지로 깊이 끌고 가지 않는다.
- 반말이든 존댓말이든 사용자의 톤에 맞춘다.

## 나쁜 예 (질문만 나열)
"그렇군요. 그러면 왜 그런 것 같아요?"
"흥미롭네요. 그 감정이 언제 처음 느껴졌나요?"
→ 심문당하는 느낌. 지침.

## 좋은 예 (질문 + 가설 + 정리 섞기)
"지나가면서 바라만 봐도 만족이라는 게 인상적이에요.
보통은 가까이 가고 싶어하잖아요. 혹시 거리감 자체에서 편안함을 느끼는 건 아닐까?"
→ 관찰(정리) + 가설을 함께. 대화할 맛이 남.

## 정리의 좋은 예
나쁜 정리: "카페에서 구석을 좋아하고, 집에서도 소파 끝에 앉는다고 하셨어요."
좋은 정리: "카페든 집이든 '등 뒤가 막힌 곳'이 공통이네요. 숨는 게 아니라 안전한 데서 보고 싶은 거 같아요."

## 입력 타입별 시작
사진: 사진에서 보이는 것 + "왜 이걸 찍었어요?" 또는 가설
글/링크: 요약 안 함. "이 글에서 뭐가 걸렸어요?" 또는 "이 부분이 지금 상황과 닿는 건 아닐까?"
메모: "이 생각이 왜 지금 떠올랐어요?"

## 발견(인사이트) 감지
사용자 말에서 "아, 그렇구나" 같은 깨달음이 보이면, 또는 여러 턴에 걸쳐 패턴이 보이면:
- type을 "insight"로 설정
- 사용자의 말을 그대로 살려서 한 줄로 정리

## 출력 형식 (반드시 이 JSON만 출력)
{
  "message": "대화 메시지 (짧게, 3문장 이내)",
  "type": "question" 또는 "insight",
  "insight": null 또는 { "text": "발견 내용", "tags": ["#태그1", "#태그2"] }
}`;

const RESTRICTED_DOMAINS = ["linkedin.com", "instagram.com", "facebook.com"];

async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Droppi/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, aside").remove();
    const text = $("article, main, .content, .post, body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    return text || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { input, essence, history } = await request.json();

    let processedContent = input.content;
    let linkWarning: string | null = null;

    if (input.type === "link") {
      const url = input.content;
      const domain = new URL(url).hostname;

      if (RESTRICTED_DOMAINS.some((d) => domain.includes(d))) {
        linkWarning = `${domain}은 직접 읽기 어려운 사이트예요.`;
      }

      const scraped = await scrapeUrl(url);
      if (scraped) {
        processedContent = `[링크: ${url}]\n\n${scraped}`;
      } else {
        try {
          const aiResearch = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: `이 URL의 글 내용을 아는 대로 요약해줘: ${url}. 모르면 "모름"이라고만 답해.`,
              },
            ],
          });
          const researchText = aiResearch.content[0];
          if (researchText.type === "text" && !researchText.text.includes("모름")) {
            processedContent = `[링크: ${url}]\n\n[AI 리서치 결과]\n${researchText.text}`;
          } else {
            return NextResponse.json({
              message: linkWarning
                ? `${linkWarning} 글의 핵심 부분을 붙여넣어볼래요?`
                : "이 링크를 읽기 어려워요. 글의 핵심 부분을 붙여넣어볼래요?",
              type: "question",
              insight: null,
            });
          }
        } catch {
          return NextResponse.json({
            message: "이 링크를 읽기 어려워요. 글의 핵심 부분을 붙여넣어볼래요?",
            type: "question",
            insight: null,
          });
        }
      }
    }

    const essenceContext = essence
      ? `\n\n## 사용자 에센스 프로필\n${JSON.stringify(essence, null, 2)}`
      : "";

    const messages = [
      ...(history || []).map((h: any) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      {
        role: "user" as const,
        content: `[입력 타입: ${input.type}]\n\n${processedContent}`,
      },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      temperature: 0.7,
      system: DIALOGUE_SYSTEM_PROMPT + essenceContext,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "AI 응답 오류" }, { status: 500 });
    }

    let resultText = textBlock.text.trim();
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (linkWarning && !parsed.message.includes(linkWarning)) {
        parsed.message = `(${linkWarning})\n\n${parsed.message}`;
      }
      return NextResponse.json(parsed);
    }

    return NextResponse.json({
      message: resultText,
      type: "question",
      insight: null,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "다시 시도해주세요.", details: error.message },
      { status: 500 }
    );
  }
}
