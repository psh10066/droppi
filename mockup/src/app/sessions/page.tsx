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
  {
    type: "메모",
    date: "3.22",
    insight: "방법론을 쌓는 게 실행을 대체한다",
    observation: "프로젝트 회고 중 발견",
    topics: ["일"],
    styles: ["묵직한"],
    hasImage: false,
    color: "#45525A",
  },
  {
    type: "사진",
    date: "3.20",
    insight: "넓은 곳보다 좁은 곳에서 집중한다",
    observation: "서재 코너, 조명 하나",
    topics: ["공간"],
    styles: ["고요한", "따뜻한"],
    hasImage: true,
    color: "#7A9CB1",
  },
  {
    type: "아티클",
    date: "3.18",
    insight: "완성에 대한 저항이 반복적으로 나타남",
    observation: "창작 과정에 대한 에세이",
    topics: ["일"],
    styles: ["묵직한"],
    hasImage: false,
    color: "#45525A",
  },
];

export default function Sessions() {
  return (
    <>
      <Header />
      <div className="max-w-[960px] mx-auto px-5 pt-4 pb-20">
        <h1 className="text-[20px] font-medium mb-1">세션</h1>
        <p className="text-[13px] text-[#707980] mb-6">{sessions.length}개의 읽기</p>

        {/* 매거진 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((item, i) => (
            <Link href="/result" key={i} className="block">
              <div className="border border-[#040000]/8 rounded-lg overflow-hidden hover:border-[#040000]/15 transition-colors h-[160px]">
                <div className="flex h-full">
                  {/* 왼쪽: 사진 or 날짜 */}
                  {item.hasImage ? (
                    <div className="w-[100px] md:w-[120px] flex-shrink-0 bg-[#040000]/6 flex items-end p-3">
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
      </div>
      <BottomNav />
    </>
  );
}
