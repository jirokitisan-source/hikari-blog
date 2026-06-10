import { getAllPosts } from "@/lib/posts";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "記事一覧",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">記事一覧</h1>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-xs text-gray-400 mb-1">{post.date}</p>
            <h2 className="font-bold text-base mb-1">{post.title}</h2>
            <p className="text-sm text-gray-600">{post.description}</p>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-gray-400 text-center py-12">記事を準備中です</p>
        )}
      </div>
    </div>
  );
}
