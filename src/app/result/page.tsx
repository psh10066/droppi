"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Tag from "@/components/Tag";

interface ReadingResult {
  insight: string;
  observation: string;
  question: string;
  topics: string[];
  styles: string[];
  palette: string[];
  dimensions: Record<string, { label: string; description: string }>;
  connection?: string;
}

export default function ResultPage() {
  const router = useRouter();
  const [drop, setDrop] = useState<{ type: string; content: string } | null>(null);
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showDimensions, setShowDimensions] = useState<string | null>(null);

  const loadingSteps = drop?.type === "image"
    ? ["뭐가 찍혀있는지 보는 중", "왜 이걸 골랐을지 생각 중", "당신의 말로 옮기는 중"]
    : drop?.type === "link"
    ? ["어떤 내용인지 읽는 중", "뭐가 걸렸을지 생각 중", "당신의 말로 옮기는 중"]
    : ["어떤 생각인지 읽는 중", "왜 지금 이게 떠올랐을지 생각 중", "당신의 말로 옮기는 중"];

  useEffect(() => {
    const stored = localStorage.getItem("droppi_drop");
    if (!stored) { router.push("/"); return; }
    const parsed = JSON.parse(stored);
    setDrop(parsed);

    const timer = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 2));
    }, 3000);

    const analyze = async () => {
      try {
        const body = parsed.type === "image"
          ? { images: [parsed.content] }
          : { images: [], text: parsed.content, inputType: parsed.type };

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.essence) {
          const r: ReadingResult = {
            insight: data.essence.headline,
            observation: data.essence.observation,
            question: data.essence.firstQuestion,
            topics: data.essence.topics || [],
            styles: data.essence.styles || [],
            palette: data.essence.palette || [],
            dimensions: data.essence.dimensions || {},
            connection: data.essence.connection,
          };
          setResult(r);
          localStorage.setItem("droppi_essence", JSON.stringify(data.essence));
          localStorage.setItem("droppi_last_result", JSON.stringify(r));
        }
      } catch (err) {
        console.error("Analyze failed:", err);
      }
    };

    const minWait = new Promise((r) => setTimeout(r, 9000));
    Promise.all([analyze(), minWait]).then(() => {
      clearInterval(timer);
      setLoading(false);
    });

    return () => clearInterval(timer);
  }, [router]);

  const handleAnswer = () => {
    if (!answer.trim()) return;
    const sessionId = crypto.randomUUID();
    const messages = [
      { role: "assistant", content: `${result?.insight}\n\n${result?.question}` },
      { role: "user", content: answer.trim() },
    ];
    if (drop?.type === "image" && drop.content) {
      localStorage.setItem(`droppi_image_${sessionId}`, drop.content);
    }
    localStorage.setItem(`droppi_session_${sessionId}`, JSON.stringify({
      type: drop?.type || "text",
      content: drop?.content?.slice(0, 100) || "",
      hasImage: drop?.type === "image",
      createdAt: new Date().toISOString(),
      result,
    }));
    localStorage.setItem(`droppi_messages_${sessionId}`, JSON.stringify(messages));
    router.push(`/chat?sessionId=${sessionId}&autoSend=true`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        {drop?.type === "image" && drop.content && (
          <div className="w-[200px] aspect-[4/3] rounded-lg overflow-hidden mb-10">
            <img src={drop.content} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-[16px] text-[#040000] mb-8">읽고 있어요...</p>
        <div className="space-y-4">
          {loadingSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm w-4">
                {i < loadingStep ? "✓" : i === loadingStep ? <span className="animate-pulse">●</span> : <span className="text-[#707980]">○</span>}
              </span>
              <span className={`text-[15px] ${i <= loadingStep ? "text-[#040000]" : "text-[#707980]"}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-5">
        <p className="text-[#707980]">읽지 못했어요.</p>
        <button
          onClick={() => router.push("/")}
          className="text-[14px] text-[#040000] underline underline-offset-4"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const dimensionKeys = ["volume", "texture", "opacity", "tactility", "weight", "temperature"];

  return (
    <>
      <Header />
      <div className="max-w-[800px] mx-auto px-5 pt-4 pb-12">
        {drop?.type === "image" && drop.content && (
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-10">
            <img src={drop.content} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <p className="text-[13px] text-[#707980] mb-5">이렇게 읽어봤어요.</p>

        <h1
          className="text-[24px] md:text-[28px] leading-[1.7] mb-6"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          &ldquo;{result.insight}&rdquo;
        </h1>

        <p className="text-[14px] text-[#707980] leading-[1.8] mb-8">
          {result.observation}
        </p>

        {/* 태그 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {result.topics.map((t) => <Tag key={t} label={t} type="topic" />)}
          {result.styles.map((t) => <Tag key={t} label={t} type="style" />)}
        </div>

        {/* 6축 (접이식) */}
        {Object.keys(result.dimensions).length > 0 && (
          <div className="mb-8">
            {dimensionKeys.map((key) => {
              const dim = result.dimensions[key];
              if (!dim) return null;
              return (
                <div
                  key={key}
                  className="border-b border-[#040000]/5 py-3 cursor-pointer"
                  onClick={() => setShowDimensions(showDimensions === key ? null : key)}
                >
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#707980]">{dim.label}</span>
                    <span className="text-[#040000]">{showDimensions === key ? "−" : "+"}</span>
                  </div>
                  {showDimensions === key && (
                    <p className="text-[13px] text-[#45525A] mt-2">{dim.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 축적 연결 */}
        {result.connection && (
          <p className="text-[13px] text-[#707980] mb-6">{result.connection}</p>
        )}

        <div className="border-t border-[#040000]/8 mb-8" />

        {/* 질문 + 입력 */}
        <p className="text-[15px] text-[#040000] leading-[1.8] mb-6">
          {result.question}
        </p>

        <div className="mb-6">
          <div className="border border-[#040000]/12 rounded-lg bg-white px-4 py-3.5">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="뭔가 떠오르면 말해줘요."
              className="w-full text-[14px] bg-transparent outline-none placeholder:text-[#707980]/50"
              onKeyDown={(e) => e.key === "Enter" && handleAnswer()}
            />
          </div>
        </div>

        <button
          onClick={handleAnswer}
          disabled={!answer.trim()}
          className={`w-full py-3 rounded-full text-[14px] transition-colors mb-6 ${
            answer.trim()
              ? "bg-[#040000] text-white"
              : "bg-[#040000]/10 text-[#707980] cursor-not-allowed"
          }`}
        >
          답하기
        </button>

        <button
          onClick={() => {
            // 스킵해도 읽기 결과는 저장
            const skipId = crypto.randomUUID();
            if (drop?.type === "image" && drop.content) {
              localStorage.setItem(`droppi_image_${skipId}`, drop.content);
            }
            localStorage.setItem(`droppi_session_${skipId}`, JSON.stringify({
              type: drop?.type || "text",
              content: drop?.content?.slice(0, 100) || "",
              hasImage: drop?.type === "image",
              createdAt: new Date().toISOString(),
              result,
            }));
            router.push("/home");
          }}
          className="block w-full text-center text-[13px] text-[#707980]/50"
        >
          그냥 넘어갈래요
        </button>
      </div>
    </>
  );
}
