const calendar = require('../google/calendar');
const gmail = require('../google/gmail');
const contacts = require('../google/contacts');
const drive = require('../google/drive');
const docs = require('../google/docs');
const documentProcessor = require('../document/processor');
const pdfGenerator = require('../document/pdf/generator');
const snsComposer = require('../sns/composer');
const snsDb = require('../db/sns');
const twitter = require('../sns/twitter');
const facebook = require('../sns/facebook');
const instagram = require('../sns/instagram');

async function executeTool(lineUserId, toolName, input) {
  switch (toolName) {
    // Calendar
    case 'get_calendar_events':
      return calendar.getEvents(input.date_from, input.date_to, input.max_results);

    case 'create_calendar_event':
      return calendar.createEvent(
        input.title,
        input.start_datetime,
        input.end_datetime,
        input.description,
        input.attendee_emails
      );

    case 'delete_calendar_event':
      return calendar.deleteEvent(input.event_id);

    // Gmail
    case 'send_email':
      return gmail.sendEmail(input.to_email, input.to_name, input.subject, input.body);

    case 'get_emails':
      return gmail.getEmails(input.query, input.max_results);

    // Contacts
    case 'search_contacts':
      return contacts.searchContacts(input.query);

    // Drive
    case 'search_drive_files':
      return drive.searchFiles(input.query, input.file_type, input.max_results);

    case 'create_drive_document':
      return docs.createDocument(input.title, input.content, input.folder_name);

    case 'get_drive_file_link':
      return drive.getFileLink(input.file_id, input.permission);

    // Document processing
    case 'process_document':
      return documentProcessor.processDocument(input.type, input.text, input.options);

    // PDF
    case 'create_invoice_pdf':
      return pdfGenerator.createInvoicePdf(input);

    // SNS
    case 'create_sns_post':
      return snsComposer.createPost(lineUserId, input);

    case 'publish_sns_post':
      return publishSnsPost(lineUserId, input);

    case 'get_sns_drafts':
      return snsDb.getDrafts(lineUserId, input.status, input.platform);

    case 'delete_sns_post':
      snsDb.deletePost(input.post_id);
      return { success: true, message: '投稿を削除しました' };

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function publishSnsPost(lineUserId, input) {
  const post = snsDb.getPost(input.draft_id);
  if (!post) return { error: '投稿が見つかりません' };

  const platforms = input.platforms || [post.platform];
  const results = [];

  for (const platform of platforms) {
    try {
      let result;
      switch (platform) {
        case 'twitter':
          result = await twitter.postTweet(post.content);
          break;
        case 'facebook':
          result = await facebook.postToPage(post.content);
          break;
        case 'instagram':
          result = await instagram.publishMedia(post.content);
          break;
        default:
          results.push({ platform, error: '未対応のプラットフォーム' });
          continue;
      }
      snsDb.updatePostStatus(input.draft_id, 'posted', result.id);
      results.push({ platform, success: true, postId: result.id });
    } catch (error) {
      snsDb.updatePostStatus(input.draft_id, 'failed');
      results.push({ platform, error: error.message });
    }
  }

  return { results };
}

module.exports = { executeTool };
