"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Tag from "@/components/Tag";
import { resizeImage } from "@/lib/image-utils";

export default function Landing() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState("");

  const handleDrop = () => {
    fileRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const resized = await resizeImage(file);
    localStorage.setItem("droppi_drop", JSON.stringify({ type: "image", content: resized }));
    router.push("/result");
  };

  const handleTextDrop = () => {
    if (!textValue.trim()) return;
    const isLink = /^https?:\/\//.test(textValue.trim());
    localStorage.setItem("droppi_drop", JSON.stringify({
      type: isLink ? "link" : "text",
      content: textValue.trim(),
    }));
    router.push("/result");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5">
      <div className="mb-10 flex items-center gap-2.5">
        <Image src="/logo-symbol.svg" alt="" width={18} height={40} />
        <Image src="/logo-wordmark.svg" alt="droppi" width={64} height={17} />
      </div>

      <h1
        className="text-[32px] md:text-[40px] font-medium leading-[1.4] text-center mb-3"
        style={{ fontFamily: "var(--font-serif), serif" }}
      >
        뭐든 넣으면
        <br />
        당신이 보입니다.
      </h1>

      <p className="text-[14px] text-[#707980] mb-12">
        사진, 글, 링크, 메모 아무거나.
      </p>

      <button
        onClick={handleDrop}
        className="bg-[#040000] text-white text-[14px] px-8 py-3 rounded-full hover:bg-[#45525A] transition-colors mb-3"
      >
        drop
      </button>

      <button
        onClick={() => setShowTextInput(!showTextInput)}
        className="text-[12px] text-[#707980] underline underline-offset-4"
      >
        글이나 링크로 시작하기
      </button>

      {showTextInput && (
        <div className="mt-6 w-full max-w-[400px]">
          <div className="border border-[#040000]/12 rounded-lg bg-white px-4 py-3.5">
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="글, 링크, 메모를 입력하세요..."
              rows={3}
              className="w-full text-[14px] bg-transparent outline-none resize-none placeholder:text-[#707980]/50"
            />
          </div>
          <button
            onClick={handleTextDrop}
            disabled={!textValue.trim()}
            className={`mt-3 w-full py-3 rounded-full text-[14px] transition-colors ${
              textValue.trim()
                ? "bg-[#040000] text-white"
                : "bg-[#040000]/10 text-[#707980] cursor-not-allowed"
            }`}
          >
            읽기 시작
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="mt-24 mb-20 w-full max-w-[640px] overflow-x-auto scrollbar-hide" style={{ position: "relative", zIndex: 10000 }}>
        <div className="flex gap-3 pb-4" style={{ minWidth: "fit-content" }}>
          {[
            { id: "example-1", insight: "안전한 구석에서 전체를 보는 사람", topics: ["공간"], styles: ["고요한"] },
            { id: "example-2", insight: "낡은 것에서 결을 읽는 사람", topics: ["취미"], styles: ["빈티지"] },
            { id: "example-3", insight: "혼자 걷다가 멈추는 곳이 있는 사람", topics: ["여행"], styles: ["느린"] },
          ].map((card) => (
            <button key={card.id} onClick={() => router.push(`/sessions/${card.id}`)} className="flex-shrink-0 w-[200px] border border-[#040000]/10 rounded-lg p-5 text-left hover:border-[#040000]/20 transition-colors">
              <p className="text-[14px] leading-[1.8] mb-4" style={{ fontFamily: "var(--font-serif), serif" }}>
                &ldquo;{card.insight}&rdquo;
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {card.topics.map((t) => <Tag key={t} label={t} type="topic" />)}
                {card.styles.map((t) => <Tag key={t} label={t} type="style" />)}
              </div>
              <p className="text-[11px] text-[#707980]/50 mt-3">자세히 보기 →</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
