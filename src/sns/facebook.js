const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const BASE_URL = 'https://graph.facebook.com/v18.0';

function getPageId() {
  return process.env.FACEBOOK_PAGE_ID;
}

function getToken() {
  return process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
}

async function postToPage(message, scheduledTime) {
  const pageId = getPageId();
  const url = `${BASE_URL}/${pageId}/feed`;

  const body = {
    message,
    access_token: getToken()
  };

  if (scheduledTime) {
    body.published = false;
    body.scheduled_publish_time = Math.floor(new Date(scheduledTime).getTime() / 1000);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.id };
}

async function deletePost(postId) {
  const url = `${BASE_URL}/${postId}?access_token=${getToken()}`;
  const res = await fetch(url, { method: 'DELETE' });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { success: true };
}

async function getPagePosts(limit = 10) {
  const pageId = getPageId();
  const url = `${BASE_URL}/${pageId}/feed?fields=message,created_time,id&limit=${limit}&access_token=${getToken()}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

module.exports = { postToPage, deletePost, getPagePosts };
