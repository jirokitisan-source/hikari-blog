import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="bg-white rounded-lg shadow p-6 md:p-10">
      <p className="text-sm text-gray-400 mb-2">{post.date}</p>
      <h1 className="text-2xl font-bold mb-6 leading-tight">{post.title}</h1>
      <div className="prose prose-sm max-w-none">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
