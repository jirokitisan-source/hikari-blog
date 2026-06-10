import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "光回線比較ナビ",
    template: "%s | 光回線比較ナビ",
  },
  description: "光回線・プロバイダを徹底比較。あなたに最適なインターネット回線が見つかります。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-800 min-h-screen">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-600">
              光回線比較ナビ
            </a>
            <nav className="flex gap-6 text-sm">
              <a href="/blog" className="hover:text-blue-600">記事一覧</a>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t mt-16 py-8 text-center text-sm text-gray-500">
          <p>© 2026 光回線比較ナビ</p>
        </footer>
      </body>
    </html>
  );
}
