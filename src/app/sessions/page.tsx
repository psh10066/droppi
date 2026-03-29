"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Tag from "@/components/Tag";

interface SessionEntry {
  id: string;
  type: string;
  createdAt: string;
  imageUrl?: string;
  result?: { insight: string; observation: string; topics: string[]; styles: string[] };
}

const topicColors: Record<string, string> = {
  공간: "#7A9CB1", 일: "#45525A", 사람: "#CFE2CF", 취미: "#C2C9A6",
  여행: "#C2C9A6", 음식: "#A5B7C5", 자연: "#CFE2CF", 패션: "#7A9CB1",
};

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("droppi_session_"));
    const loaded = keys.map((key) => {
      const id = key.replace("droppi_session_", "");
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      const imageData = data.type === "image" || data.hasImage
        ? localStorage.getItem(`droppi_image_${id}`) || data.imageUrl
        : null;
      return { id, type: data.type || "text", createdAt: data.createdAt || "", result: data.result, imageUrl: imageData || undefined };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSessions(loaded);
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getMonth() + 1}.${d.getDate()} (${["일","월","화","수","목","금","토"][d.getDay()]})`;
  };
  const typeLabel: Record<string, string> = { image: "사진", text: "텍스트", link: "링크", memo: "메모" };

  return (
    <>
      <Header />
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-4 pb-20">
        <h1 className="text-[18px] font-medium mb-6">세션</h1>
        {sessions.length === 0 ? (
          <p className="text-[13px] text-[#707980]/50">아직 대화가 없어요. 뭐든 drop해 보세요.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {sessions.map((s) => {
              const mainTopic = s.result?.topics?.[0] || "";
              const bgColor = topicColors[mainTopic] || "#707980";
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/sessions/${s.id}`)}
                  className="w-full text-left border border-[#040000]/8 hover:border-[#040000]/15 transition-colors"
                >
                  <div className="flex h-[160px]">
                    {/* 왼쪽: 사진 or 컬러+날짜 */}
                    {s.imageUrl ? (
                      <div className="w-[120px] flex-shrink-0 relative">
                        <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 text-[12px] text-white font-medium drop-shadow-md">
                          {formatDate(s.createdAt)}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="w-[120px] flex-shrink-0 flex items-end p-3"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className="text-[16px] text-white font-medium">{formatDate(s.createdAt)}</span>
                      </div>
                    )}
                    {/* 오른쪽: 텍스트 */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[11px] text-[#707980]/60">{typeLabel[s.type] || s.type}</span>
                          {s.imageUrl && <span className="text-[11px] text-[#707980]/40">{formatDate(s.createdAt)}</span>}
                        </div>
                        <p className="text-[15px] leading-[1.6] line-clamp-2" style={{ fontFamily: "var(--font-serif), serif" }}>
                          {s.result?.insight || "읽기 결과"}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {(s.result?.topics || []).map((t) => <Tag key={t} label={t} type="topic" />)}
                        {(s.result?.styles || []).map((t) => <Tag key={t} label={t} type="style" />)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
