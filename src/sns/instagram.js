const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE_URL = 'https://graph.facebook.com/v18.0';

function getAccountId() {
  return process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
}

function getToken() {
  return process.env.INSTAGRAM_ACCESS_TOKEN;
}

async function createMediaContainer(caption, imageUrl) {
  if (!imageUrl) {
    throw new Error('Instagramへの投稿には画像URLが必要です。画像をアップロードしてURLを指定してください。');
  }

  const accountId = getAccountId();
  const url = `${BASE_URL}/${accountId}/media`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: getToken()
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { creation_id: data.id };
}

async function publishMedia(caption, imageUrl) {
  const container = await createMediaContainer(caption, imageUrl);
  const accountId = getAccountId();
  const url = `${BASE_URL}/${accountId}/media_publish`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: container.creation_id,
      access_token: getToken()
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.id };
}

async function getRecentMedia(limit = 10) {
  const accountId = getAccountId();
  const url = `${BASE_URL}/${accountId}/media?fields=id,caption,timestamp,media_url,permalink&limit=${limit}&access_token=${getToken()}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

module.exports = { createMediaContainer, publishMedia, getRecentMedia };
