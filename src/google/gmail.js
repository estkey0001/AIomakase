const { google } = require('googleapis');
const { getAuth } = require('./auth');

function getGmail() {
  return google.gmail({ version: 'v1', auth: getAuth() });
}

async function sendEmail(toEmail, toName, subject, body) {
  const gmail = getGmail();

  const toHeader = toName ? `${toName} <${toEmail}>` : toEmail;
  const rawMessage = [
    `To: ${toHeader}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body
  ].join('\r\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage }
  });

  return {
    id: res.data.id,
    threadId: res.data.threadId,
    message: `メールを送信しました（宛先: ${toEmail}）`
  };
}

async function getEmails(query, maxResults = 5) {
  const gmail = getGmail();

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query || '',
    maxResults
  });

  if (!listRes.data.messages || listRes.data.messages.length === 0) {
    return [];
  }

  const emails = await Promise.all(
    listRes.data.messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date']
      });

      const headers = detail.data.payload.headers;
      const getHeader = (name) => {
        const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : '';
      };

      return {
        id: detail.data.id,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: detail.data.snippet
      };
    })
  );

  return emails;
}

module.exports = { sendEmail, getEmails };
