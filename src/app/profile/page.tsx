"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Tag from "@/components/Tag";

export default function ProfilePage() {
  const [essence, setEssence] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [themes, setThemes] = useState<{ label: string; count: number; color: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("droppi_essence");
    if (stored) setEssence(JSON.parse(stored));

    const ins = JSON.parse(localStorage.getItem("droppi_insights") || "[]");
    setInsights(ins);

    const allTags = ins.flatMap((i: any) => i.tags || []);
    const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {});
    setKeywords(Object.entries(tagCounts).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 10).map(([t]) => t));

    const keys = Object.keys(localStorage).filter((k) => k.startsWith("droppi_session_"));
    const topicMap: Record<string, number> = {};
    keys.forEach((key) => {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      (data.result?.topics || []).forEach((t: string) => { topicMap[t] = (topicMap[t] || 0) + 1; });
    });
    const colors: Record<string, string> = { 공간: "#7A9CB1", 일: "#45525A", 사람: "#CFE2CF", 취미: "#C2C9A6" };
    setThemes(Object.entries(topicMap).map(([l, c]) => ({ label: l, count: c, color: colors[l] || "#707980" })));
  }, []);

  const dimensionKeys = ["volume", "texture", "opacity", "tactility", "weight", "temperature"];

  return (
    <>
      <Header />
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-4 pb-20">
        <h1 className="text-[13px] text-[#707980] mb-4">나의 에센스</h1>

        {essence ? (
          <>
            <p className="text-[24px] leading-[1.7] mb-6" style={{ fontFamily: "var(--font-serif), serif" }}>
              &ldquo;{essence.headline}&rdquo;
            </p>
            <div className="mb-8">
              {dimensionKeys.map((key) => {
                const dim = essence.dimensions?.[key];
                if (!dim) return null;
                return (
                  <div key={key} className="flex justify-between text-[13px] border-b border-[#040000]/5 py-2.5">
                    <span className="text-[#707980]">{dim.label}</span>
                    <span className="text-[#040000]">{dim.description}</span>
                  </div>
                );
              })}
            </div>
            {essence.palette?.length > 0 && (
              <div className="flex gap-3 mb-8">
                {essence.palette.map((c: string, i: number) => (
                  <div key={i} className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[13px] text-[#707980]/50 mb-8">아직 에센스가 없어요. 뭐든 drop해 보세요.</p>
        )}

        {themes.length > 0 && (
          <div className="border-t border-[#040000]/8 pt-6 mb-8">
            <h2 className="text-[13px] text-[#707980] mb-4">주제 모음</h2>
            <div className="flex gap-2 flex-wrap">
              {themes.map((t) => (
                <div key={t.label} className="border border-[#040000]/10 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-[14px]">{t.label}</span>
                    <span className="text-[11px] text-[#707980]">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#040000]/8 pt-6 mb-8">
          <h2 className="text-[13px] text-[#707980] mb-4">축적된 발견 ({insights.length})</h2>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <div key={i} className="border border-[#040000]/10 rounded-lg p-4">
                  <p className="text-[14px] mb-2" style={{ fontFamily: "var(--font-serif), serif" }}>&ldquo;{ins.text}&rdquo;</p>
                  <div className="flex gap-1.5">
                    {(ins.tags || []).map((t: string) => <Tag key={t} label={t} type="style" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#707980]/50">대화에서 발견이 쌓이면 여기 나타나요</p>
          )}
        </div>

        {keywords.length > 0 && (
          <div className="border-t border-[#040000]/8 pt-6 mb-8">
            <h2 className="text-[13px] text-[#707980] mb-4">반복 키워드</h2>
            <div className="flex gap-2 flex-wrap">
              {keywords.map((k) => (
                <span key={k} className="text-[13px] border border-[#040000]/10 rounded-full px-3 py-1">{k}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
