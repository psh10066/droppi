import Link from "next/link";
import Header from "@/components/Header";
import Tag from "@/components/Tag";

export default function ReadingResult() {
  return (
    <>
      <Header />
      <div className="max-w-[640px] mx-auto px-5 pt-4 pb-12">
        {/* Drop한 것 미리보기 */}
        <div className="w-full aspect-[4/3] bg-[#040000]/5 rounded-lg mb-10 flex items-center justify-center">
          <span className="text-[13px] text-[#707980]">drop한 사진</span>
        </div>

        {/* 읽기 결과 */}
        <p className="text-[13px] text-[#707980] mb-5">이렇게 읽어봤어요.</p>

        <h1 className="text-[24px] md:text-[28px] leading-[1.7] mb-6" style={{ fontFamily: "var(--font-serif), serif" }}>
          &ldquo;카페 안쪽 자리를 고르는 건
          <br />
          사람들이 싫어서가 아니라
          <br />
          등 뒤가 막혀있어야
          <br />
          안심이 되는 거 아닐까&rdquo;
        </h1>

        <p className="text-[14px] text-[#707980] leading-[1.8] mb-8">
          사진 속 카페는 구석 자리였고,
          <br />
          조명이 낮고, 혼자 앉는 크기의 테이블이에요.
        </p>

        {/* 태그 */}
        <div className="flex gap-2 mb-12">
          {["공간"].map((t) => <Tag key={t} label={t} type="topic" />)}
          {["따뜻한", "고요한"].map((t) => <Tag key={t} label={t} type="style" />)}
        </div>

        <div className="border-t border-[#040000]/8 mb-8" />

        {/* 자유 입력 */}
        <div className="mb-6">
          <div className="border border-[#040000]/12 rounded-lg bg-white px-4 py-3.5">
            <input
              type="text"
              placeholder="뭔가 떠오르면 말해줘요."
              className="w-full text-[14px] bg-transparent outline-none placeholder:text-[#707980]/50"
              readOnly
            />
          </div>
        </div>

        {/* 액션 */}
        <div className="flex gap-6 justify-center mb-8">
          <button className="text-[13px] text-[#707980] underline underline-offset-4">공유</button>
          <button className="text-[13px] text-[#707980] underline underline-offset-4">저장</button>
        </div>

        <Link href="/home" className="block text-center text-[13px] text-[#707980]/50">
          그냥 넘어갈래요
        </Link>
      </div>
    </>
  );
}
