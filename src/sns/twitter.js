const { TwitterApi } = require('twitter-api-v2');

let client = null;

function getClient() {
  if (client) return client;
  client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET
  });
  return client;
}

async function postTweet(text) {
  const twitter = getClient();
  const result = await twitter.v2.tweet(text);
  return {
    id: result.data.id,
    text: result.data.text
  };
}

async function deleteTweet(tweetId) {
  const twitter = getClient();
  await twitter.v2.deleteTweet(tweetId);
  return { success: true };
}

async function getUserTimeline(limit = 10) {
  const twitter = getClient();
  const me = await twitter.v2.me();
  const timeline = await twitter.v2.userTimeline(me.data.id, {
    max_results: limit,
    'tweet.fields': ['created_at', 'public_metrics']
  });

  return timeline.data.data || [];
}

module.exports = { postTweet, deleteTweet, getUserTimeline };
