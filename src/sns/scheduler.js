const cron = require('node-cron');
const snsDb = require('../db/sns');
const twitter = require('./twitter');
const facebook = require('./facebook');
const instagram = require('./instagram');
const { pushText } = require('../line/client');

async function publishScheduledPost(post) {
  try {
    let result;

    switch (post.platform) {
      case 'twitter':
        result = await twitter.postTweet(post.content);
        break;
      case 'facebook':
        result = await facebook.postToPage(post.content);
        break;
      case 'instagram':
        // Instagram needs image URL which should be in content or metadata
        result = await instagram.publishMedia(post.content);
        break;
      default:
        throw new Error(`未対応のプラットフォーム: ${post.platform}`);
    }

    snsDb.updatePostStatus(post.id, 'posted', result.id);
    console.log(`Scheduled post ${post.id} published to ${post.platform}`);

    // Notify user via LINE
    if (post.line_user_id) {
      await pushText(
        post.line_user_id,
        `予約投稿を${post.platform}に公開しました。`
      );
    }
  } catch (error) {
    console.error(`Failed to publish post ${post.id}:`, error);
    snsDb.updatePostStatus(post.id, 'failed');

    if (post.line_user_id) {
      await pushText(
        post.line_user_id,
        `予約投稿（${post.platform}）の公開に失敗しました: ${error.message}`
      );
    }
  }
}

function startScheduler() {
  // Check every minute for scheduled posts
  cron.schedule('* * * * *', async () => {
    try {
      const posts = snsDb.getScheduledPosts();
      for (const post of posts) {
        await publishScheduledPost(post);
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });

  console.log('SNS scheduler started (checking every minute)');
}

module.exports = { startScheduler };
