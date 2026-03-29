"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Tag from "@/components/Tag";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: string;
  insight?: { text: string; tags: string[] };
}

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const exampleSessions: Record<string, { session: any; messages: Message[] }> = {
    "example-1": {
      session: { type: "image", result: { insight: "안전한 구석에서 전체를 보는 사람", observation: "카페 구석 자리, 낮은 조명, 혼자 앉는 크기의 테이블", topics: ["공간"], styles: ["고요한"] } },
      messages: [
        { role: "assistant", content: "사진 속 카페는 구석 자리였고, 조명이 낮고, 혼자 앉는 크기의 테이블이에요.\n\n구석을 일부러 골랐어요, 아니면 자리가 거기뿐이었어요?" },
        { role: "user", content: "일부러 골랐어요. 항상 구석에 앉아요." },
        { role: "assistant", content: "항상 구석이라면, 혹시 등 뒤가 막혀있어야 편한 건 아니에요? 아니면 전체가 보이는 자리를 고르는 건가요?" },
        { role: "user", content: "둘 다인 것 같아요. 등 뒤는 막혀있고, 앞은 다 보이는 자리." },
        { role: "assistant", content: "그러면 숨는 게 아니라 '안전한 데서 전체를 보고 싶은 것'에 가깝네요.", type: "insight", insight: { text: "구석을 고르는 건 숨는 게 아니라 전체를 보고 싶은 거다", tags: ["#안전한구석", "#관찰자"] } },
      ],
    },
    "example-2": {
      session: { type: "image", result: { insight: "낡은 것에서 결을 읽는 사람", observation: "빈티지 가죽 가방, 오래된 나무 선반, 세월의 흔적이 있는 물건들", topics: ["취미"], styles: ["빈티지"] } },
      messages: [
        { role: "assistant", content: "사진 속 물건들이 전부 시간이 지난 것들이에요. 새것은 하나도 없네요.\n\n낡은 게 좋은 건가요, 아니면 낡아가는 과정이 좋은 건가요?" },
        { role: "user", content: "과정이요. 시간이 남긴 흔적이 좋아요." },
        { role: "assistant", content: "그러면 빈티지를 좋아하는 게 아니라, '시간이 남긴 결'을 읽는 거네요. 사람한테도 그래요?", type: "insight", insight: { text: "빈티지는 시간이 남긴 결을 좋아하는 것", tags: ["#시간의결", "#빈티지"] } },
      ],
    },
    "example-3": {
      session: { type: "image", result: { insight: "혼자 걷다가 멈추는 곳이 있는 사람", observation: "골목길, 작은 간판, 계획 없이 걷는 느낌의 여행 사진들", topics: ["여행"], styles: ["느린"] } },
      messages: [
        { role: "assistant", content: "관광지가 아니라 골목길이에요. 계획 없이 걷다가 찍은 것 같은데.\n\n걷다가 멈추게 된 이유가 뭐였어요?" },
        { role: "user", content: "간판이 예뻐서요. 작고 오래된 간판." },
        { role: "assistant", content: "큰 풍경이 아니라 작은 디테일에서 멈추는 거네요. 여행에서 가장 기억나는 것도 그런 순간이에요?", type: "insight", insight: { text: "혼자 걷다가 작은 것에서 멈추는 게 여행의 본질", tags: ["#산책", "#디테일"] } },
      ],
    },
  };

  useEffect(() => {
    const id = sessionId as string;
    if (exampleSessions[id]) {
      setSession(exampleSessions[id].session);
      setMessages(exampleSessions[id].messages);
      return;
    }
    const stored = localStorage.getItem(`droppi_session_${sessionId}`);
    if (stored) setSession(JSON.parse(stored));
    const msgs = localStorage.getItem(`droppi_messages_${sessionId}`);
    if (msgs) setMessages(JSON.parse(msgs));
    const savedSummary = localStorage.getItem(`droppi_summary_${sessionId}`);
    if (savedSummary) setSummary(savedSummary);
  }, [sessionId]);

  const insights = messages.filter((m) => m.type === "insight" && m.insight);

  return (
    <>
      <header className="sticky top-0 bg-[#EFEEE9]/90 backdrop-blur-sm z-40 border-b border-[#040000]/8">
        <div className="max-w-[800px] mx-auto px-5 py-3">
          <button onClick={() => router.back()} className="text-[14px] text-[#707980]">← 뒤로</button>
        </div>
      </header>
      <div className="max-w-[800px] mx-auto px-5 pt-4 pb-12">
        {session?.result?.insight && (
          <h1 className="text-[20px] leading-[1.7] mb-4" style={{ fontFamily: "var(--font-serif), serif" }}>
            &ldquo;{session.result.insight}&rdquo;
          </h1>
        )}
        {session?.result?.observation && (
          <p className="text-[13px] text-[#707980] mb-4">{session.result.observation}</p>
        )}
        <div className="flex gap-1.5 flex-wrap mb-6">
          {(session?.result?.topics || []).map((t: string) => <Tag key={t} label={t} type="topic" />)}
          {(session?.result?.styles || []).map((t: string) => <Tag key={t} label={t} type="style" />)}
        </div>

        {messages.length > 0 && (
          <>
            <div className="border-t border-[#040000]/8 pt-6 mb-4">
              <h2 className="text-[13px] text-[#707980] mb-4">대화</h2>
            </div>
            <div className="space-y-4 mb-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[480px] ${msg.role === "user" ? "bg-[#040000]/5 rounded-lg px-4 py-3" : ""}`}>
                    <p className="text-[14px] leading-[1.8] whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 발견 */}
        {insights.length > 0 && (
          <div className="border-t border-[#040000]/8 pt-6 mb-8">
            <h2 className="text-[13px] text-[#707980] mb-4">이 대화에서 나온 발견</h2>
            <div className="space-y-3">
              {insights.map((m, i) => (
                <div key={i} className="rounded-lg p-4" style={{ backgroundColor: "#C2C9A6" + "20" }}>
                  <p className="text-[15px] leading-[1.7]" style={{ fontFamily: "var(--font-serif), serif" }}>
                    &ldquo;{m.insight!.text}&rdquo;
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    {m.insight!.tags.map((t) => <Tag key={t} label={t} type="style" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI 정리 */}
        {summary ? (
          <div className="border-t border-[#040000]/8 pt-6 mb-8">
            <h2 className="text-[13px] text-[#707980] mb-4">대화 정리</h2>
            <div className="rounded-lg p-5 bg-white border border-[#040000]/8">
              <p className="text-[14px] leading-[1.8] whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        ) : messages.length >= 3 && (
          <div className="border-t border-[#040000]/8 pt-6 mb-8">
            <button
              onClick={async () => {
                setIsSummarizing(true);
                try {
                  const essence = localStorage.getItem("droppi_essence");
                  const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      input: { type: "text", content: "이 대화를 깊이 있게 정리해줘. 단순 요약이 아니라, 이 대화에서 드러난 패턴, 핵심 발견, 그리고 이 사람에 대해 새롭게 알게 된 점을 정리해줘." },
                      essence: essence ? JSON.parse(essence) : null,
                      history: messages.map((m) => ({ role: m.role, content: m.content })),
                      insightLog: JSON.parse(localStorage.getItem("droppi_insights") || "[]"),
                    }),
                  });
                  const data = await res.json();
                  setSummary(data.message);
                  localStorage.setItem(`droppi_summary_${sessionId}`, data.message);
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsSummarizing(false);
                }
              }}
              disabled={isSummarizing}
              className="text-[13px] text-[#040000] underline underline-offset-4"
            >
              {isSummarizing ? "정리하는 중..." : "이 대화를 분석하고 정리하기"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
