/**
 * Google OAuth2 Refresh Token 取得スクリプト
 *
 * 使い方:
 * 1. .envにGOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URIを設定
 * 2. node scripts/get-refresh-token.js を実行
 * 3. 表示されるURLをブラウザで開いて認証
 * 4. リダイレクト後のURLからcodeパラメータを取得
 * 5. コンソールに表示されるrefresh_tokenを.envにコピー
 */

require('dotenv').config();

const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents'
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('以下のURLをブラウザで開いてください:');
console.log('');
console.log(authUrl);
console.log('');

// Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/oauth/callback' && parsedUrl.query.code) {
    const code = parsedUrl.query.code;

    try {
      const { tokens } = await oauth2Client.getToken(code);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>認証成功！</h1><p>ターミナルを確認してください。このページは閉じて大丈夫です。</p>');

      console.log('=== 認証成功 ===');
      console.log('');
      console.log('以下のrefresh_tokenを.envファイルにコピーしてください:');
      console.log('');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('');

      server.close();
      process.exit(0);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: ' + error.message);
      console.error('トークン取得エラー:', error.message);
    }
  }
});

const port = new URL(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback').port || 3000;
server.listen(port, () => {
  console.log(`コールバックサーバーがポート${port}で起動しました`);
});
