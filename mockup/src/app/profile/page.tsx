import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Tag from "@/components/Tag";

export default function Profile() {
  return (
    <>
      <Header />
      <div className="max-w-[640px] mx-auto px-5 pt-4 pb-20">
        <p className="text-[13px] text-[#707980] mb-4">나의 에센스</p>

        <h1 className="text-[24px] md:text-[28px] leading-[1.6] mb-8" style={{ fontFamily: "var(--font-serif), serif" }}>
          &ldquo;안전한 구석에서
          <br />
          전체를 보는 사람&rdquo;
        </h1>

        <div className="flex gap-2 mb-10">
          {["#5C4A3A", "#8B7355", "#A69070", "#C4B59A", "#D4C5A9"].map((color) => (
            <div key={color} className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </div>

        <div className="border-t border-[#040000]/8 mb-8" />

        <p className="text-[13px] text-[#707980] mb-5">이번 달 흐름</p>

        <div className="mb-3">
          <p className="text-[12px] text-[#707980]/50 mb-2">주제</p>
          <div className="flex gap-3">
            {[
              { label: "공간", pct: 45, color: "#7A9CB1" },
              { label: "일", pct: 30, color: "#45525A" },
              { label: "사람", pct: 15, color: "#CFE2CF" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-[5px] rounded-full" style={{ width: `${item.pct * 1.2}px`, backgroundColor: item.color, opacity: 0.4 }} />
                <span className="text-[11px] text-[#707980]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[12px] text-[#707980]/50 mb-2">스타일</p>
          <div className="flex gap-3">
            {[
              { label: "고요한", pct: 40 },
              { label: "따뜻한", pct: 35 },
              { label: "묵직한", pct: 20 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-[5px] rounded-full bg-[#040000]/10" style={{ width: `${item.pct * 1.2}px` }} />
                <span className="text-[11px] text-[#707980]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[13px] text-[#707980] leading-[1.7] mb-8">
          지난달엔 &lsquo;여행&rsquo;이 많았는데,
          <br />
          이번 달은 &lsquo;공간&rsquo;과 &lsquo;일&rsquo; 쪽으로 가고 있어요.
        </p>

        <div className="border-t border-[#040000]/8 mb-8" />

        <p className="text-[13px] text-[#707980] mb-4">축적된 발견 (3)</p>

        <div className="flex flex-col gap-3 mb-8">
          {[
            "구석을 고르는 건 숨는 게 아니라 전체를 보고 싶은 거",
            "끝내는 게 무서운 게 아니라 평가받는 게 무서운 거",
            "혼자 채우고 나서야 꺼낸다",
          ].map((text, i) => (
            <p key={i} className="text-[14px] leading-[1.7] border-b border-[#040000]/6 pb-3" style={{ fontFamily: "var(--font-serif), serif" }}>
              &ldquo;{text}&rdquo;
            </p>
          ))}
        </div>

        <div className="border-t border-[#040000]/8 mb-8" />

        <div className="mb-4">
          <p className="text-[12px] text-[#707980]/50 mb-3">상위 주제</p>
          <div className="flex gap-2">
            {["공간", "일", "사람", "여행"].map((tag) => (
              <Tag key={tag} label={tag} type="topic" />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[12px] text-[#707980]/50 mb-3">상위 스타일</p>
          <div className="flex gap-2">
            {["고요한", "따뜻한", "묵직한"].map((tag) => (
              <Tag key={tag} label={tag} type="style" />
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
