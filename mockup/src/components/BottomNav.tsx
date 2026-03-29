"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/home", label: "홈" },
  { href: "/sessions", label: "세션" },
  { href: "/profile", label: "프로필" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#EFEEE9]/90 backdrop-blur-sm border-t border-[#040000]/8 z-50">
      <div className="max-w-[960px] mx-auto flex">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex-1 py-3.5 text-center text-[12px] transition-colors ${
              pathname === tab.href
                ? "text-[#040000] font-medium"
                : "text-[#707980]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
