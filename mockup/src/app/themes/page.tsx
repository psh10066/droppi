"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Tag from "@/components/Tag";
import { useState } from "react";

const themes = [
  {
    label: "공간",
    color: "#7A9CB1",
    count: 3,
    readings: [
      { date: "3.28", insight: "등 뒤가 막혀있어야 안심이 되는 거 아닐까", type: "사진", styles: ["따뜻한", "고요한"] },
      { date: "3.26", insight: "작업할 때도 벽 쪽을 고른다", type: "사진", styles: ["고요한"] },
      { date: "3.15", insight: "혼자 있을 때 편한 자리가 있다", type: "메모", styles: ["느린"] },
    ],
  },
  {
    label: "일",
    color: "#45525A",
    count: 2,
    readings: [
      { date: "3.27", insight: "끝내는 게 무서운 게 아니라 평가받는 게 무서운", type: "아티클", styles: ["묵직한"] },
      { date: "3.22", insight: "방법론을 쌓는 게 실행을 대체한다", type: "메모", styles: ["묵직한"] },
    ],
  },
  {
    label: "사람",
    color: "#CFE2CF",
    count: 1,
    readings: [
      { date: "3.25", insight: "혼자 채우고 나서야 꺼낸다", type: "메모", styles: ["느린"] },
    ],
  },
  {
    label: "취미",
    color: "#C2C9A6",
    count: 1,
    readings: [
      { date: "3.24", insight: "빈티지는 시간이 남긴 결을 좋아하는 것", type: "링크", styles: ["빈티지"] },
    ],
  },
];

export default function Themes() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <>
      <Header />
      <div className="max-w-[640px] mx-auto px-5 pt-4 pb-20">
        <h1 className="text-[20px] font-medium mb-2">주제 모음</h1>
        <p className="text-[13px] text-[#707980] mb-8">비슷한 읽기끼리 묶여요.</p>

        {/* 폴더 카드 스택 */}
        <div className="relative">
          {themes.map((theme, i) => {
            const isExpanded = expanded === i;
            const isBelow = expanded !== null && i > expanded;
            const expandedHeight = expanded !== null ? themes[expanded].readings.length * 80 + 20 : 0;

            return (
              <div
                key={theme.label}
                className="transition-all duration-300 ease-out w-full"
                style={{
                  position: "relative",
                  zIndex: expanded === i ? 50 : themes.length - i,
                  marginTop: i === 0 ? 0 : isBelow ? 12 : -24,
                  transform: isBelow ? `translateY(${expandedHeight}px)` : "none",
                }}
              >
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-300 w-full"
                  style={{
                    backgroundColor: "white",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
                  }}
                  onClick={() => setExpanded(isExpanded ? null : i)}
                >
                  {/* 카드 상단 — 컬러 탭 */}
                  <div
                    className="h-[5px]"
                    style={{ backgroundColor: theme.color }}
                  />

                  {/* 카드 헤더 */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="text-[17px] font-medium">{theme.label}</span>
                      <span className="text-[13px] text-[#707980]">{theme.count}개 읽기</span>
                    </div>
                    <span className="text-[16px] text-[#707980]/40 leading-none">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </div>

                  {/* 펼쳐진 읽기 목록 */}
                  {isExpanded && (
                    <div className="px-6 pb-5">
                      {theme.readings.map((reading, j) => (
                        <div
                          key={j}
                          className={`flex gap-4 py-4 ${j > 0 ? "border-t border-[#040000]/6" : ""}`}
                        >
                          {/* 왼쪽: 날짜 블록 */}
                          <div
                            className="w-[48px] h-[48px] rounded-lg flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: theme.color + "18" }}
                          >
                            <span className="text-[12px] font-medium" style={{ color: theme.color }}>
                              {reading.date}
                            </span>
                          </div>
                          {/* 오른쪽: 내용 */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-[#707980]/50 block mb-0.5">{reading.type}</span>
                            <p
                              className="text-[14px] leading-[1.6] mb-2 truncate"
                              style={{ fontFamily: "var(--font-serif), serif" }}
                            >
                              {reading.insight}
                            </p>
                            <div className="flex gap-1.5">
                              {reading.styles.map((s) => (
                                <Tag key={s} label={s} type="style" />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-24" />
      </div>
      <BottomNav />
    </>
  );
}
