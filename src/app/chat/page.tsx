"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "question" | "insight";
  insight?: { text: string; tags: string[]; connectedEssence?: string };
  saved?: boolean;
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
    const userMsg: Message = { role: "user", content: "[사진]" };
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

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 bg-[#EFEEE9]/90 backdrop-blur-sm z-40 border-b border-[#040000]/8">
        <div className="max-w-[640px] mx-auto px-5 py-3 flex items-center">
          <button onClick={() => router.push("/home")} className="text-[14px] text-[#707980]">← 홈</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "user" ? (
              <div className="bg-[#040000]/5 rounded-lg px-4 py-3 max-w-[280px]">
                <p className="text-[14px] whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : (
              <div className="max-w-[320px]">
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

      <div className="border-t border-[#040000]/8 px-5 py-3 bg-[#EFEEE9]">
        <div className="max-w-[640px] mx-auto flex items-end gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={isSending} className="text-[#707980] shrink-0 pb-1 text-[24px]">📷</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSend} />
          <div className="flex-1 border border-[#040000]/12 rounded-lg bg-white px-4 py-2.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="메시지..."
              className="w-full text-[14px] bg-transparent outline-none placeholder:text-[#707980]/50"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isSending}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className={`shrink-0 pb-1 text-[28px] ${text.trim() && !isSending ? "text-[#040000]" : "text-[#707980]/30"}`}
          >
            →
          </button>
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
