"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Tag from "@/components/Tag";
import { resizeImage } from "@/lib/image-utils";

interface SessionEntry {
  id: string;
  type: string;
  createdAt: string;
  imageUrl?: string;
  result?: {
    insight: string;
    observation: string;
    topics: string[];
    styles: string[];
  };
}

const topicColors: Record<string, string> = {
  공간: "#7A9CB1", 일: "#45525A", 사람: "#CFE2CF", 취미: "#C2C9A6",
  여행: "#C2C9A6", 음식: "#A5B7C5", 자연: "#CFE2CF", 패션: "#7A9CB1",
};

export default function Home() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [themes, setThemes] = useState<{ label: string; count: number; color: string }[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState("");

  useEffect(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("droppi_session_"));
    const loaded = keys.map((key) => {
      const id = key.replace("droppi_session_", "");
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      const imageUrl = data.hasImage ? localStorage.getItem(`droppi_image_${id}`) : (data.imageUrl || null);
      return { id, type: data.type || "text", createdAt: data.createdAt || "", result: data.result, imageUrl };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSessions(loaded);

    const topicMap: Record<string, number> = {};
    loaded.forEach((s) => {
      (s.result?.topics || []).forEach((t: string) => { topicMap[t] = (topicMap[t] || 0) + 1; });
    });
    const colors: Record<string, string> = { 공간: "#7A9CB1", 일: "#45525A", 사람: "#CFE2CF", 취미: "#C2C9A6", 여행: "#C2C9A6", 음식: "#A5B7C5" };
    setThemes(Object.entries(topicMap).map(([label, count]) => ({ label, count, color: colors[label] || "#707980" })));
  }, []);

  const handlePhotoDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    localStorage.setItem("droppi_drop", JSON.stringify({ type: "image", content: resized }));
    router.push("/result");
  };

  const handleTextDrop = () => {
    if (!textValue.trim()) return;
    const isLink = /^https?:\/\//.test(textValue.trim());
    localStorage.setItem("droppi_drop", JSON.stringify({ type: isLink ? "link" : "text", content: textValue.trim() }));
    router.push("/result");
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  };

  const typeLabel: Record<string, string> = { image: "사진", text: "텍스트", link: "링크", memo: "메모" };

  return (
    <>
      <Header />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoDrop} />
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-2 pb-20">
        <div className="mb-8">
          <p className="text-[15px] text-[#707980] mb-4">오늘은 뭘 가져왔어?</p>

          {!showTextInput ? (
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 border border-[#040000]/12 rounded-lg bg-white px-4 py-3.5 text-left"
              >
                <span className="text-[14px] text-[#707980]/50">📷 사진으로 시작</span>
              </button>
              <button
                onClick={() => setShowTextInput(true)}
                className="flex-1 border border-[#040000]/12 rounded-lg bg-white px-4 py-3.5 text-left"
              >
                <span className="text-[14px] text-[#707980]/50">📝 글이나 링크로 시작</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="border border-[#040000]/12 rounded-lg bg-white px-4 py-3">
                <textarea
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="글, 링크, 메모를 입력하세요..."
                  rows={3}
                  className="w-full text-[14px] bg-transparent outline-none resize-none placeholder:text-[#707980]/50"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setShowTextInput(false); setTextValue(""); }}
                  className="text-[13px] text-[#707980] underline underline-offset-4"
                >
                  취소
                </button>
                <button
                  onClick={handleTextDrop}
                  disabled={!textValue.trim()}
                  className={`flex-1 py-2.5 rounded-full text-[14px] transition-colors ${
                    textValue.trim() ? "bg-[#040000] text-white" : "bg-[#040000]/10 text-[#707980] cursor-not-allowed"
                  }`}
                >
                  읽기 시작
                </button>
              </div>
            </div>
          )}
        </div>

        <h2 className="text-[13px] text-[#707980] mb-5">최근 읽기</h2>

        {sessions.length === 0 ? (
          <p className="text-[13px] text-[#707980]/50 mb-12">아직 발견이 없어요. 뭐든 가져와볼래요?</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-12">
            {sessions.slice(0, 4).map((item) => {
              const mainTopic = item.result?.topics?.[0] || "";
              const bgColor = topicColors[mainTopic] || "#707980";
              return (
                <button key={item.id} onClick={() => router.push(`/sessions/${item.id}`)} className="w-full text-left border border-[#040000]/8 hover:border-[#040000]/15 transition-colors">
                  <div className="flex h-[160px]">
                    {item.imageUrl ? (
                      <div className="w-[120px] flex-shrink-0 relative">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 text-[12px] text-white font-medium drop-shadow-md">{formatDate(item.createdAt)}</span>
                      </div>
                    ) : (
                      <div className="w-[120px] flex-shrink-0 flex items-end p-3" style={{ backgroundColor: bgColor }}>
                        <span className="text-[16px] text-white font-medium">{formatDate(item.createdAt)}</span>
                      </div>
                    )}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <span className="text-[11px] text-[#707980]/60 mb-1 block">{typeLabel[item.type] || item.type}</span>
                        <p className="text-[15px] leading-[1.6] line-clamp-2" style={{ fontFamily: "var(--font-serif), serif" }}>
                          {item.result?.insight || "읽기 결과"}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {(item.result?.topics || []).map((t) => <Tag key={t} label={t} type="topic" />)}
                        {(item.result?.styles || []).map((t) => <Tag key={t} label={t} type="style" />)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {themes.length > 0 && (
          <>
            <h2 className="text-[13px] text-[#707980] mb-4">주제 모음</h2>
            <div className="flex gap-2 flex-wrap mb-8">
              {themes.map((theme) => (
                <button key={theme.label} onClick={() => router.push(`/themes/${encodeURIComponent(theme.label)}`)}>
                  <div className="border border-[#040000]/10 rounded-lg px-4 py-3 hover:border-[#040000]/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                      <span className="text-[14px]">{theme.label}</span>
                      <span className="text-[11px] text-[#707980]">{theme.count}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}
