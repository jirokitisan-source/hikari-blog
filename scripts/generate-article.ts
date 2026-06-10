import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

type KeywordEntry = { keyword: string; slug: string };

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const KEYWORDS_FILE = path.join(process.cwd(), "scripts/keywords.json");

function getUnwrittenKeyword(): KeywordEntry | null {
  const keywords: KeywordEntry[] = JSON.parse(fs.readFileSync(KEYWORDS_FILE, "utf-8"));
  const existingSlugs = new Set(
    fs.existsSync(POSTS_DIR)
      ? fs.readdirSync(POSTS_DIR).map((f) => f.replace(/\.mdx$/, ""))
      : []
  );
  return keywords.find((k) => !existingSlugs.has(k.slug)) ?? null;
}

function buildPrompt(keyword: string): string {
  return `あなたはインターネット回線の専門家ブロガーです。
以下のキーワードで検索するユーザーに最も役立つ、SEOに強い日本語ブログ記事を書いてください。

キーワード: ${keyword}

## 出力形式
frontmatter（---で囲む）+ 本文（Markdown）のみを出力してください。
他の説明文は一切不要です。

## frontmatter の形式
---
title: "記事タイトル（キーワードを含む、40文字以内）"
description: "記事の要約（120文字以内、meta descriptionに使用）"
date: "${new Date().toISOString().split("T")[0]}"
tags: ["光回線", "インターネット回線"]
---

## 記事の構成（以下を必ず含める）
1. リード文（200文字程度）：読者の悩みに共感し、記事で解決できることを示す
2. ## 結論：最初に結論を書く（読者が最後まで読まなくても分かるように）
3. ## 詳細解説：各ポイントを ### で細分化して丁寧に説明
4. ## 比較表：料金・速度・特徴をMarkdownテーブルで整理
5. ## よくある質問（FAQ）：3〜5個
6. ## まとめ：結論を再度まとめ、次のアクションを促す

## 注意事項
- 1記事あたり2000〜3000文字
- 具体的な数字・料金を入れる（2026年時点の相場観で）
- 読者が行動できる具体的なアドバイスを入れる
- アフィリエイトリンクのプレースホルダーとして [PR] タグを適切な箇所に入れる`;
}

async function generateArticle() {
  const entry = getUnwrittenKeyword();
  if (!entry) {
    console.log("全キーワードの記事が生成済みです。");
    process.exit(0);
  }

  console.log(`生成中: "${entry.keyword}" → ${entry.slug}.mdx`);

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: buildPrompt(entry.keyword) }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  fs.mkdirSync(POSTS_DIR, { recursive: true });
  const outputPath = path.join(POSTS_DIR, `${entry.slug}.mdx`);
  fs.writeFileSync(outputPath, content.text, "utf-8");

  console.log(`完了: ${outputPath}`);
}

generateArticle().catch((err) => {
  console.error(err);
  process.exit(1);
});
