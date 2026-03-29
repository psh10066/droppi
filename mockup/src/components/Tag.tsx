const topicColors: Record<string, string> = {
  공간: "bg-[#7A9CB1]/15 text-[#45525A] border-[#7A9CB1]/25",
  여행: "bg-[#C2C9A6]/20 text-[#45525A] border-[#C2C9A6]/30",
  일: "bg-[#707980]/10 text-[#45525A] border-[#707980]/20",
  사람: "bg-[#CFE2CF]/25 text-[#45525A] border-[#CFE2CF]/40",
  음식: "bg-[#C2C9A6]/15 text-[#45525A] border-[#C2C9A6]/25",
  취미: "bg-[#A5B7C5]/15 text-[#45525A] border-[#A5B7C5]/25",
  패션: "bg-[#7A9CB1]/12 text-[#45525A] border-[#7A9CB1]/20",
  자연: "bg-[#CFE2CF]/20 text-[#45525A] border-[#CFE2CF]/35",
};

const styleColors: Record<string, string> = {
  고요한: "bg-[#A5B7C5]/12 text-[#707980] border-[#A5B7C5]/20",
  따뜻한: "bg-[#C2C9A6]/12 text-[#707980] border-[#C2C9A6]/20",
  묵직한: "bg-[#45525A]/8 text-[#707980] border-[#45525A]/15",
  빈티지: "bg-[#C2C9A6]/10 text-[#707980] border-[#C2C9A6]/18",
  미니멀: "bg-[#A5B7C5]/8 text-[#707980] border-[#A5B7C5]/15",
  느린: "bg-[#CFE2CF]/12 text-[#707980] border-[#CFE2CF]/20",
  가벼운: "bg-[#EFEEE9] text-[#707980] border-[#707980]/15",
};

const fallback = "bg-[#040000]/5 text-[#707980] border-[#040000]/10";

export default function Tag({ label, type = "topic" }: { label: string; type?: "topic" | "style" }) {
  const colors = type === "topic" ? topicColors : styleColors;
  const cls = colors[label] || fallback;
  return (
    <span className={`inline-block text-[11px] border rounded-full px-2.5 py-0.5 ${cls} ${type === "style" ? "italic" : ""}`}>
      {label}
    </span>
  );
}
