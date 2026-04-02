const { messagingApi } = require('@line/bot-sdk');

let client = null;

function getLineClient() {
  if (client) return client;
  client = new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
  });
  return client;
}

async function replyText(replyToken, text) {
  const lineClient = getLineClient();
  // LINE has a 5000 character limit per message
  const messages = splitMessage(text).map(t => ({ type: 'text', text: t }));
  await lineClient.replyMessage({ replyToken, messages: messages.slice(0, 5) });
}

async function pushText(userId, text) {
  const lineClient = getLineClient();
  const messages = splitMessage(text).map(t => ({ type: 'text', text: t }));
  await lineClient.pushMessage({ to: userId, messages: messages.slice(0, 5) });
}

function splitMessage(text, maxLength = 5000) {
  if (text.length <= maxLength) return [text];

  const parts = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining);
      break;
    }
    // Try to split at newline
    let splitAt = remaining.lastIndexOf('\n', maxLength);
    if (splitAt === -1 || splitAt < maxLength / 2) {
      splitAt = maxLength;
    }
    parts.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).replace(/^\n/, '');
  }
  return parts;
}

module.exports = { replyText, pushText, getLineClient };
