const Anthropic = require('@anthropic-ai/sdk');
const snsDb = require('../db/sns');

const anthropic = new Anthropic();

const PLATFORM_PROMPTS = {
  twitter: (topic, tone) => `以下のテーマでツイートを作成してください。
・日本語140文字以内（必須）
・${tone}なトーン
・ハッシュタグ2〜3個
・改行を効果的に使う
テーマ: ${topic}

投稿文のみ出力してください。`,

  facebook: (topic, tone) => `以下のテーマでFacebook投稿文を作成してください。
・500文字程度
・${tone}なトーン
・ビジネスページ向け
・ハッシュタグ3〜5個を文末に
テーマ: ${topic}

投稿文のみ出力してください。`,

  instagram: (topic, tone) => `以下のテーマでInstagramキャプションを作成してください。
・300文字程度
・${tone}なトーン
・改行多めで読みやすく
・絵文字を適度に使う
・ハッシュタグ10〜15個を文末にまとめる
テーマ: ${topic}

キャプションのみ出力してください。`
};

const TONE_MAP = {
  professional: 'プロフェッショナル',
  casual: 'カジュアル',
  inspiring: 'インスピレーション',
  informative: '情報提供'
};

async function generatePostContent(platform, topic, tone) {
  const toneJa = TONE_MAP[tone] || 'プロフェッショナル';
  const prompt = PLATFORM_PROMPTS[platform](topic, toneJa);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');
}

function extractHashtags(text) {
  const matches = text.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g);
  return matches || [];
}

async function createPost(lineUserId, input) {
  const { platforms, topic, tone = 'professional', scheduled_at } = input;

  const results = [];

  for (const platform of platforms) {
    const content = await generatePostContent(platform, topic, tone);
    const hashtags = extractHashtags(content);

    const draftId = snsDb.createDraft(
      lineUserId,
      platform,
      content,
      hashtags,
      scheduled_at
    );

    results.push({
      draft_id: draftId,
      platform,
      content,
      hashtags,
      status: scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: scheduled_at || null
    });
  }

  return { drafts: results };
}

module.exports = { createPost, generatePostContent };
