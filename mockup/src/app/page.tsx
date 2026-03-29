import Link from "next/link";
import Image from "next/image";
import Tag from "@/components/Tag";

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5">
      {/* 로고 */}
      <div className="mb-10 flex items-center gap-2.5">
        <Image src="/logo-symbol.svg" alt="" width={18} height={40} />
        <Image src="/logo-wordmark.svg" alt="droppi" width={64} height={17} />
      </div>

      {/* 메인 카피 */}
      <h1 className="text-[32px] md:text-[40px] font-medium leading-[1.4] text-center mb-3" style={{ fontFamily: "var(--font-serif), serif" }}>
        뭐든 넣으면
        <br />
        당신이 보입니다.
      </h1>

      <p className="text-[14px] md:text-[15px] text-[#707980] mb-12">
        사진, 글, 링크, 메모 아무거나.
      </p>

      {/* Drop CTA */}
      <Link
        href="/result"
        className="bg-[#040000] text-white text-[14px] px-8 py-3 rounded-full hover:bg-[#45525A] transition-colors"
      >
        drop
      </Link>

      {/* 예시 카드 */}
      <div className="mt-24 w-full max-w-[640px] overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-4" style={{ minWidth: "fit-content" }}>
          {[
            { insight: "안전한 구석에서 전체를 보는 사람", topics: ["공간"], styles: ["고요한"] },
            { insight: "낡은 것에서 결을 읽는 사람", topics: ["취미"], styles: ["빈티지"] },
            { insight: "혼자 걷다가 멈추는 곳이 있는 사람", topics: ["여행"], styles: ["느린"] },
          ].map((card, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] md:w-[220px] border border-[#040000]/10 rounded-lg p-5">
              <p className="text-[14px] leading-[1.8] mb-4" style={{ fontFamily: "var(--font-serif), serif" }}>
                &ldquo;{card.insight}&rdquo;
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {card.topics.map((t) => <Tag key={t} label={t} type="topic" />)}
                {card.styles.map((t) => <Tag key={t} label={t} type="style" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
