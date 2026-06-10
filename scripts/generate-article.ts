import Anthropic from "@anthropic-ai/sdk";
import { marked } from "marked";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

type KeywordEntry = { keyword: string; slug: string };

const KEYWORDS_FILE = path.join(process.cwd(), "scripts/keywords.json");
const POSTED_FILE = path.join(process.cwd(), "scripts/posted-slugs.json");

const WP_URL = process.env.WP_URL!;
const WP_USER = process.env.WP_USER!;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD!;
const wpAuth = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

// カテゴリーID（WordPress側で作成済み）
const CATEGORY_MAP: Record<string, number> = {
  "provider-hikaku": 9,   // プロバイダ比較
  "norikae": 10,          // 乗り換え・手続き
  "kiso-chishiki": 11,    // 基礎知識
  "area-osusume": 12,     // エリア別おすすめ
  "faq": 13,              // よくある質問
};

function inferCategory(slug: string): number {
  if (/hikaku|osusume|vs|hyoban/.test(slug)) return 9;
  if (/norikae|hikkoshi|kaiyaku|tejun/.test(slug)) return 10;
  if (/toha|shikumi|tigai|kiso|speed|ping/.test(slug)) return 11;
  if (/tokyo|osaka|nagoya|fukuoka|hokkaido|inaka/.test(slug)) return 12;
  if (/faq|qa/.test(slug)) return 13;
  return 9; // デフォルトはプロバイダ比較
}

function getPostedSlugs(): Set<string> {
  if (!fs.existsSync(POSTED_FILE)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(POSTED_FILE, "utf-8")));
}

function savePostedSlug(slug: string) {
  const slugs = getPostedSlugs();
  slugs.add(slug);
  fs.writeFileSync(POSTED_FILE, JSON.stringify([...slugs], null, 2), "utf-8");
}

function getUnwrittenKeyword(): KeywordEntry | null {
  const keywords: KeywordEntry[] = JSON.parse(fs.readFileSync(KEYWORDS_FILE, "utf-8"));
  const posted = getPostedSlugs();
  return keywords.find((k) => !posted.has(k.slug)) ?? null;
}

function buildPrompt(keyword: string): string {
  return `あなたは「光回線の教科書」というブログの著者です。
10年以上インターネット回線を使い比べてきた経験をもとに、「初めてでも失敗しない」をコンセプトに記事を書いています。
「教科書」らしく正確でわかりやすく、でも堅苦しくない。です・ます調で、読者に語りかけるような親しみやすい文体が持ち味です。
以下のルールに従って記事を書いてください。

キーワード: ${keyword}

## 出力形式
frontmatter（---で囲む）+ 本文（Markdown）のみを出力。説明文・前置き一切不要。

## frontmatter
---
title: "記事タイトル（キーワードを自然に含む・読みたくなるタイトル・40文字以内）"
description: "記事の要約（120文字以内・具体的な数字や結論を入れる）"
date: "${new Date().toISOString().split("T")[0]}"
tags: ["光回線", "インターネット回線"]
---

## 執筆・構成ルール（最重要）

### 1. 導入文（リード文）
「読者の悩みへの共感」→「本記事でわかること」→「読むメリット」の順で構成する。
1行目を読んだだけで引き込まれるような書き出しにすること。300文字以上。

### 2. 網羅性と独自性（E-E-A-T）
- キーワードの検索意図（潜在ニーズ）を網羅した H2/H3 構成をロジカルに組み立てる
- 一般論に終始せず、**具体的な数字**・**よくある失敗例**・**実践的なステップ**を盛り込む
- 専門家として深い洞察を含める

### 3. 視認性・読みやすさ
- 1文は60文字程度を目安に簡潔に書く
- 長文の羅列を避け、箇条書き・表・引用ブロックを積極的に使う
- **太字**は本当に重要なキーワードや結論のみに絞る

### 4. 必須セクション（全て含めること）
1. リード文（上記ルール通り）
2. ## この記事の結論 ── キーワードへの明確な答えを先出し、「〇〇な人は△△」形式で3パターン以上
3. ## 各サービスの詳細解説 ── サービスごとに ### で分割、月額・実測速度・メリット3つ以上・デメリット3つ以上・向いている人/向いていない人・落とし穴
4. ## 徹底比較表 ── 月額・速度・エリア・セット割・キャッシュバック・違約金を5サービス以上でテーブル化
5. ## ケース別おすすめ ── 一人暮らし・ファミリー・ゲーマー・テレワーカー・キャリア別（ドコモ/au/SB）
6. ## 申し込み前に必ず確認する5つのこと ── 失敗事例を交えた番号付き手順
7. ## よくある質問（FAQ） ── 5個以上、各回答200文字以上
8. ## まとめ ── 要点の振り返り＋読者が次に起こすべき行動を明示して背中を押す

### 5. NGワード・禁止事項
- 「〜と言えます」「〜を考えてみましょう」「〜はいかがでしょうか」「まとめると、」の多用禁止
- 「〜のようです」「〜かもしれません」などの曖昧な断定回避表現は禁止。専門家として自信のあるトーンで書く
- 抽象的な表現禁止（「安い」→「月額2,530円〜」のように必ず数字で示す）
- 同じ言い回しの繰り返し禁止

## 文体・トーンのルール
- **です・ます調で統一**する
- ただし「〜なんですよね」「正直に言うと〜」「これ、意外と知られていないんですが」のような、やわらかい語りかけを自然に混ぜる
- 堅苦しい書き言葉（「〜においては」「〜に関しては」「〜と言えるでしょう」「〜と考えられます」）は使わない
- 「あなた」「あなたの場合」を適度に使い、読者に語りかけるテンポ感を出す
- 失敗談・体験談ベースの記述（「実はこれで損した人が多いんです」「私も最初これを見落としました」）を自然に入れる
- 見出しは「〜の方法」より「〜する前に必ず確認してください」「〜は正直おすすめしません」のような引きのある表現を使う

## その他
- **総文字数：4,000文字以上**（これを下回る記事は失格）
- アフィリエイトリンクのプレースホルダーとして [PR] を自然な箇所に配置`;
}

async function postToWordPress(title: string, htmlContent: string, excerpt: string, slug: string) {
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${wpAuth}`,
    },
    body: JSON.stringify({
      title,
      content: htmlContent,
      excerpt,
      slug,
      status: "publish",
      categories: [inferCategory(slug)],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WordPress API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { id: number; link: string };
  return data;
}

function buildFactCheckPrompt(article: string): string {
  return `以下のブログ記事をファクトチェックしてください。

チェック対象：
- 料金・月額費用の数字（2026年時点として不自然なもの）
- 速度・スペックの数値（実際の仕様と矛盾するもの）
- キャッシュバック金額（過大・過小なもの）
- サービス名・プロバイダ名の表記ミス
- 存在しないプランやサービスへの言及

必ずこのJSON形式だけを出力してください。マークダウンや説明文は絶対に含めないこと：
{"issues":[{"claim":"問題の記述","reason":"理由","suggestion":"修正案"}],"overall":"safe"}

問題がなければ：{"issues":[],"overall":"safe"}
軽微な懸念：overall を "caution" に
重大な誤情報：overall を "reject" に

記事：
${article}`;
}

async function factCheck(client: Anthropic, article: string): Promise<{ safe: boolean; notes: string[] }> {
  console.log("ファクトチェック中...");
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: buildFactCheckPrompt(article) }],
  });

  const text = (res.content[0] as { type: string; text: string }).text;

  // JSON部分を抽出
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { safe: true, notes: [] };

  let result: { overall: string; issues: { claim: string; reason: string; suggestion: string }[] };
  try {
    result = JSON.parse(match[0]);
  } catch {
    // パース失敗時は safe として続行
    console.log("ファクトチェック: JSON解析失敗、スキップします");
    return { safe: true, notes: [] };
  }

  const notes = result.issues.map((i) => `⚠ "${i.claim}" → ${i.reason}（修正案: ${i.suggestion}）`);

  if (result.overall === "reject") {
    console.log("ファクトチェック: 重大な問題あり。投稿をスキップします。");
    notes.forEach((n) => console.log(n));
    return { safe: false, notes };
  }

  if (notes.length > 0) {
    console.log("ファクトチェック: 軽微な懸念あり（投稿は続行）");
    notes.forEach((n) => console.log(n));
  } else {
    console.log("ファクトチェック: 問題なし");
  }

  return { safe: true, notes };
}

async function generateArticle() {
  const entry = getUnwrittenKeyword();
  if (!entry) {
    console.log("全キーワードの記事が投稿済みです。");
    process.exit(0);
  }

  console.log(`生成中: "${entry.keyword}"`);

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: buildPrompt(entry.keyword) }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text;
  const { data, content } = matter(raw);

  // ファクトチェック
  const { safe, notes } = await factCheck(client, content);
  if (!safe) {
    process.exit(1);
  }

  // 懸念事項があれば記事末尾に免責コメントを追加
  const finalContent = notes.length > 0
    ? content + "\n\n> ※料金・キャンペーン情報は変更される場合があります。最新情報は各公式サイトをご確認ください。"
    : content + "\n\n> ※本記事の情報は2026年時点のものです。最新の料金・キャンペーンは各公式サイトをご確認ください。";

  const htmlContent = await marked(finalContent);
  const post = await postToWordPress(data.title, htmlContent, data.description, entry.slug);

  savePostedSlug(entry.slug);
  console.log(`投稿完了: ${post.link} (ID: ${post.id})`);
}

generateArticle().catch((err) => {
  console.error(err);
  process.exit(1);
});
