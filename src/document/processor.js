const Anthropic = require('@anthropic-ai/sdk');
const docs = require('../google/docs');

const anthropic = new Anthropic();

const PROMPTS = {
  minutes: `以下の会議メモを議事録として整形してください。

形式:
- 日時
- 参加者
- 議題
- 決定事項
- アクションアイテム（担当者・期限付き）
- 次回予定

会議メモ:
`,
  rewrite: (style) => `以下の文章を${style || 'formal'}なトーンでリライトしてください。
元の意図を変えず、自然な日本語で。

文章:
`,
  translate: (lang) => `以下を${lang || 'en'}に翻訳してください。
ビジネス文書として自然な表現で。

文章:
`
};

async function processDocument(type, text, options = {}) {
  let prompt;

  switch (type) {
    case 'minutes':
      prompt = PROMPTS.minutes + text;
      break;
    case 'rewrite':
      prompt = PROMPTS.rewrite(options.style) + text;
      break;
    case 'translate':
      prompt = PROMPTS.translate(options.target_language) + text;
      break;
    default:
      return { error: '不明な処理タイプです' };
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  const result = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  const output = { type, result };

  // Save to Drive if requested
  if (options.save_to_drive) {
    const titles = {
      minutes: '議事録',
      rewrite: 'リライト文書',
      translate: '翻訳文書'
    };
    const doc = await docs.createDocument(
      `${titles[type]}_${new Date().toISOString().split('T')[0]}`,
      result,
      type === 'minutes' ? '議事録' : null
    );
    output.document = doc;
  }

  return output;
}

module.exports = { processDocument };
