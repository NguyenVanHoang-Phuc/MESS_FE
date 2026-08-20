import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trang chủ | My App",
  description: "Nền tảng quản trị hiện đại, nhanh chóng và dễ sử dụng.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center max-w-2xl">
        <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-4 uppercase tracking-wide">
          Next.js · TypeScript · Tailwind
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Chào mừng đến với{" "}
          <span className="text-blue-600">MES</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Nền tảng nhắn tin hiện đại, được xây dựng với Next.js App Router, TypeScript
          và Tailwind CSS — sẵn sàng để mở rộng.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          <Link
            id="home-cta-login"
            href="/login"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}

