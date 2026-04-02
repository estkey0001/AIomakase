const { getUser, createUser, updateUser } = require('../db/users');
const { replyText } = require('./client');
const { runAgent } = require('../claude/agent');

const SETUP_MESSAGES = {
  step1: `はじめまして。
AIパーソナル秘書サービスへようこそ。

まず秘書の設定をさせてください。

【STEP 1/3】
秘書の名前を教えてください。
好きな名前を自由に入力してください。
例：慧、アリス、ケン、Aria など`,

  step2: `【STEP 2/3】
私はあなたのことを何とお呼びすればよいでしょうか？
例：Yuuyaさん、社長、田中さん など`,

  step3: `【STEP 3/3】
秘書のキャラクターを選んでください。

1️⃣ クール
　「了解です。処理します」
　淡々と有能に動くタイプ

2️⃣ フレンドリー
　「わかった！やっておくね！」
　明るく親しみやすいタイプ

3️⃣ フォーマル
　「かしこまりました」
　丁寧で礼儀正しいタイプ

1・2・3のいずれかを送信してください`
};

const PERSONALITY_MAP = {
  '1': 'cool',
  '2': 'friendly',
  '3': 'formal'
};

const PERSONALITY_LABELS = {
  cool: 'クール',
  friendly: 'フレンドリー',
  formal: 'フォーマル'
};

async function handleWebhook(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text.trim();
  const replyToken = event.replyToken;

  let user = getUser(userId);

  // New user
  if (!user) {
    user = createUser(userId);
    updateUser(userId, { setup_step: 1 });
    await replyText(replyToken, SETUP_MESSAGES.step1);
    return;
  }

  // Settings change command
  if (text === '設定変更') {
    updateUser(userId, { setup_completed: 0, setup_step: 1 });
    await replyText(replyToken, `設定変更を開始します。\n\n${SETUP_MESSAGES.step1}`);
    return;
  }

  // Setup flow
  if (!user.setup_completed) {
    await handleSetup(userId, user, text, replyToken);
    return;
  }

  // Normal conversation - run through Claude agent
  try {
    const response = await runAgent(userId, text);
    await replyText(replyToken, response);
  } catch (error) {
    console.error('Agent error:', error);
    await replyText(replyToken, 'エラーが発生しました。もう一度お試しください。');
  }
}

async function handleSetup(userId, user, text, replyToken) {
  const step = user.setup_step || 1;

  switch (step) {
    case 1: {
      // Secretary name
      updateUser(userId, { secretary_name: text, setup_step: 2 });
      await replyText(replyToken, SETUP_MESSAGES.step2);
      break;
    }
    case 2: {
      // User name
      updateUser(userId, { user_name: text, setup_step: 3 });
      await replyText(replyToken, SETUP_MESSAGES.step3);
      break;
    }
    case 3: {
      // Personality
      const personality = PERSONALITY_MAP[text];
      if (!personality) {
        await replyText(replyToken, '1・2・3のいずれかを送信してください。');
        return;
      }

      const updatedUser = updateUser(userId, {
        personality,
        setup_completed: 1,
        setup_step: 0
      });

      const label = PERSONALITY_LABELS[personality];
      const msg = `設定完了です。

秘書名: ${updatedUser.secretary_name}
あなたの呼び方: ${updatedUser.user_name}
キャラクター: ${label}

${updatedUser.secretary_name}です。
これからよろしくお願いします。
何でも指示してください。`;

      await replyText(replyToken, msg);
      break;
    }
    default: {
      updateUser(userId, { setup_step: 1 });
      await replyText(replyToken, SETUP_MESSAGES.step1);
    }
  }
}

module.exports = { handleWebhook };
