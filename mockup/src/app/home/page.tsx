import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Tag from "@/components/Tag";

const sessions = [
  {
    type: "사진",
    date: "3.28",
    insight: "등 뒤가 막혀있어야 안심이 되는 거 아닐까",
    observation: "카페 구석 자리, 낮은 조명",
    topics: ["공간"],
    styles: ["따뜻한", "고요한"],
    hasImage: true,
    color: "#7A9CB1",
  },
  {
    type: "아티클",
    date: "3.27",
    insight: "끝내는 게 무서운 게 아니라 평가받는 게 무서운",
    observation: "Closer 근육에 대한 글",
    topics: ["일"],
    styles: ["묵직한"],
    hasImage: false,
    color: "#C2C9A6",
  },
  {
    type: "사진",
    date: "3.26",
    insight: "작업할 때도 벽 쪽을 고른다",
    observation: "작업실 책상, 창문 옆 벽면",
    topics: ["공간"],
    styles: ["고요한"],
    hasImage: true,
    color: "#A5B7C5",
  },
  {
    type: "메모",
    date: "3.25",
    insight: "혼자 채우고 나서야 꺼낸다",
    observation: "팀 회의 전 준비 패턴",
    topics: ["사람"],
    styles: ["느린"],
    hasImage: false,
    color: "#CFE2CF",
  },
  {
    type: "링크",
    date: "3.24",
    insight: "빈티지는 시간이 남긴 결을 좋아하는 것",
    observation: "빈티지 가구 아티클",
    topics: ["취미"],
    styles: ["빈티지"],
    hasImage: true,
    color: "#C2C9A6",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <div className="max-w-[960px] mx-auto px-5 pt-2 pb-20">
        {/* 인사 + Drop */}
        <div className="mb-8">
          <p className="text-[15px] text-[#707980] mb-4">오늘은 뭘 가져왔어?</p>
          <div className="border border-[#040000]/12 rounded-lg bg-white px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#707980]/50">사진, 글, 링크, 메모...</span>
              <span className="text-[13px] text-[#040000] underline underline-offset-4">drop</span>
            </div>
          </div>
        </div>

        {/* 세션 목록 — 매거진 그리드 */}
        <h2 className="text-[13px] text-[#707980] mb-5">최근 읽기</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {sessions.map((item, i) => (
            <Link href="/result" key={i} className="block group">
              <div className="border border-[#040000]/8 rounded-lg overflow-hidden hover:border-[#040000]/15 transition-colors h-[180px]">
                <div className="flex h-full">
                  {/* 왼쪽: 사진 or 날짜 */}
                  {item.hasImage ? (
                    <div
                      className="w-[100px] md:w-[120px] flex-shrink-0 bg-[#040000]/6 flex items-end p-3"
                    >
                      <span className="text-[13px] text-white font-medium drop-shadow-sm">{item.date}</span>
                    </div>
                  ) : (
                    <div
                      className="w-[100px] md:w-[120px] flex-shrink-0 flex items-end p-3"
                      style={{ backgroundColor: item.color }}
                    >
                      <span className="text-[18px] text-white font-medium">{item.date}</span>
                    </div>
                  )}
                  {/* 오른쪽: 텍스트 */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] text-[#707980]/60 mb-1 block">{item.type}</span>
                      <p className="text-[15px] leading-[1.6] line-clamp-2" style={{ fontFamily: "var(--font-serif), serif" }}>
                        {item.insight}
                      </p>
                      <p className="text-[12px] text-[#707980]/50 mt-1">{item.observation}</p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {item.topics.map((t) => <Tag key={t} label={t} type="topic" />)}
                      {item.styles.map((t) => <Tag key={t} label={t} type="style" />)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 주제 모음 */}
        <h2 className="text-[13px] text-[#707980] mb-4">주제 모음</h2>

        <div className="flex gap-2 flex-wrap mb-8">
          {[
            { label: "공간", count: 3, color: "#7A9CB1" },
            { label: "일", count: 2, color: "#45525A" },
            { label: "사람", count: 1, color: "#CFE2CF" },
            { label: "취미", count: 1, color: "#C2C9A6" },
          ].map((theme) => (
            <Link href="/themes" key={theme.label}>
              <div className="border border-[#040000]/10 rounded-lg px-4 py-3 hover:border-[#040000]/20 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                  <span className="text-[14px]">{theme.label}</span>
                  <span className="text-[11px] text-[#707980]">{theme.count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
