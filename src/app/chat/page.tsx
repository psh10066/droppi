"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "question" | "insight";
  insight?: { text: string; tags: string[]; connectedEssence?: string };
  saved?: boolean;
  imageUrl?: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId") || crypto.randomUUID();
  const autoSend = searchParams.get("autoSend") === "true";
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    const stored = localStorage.getItem(`droppi_messages_${sessionId}`);
    if (stored) {
      const msgs = JSON.parse(stored);
      setMessages(msgs);
      if (autoSend && msgs.length >= 2) {
        sendToAPI(msgs);
      }
    }
  }, [initialized, sessionId, autoSend]);

  const saveMessages = (msgs: Message[]) => {
    localStorage.setItem(`droppi_messages_${sessionId}`, JSON.stringify(msgs));
  };

  const sendToAPI = async (currentMessages: Message[]) => {
    setIsSending(true);
    try {
      const essence = localStorage.getItem("droppi_essence");
      const insights = JSON.parse(localStorage.getItem("droppi_insights") || "[]");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { type: "text", content: currentMessages[currentMessages.length - 1].content },
          essence: essence ? JSON.parse(essence) : null,
          history: currentMessages.map((m) => ({ role: m.role, content: m.content })),
          insightLog: insights,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        role: "assistant",
        content: data.message,
        type: data.type,
        insight: data.insight,
      };
      const updated = [...currentMessages, aiMsg];
      setMessages(updated);
      saveMessages(updated);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    saveMessages(updated);
    setText("");
    await sendToAPI(updated);
  };

  const handlePhotoSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isSending) return;
    e.target.value = "";

    const { resizeImage } = await import("@/lib/image-utils");
    const base64 = await resizeImage(file);
    const userMsg: Message = { role: "user", content: "[사진]", imageUrl: base64 };
    const updated = [...messages, userMsg];
    setMessages(updated);
    saveMessages(updated);

    setIsSending(true);
    try {
      const essence = localStorage.getItem("droppi_essence");
      const insights = JSON.parse(localStorage.getItem("droppi_insights") || "[]");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { type: "image", content: base64 },
          essence: essence ? JSON.parse(essence) : null,
          history: updated.map((m) => ({ role: m.role, content: m.content })),
          insightLog: insights,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = { role: "assistant", content: data.message, type: data.type, insight: data.insight };
      const withAi = [...updated, aiMsg];
      setMessages(withAi);
      saveMessages(withAi);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveInsight = (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg.insight) return;
    const saved = JSON.parse(localStorage.getItem("droppi_insights") || "[]");
    saved.push({ ...msg.insight, createdAt: new Date().toISOString(), sessionId });
    localStorage.setItem("droppi_insights", JSON.stringify(saved));
    const updated = messages.map((m, i) => i === msgIndex ? { ...m, saved: true } : m);
    setMessages(updated);
    saveMessages(updated);
  };

  const handleSaveSession = async () => {
    if (messages.length < 2 || isSaving) return;
    setIsSaving(true);
    try {
      const essence = localStorage.getItem("droppi_essence");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { type: "text", content: "이 대화를 정리해줘. 오늘 대화에서 나온 핵심 발견, 패턴, 인사이트를 간결하게 정리해줘." },
          essence: essence ? JSON.parse(essence) : null,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          insightLog: JSON.parse(localStorage.getItem("droppi_insights") || "[]"),
        }),
      });
      const data = await res.json();
      const summaryMsg: Message = {
        role: "assistant",
        content: data.message,
        type: data.type,
        insight: data.insight,
      };
      const updated = [...messages, { role: "user" as const, content: "이 대화를 정리해줘." }, summaryMsg];
      setMessages(updated);
      saveMessages(updated);

      // 세션 저장
      const drop = localStorage.getItem("droppi_drop");
      const lastResult = localStorage.getItem("droppi_last_result");
      const sessions = JSON.parse(localStorage.getItem("droppi_sessions") || "[]");
      sessions.unshift({
        id: sessionId,
        date: new Date().toISOString(),
        type: drop ? JSON.parse(drop).type : "text",
        preview: lastResult ? JSON.parse(lastResult).insight : messages[0]?.content?.slice(0, 50),
        messageCount: updated.length,
        summary: data.message?.slice(0, 100),
      });
      localStorage.setItem("droppi_sessions", JSON.stringify(sessions));
      setSaved(true);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: "#EFEEE9" }}>
      <header className="sticky top-0 bg-[#EFEEE9] z-40 border-b border-[#040000]/8">
        <div style={{ maxWidth: 720, marginLeft: "auto", marginRight: "auto", paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12, display: "flex", alignItems: "center" }}>
          <button onClick={() => router.push("/home")} className="text-[14px] text-[#707980]">← 홈</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <div style={{ maxWidth: 720, marginLeft: "auto", marginRight: "auto", paddingLeft: 20, paddingRight: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "user" ? (
              <div className="bg-[#040000]/5 rounded-lg overflow-hidden" style={{ maxWidth: 420 }}>
                {msg.imageUrl ? (
                  <img src={msg.imageUrl} alt="" className="w-[200px]" />
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-[14px] whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ maxWidth: 420 }}>
                <p className="text-[14px] leading-[1.8] whitespace-pre-wrap">{msg.content}</p>
                {msg.type === "insight" && msg.insight && (
                  <div className="mt-3 border border-[#040000]/10 rounded-lg p-4 bg-white">
                    <p className="text-[15px] mb-2" style={{ fontFamily: "var(--font-serif), serif" }}>
                      &ldquo;{msg.insight.text}&rdquo;
                    </p>
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {msg.insight.tags.map((tag) => (
                        <span key={tag} className="text-[11px] text-[#707980] border border-[#040000]/10 rounded-full px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSaveInsight(i)}
                      disabled={msg.saved}
                      className={`text-[12px] underline underline-offset-2 ${msg.saved ? "text-[#707980]/40" : "text-[#040000]"}`}
                    >
                      {msg.saved ? "저장됨 ✓" : "기록할까요?"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <p className="text-[14px] text-[#707980] animate-pulse">· · ·</p>
          </div>
        )}
        <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-[#040000]/8 bg-[#EFEEE9]">
        <div style={{ maxWidth: 720, marginLeft: "auto", marginRight: "auto", paddingLeft: 20, paddingRight: 20 }}>
          {/* 이 세션 정리하고 저장하기 */}
          {messages.length >= 3 && (
            <div className="flex justify-center pt-3 pb-1">
              {saved ? (
                <span className="text-[13px] text-[#707980]/50">저장됨 ✓</span>
              ) : (
                <button
                  onClick={handleSaveSession}
                  disabled={isSaving}
                  className="text-[13px] text-[#040000] border border-[#040000]/15 rounded-full px-5 py-2 hover:bg-[#040000]/5 transition-colors"
                >
                  {isSaving ? "정리하는 중..." : "이 세션 정리하고 저장하기"}
                </button>
              )}
            </div>
          )}
          {/* 입력 */}
          <div className="flex items-end gap-3 py-3">
            <button onClick={() => fileRef.current?.click()} disabled={isSending} className="shrink-0 text-[#707980] hover:text-[#040000] transition-colors mb-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSend} />
            <div className="flex-1 border border-[#040000]/12 rounded-lg bg-white px-4 py-2.5 overflow-hidden">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  const el = e.target;
                  el.style.height = "24px";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
                placeholder="메시지..."
                rows={1}
                style={{ height: 24, maxHeight: 120, overflowY: "auto", lineHeight: "24px" }}
                className="w-full text-[14px] bg-transparent outline-none resize-none placeholder:text-[#707980]/50 block"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isSending}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!text.trim() || isSending}
              className={`shrink-0 mb-2.5 transition-colors ${text.trim() && !isSending ? "text-[#040000]" : "text-[#707980]/30"}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><p className="text-[#707980]">로딩 중...</p></div>}>
      <ChatContent />
    </Suspense>
  );
}
