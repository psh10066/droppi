import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#EFEEE9]/90 backdrop-blur-sm">
      <div className="max-w-[960px] mx-auto flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-symbol.svg" alt="" width={12} height={27} />
          <Image src="/logo-wordmark.svg" alt="droppi" width={52} height={14} />
        </Link>
      </div>
    </header>
  );
}
