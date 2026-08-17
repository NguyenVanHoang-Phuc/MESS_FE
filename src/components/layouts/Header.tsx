"use client";

import { usePathname } from "next/navigation";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/dashboard/users": "Người dùng",
  "/dashboard/reports": "Báo cáo",
  "/dashboard/settings": "Cài đặt",
};

export function Header() {
  const pathname = usePathname();
  const pageTitle = breadcrumbMap[pathname] ?? "Trang";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumb / page title */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{pageTitle}</h2>
        <p className="text-xs text-gray-400">Dashboard / {pageTitle}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          id="header-notifications"
          aria-label="Thông báo"
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div
          id="header-avatar"
          className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
        >
          U
        </div>
      </div>
    </header>
  );
}
