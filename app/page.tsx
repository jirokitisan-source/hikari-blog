import { getAllPosts } from "@/lib/posts";
import Link from "next/link";

export default function Home() {
  const posts = getAllPosts().slice(0, 6);

  return (
    <div>
      <section className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">光回線・プロバイダを徹底比較</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          速度・料金・キャンペーンを分かりやすく解説。あなたに最適な回線が見つかります。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">新着記事</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-gray-400 mb-1">{post.date}</p>
              <h3 className="font-bold text-base mb-2 leading-snug">{post.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
            </Link>
          ))}
        </div>
        {posts.length === 0 && (
          <p className="text-gray-400 text-center py-12">記事を準備中です</p>
        )}
        {posts.length > 0 && (
          <div className="text-center mt-8">
            <Link href="/blog" className="text-blue-600 hover:underline text-sm">
              記事一覧を見る →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
