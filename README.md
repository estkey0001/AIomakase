# AI秘書 LINE Bot

LINEでユーザーが自然言語で指示を出すと、AI秘書が業務・情報収集・SNS管理・書類作成を全て実行するパーソナルアシスタントサービスです。

## 機能一覧

- **スケジュール管理** - Googleカレンダーとの連携（予定の確認・追加・削除）
- **メール管理** - Gmailでの送信・受信確認
- **連絡先検索** - Google Contactsからの検索
- **Google Drive管理** - ファイル検索・共有リンク取得・ドキュメント作成
- **文章処理** - 議事録整形・リライト・翻訳（日英中韓対応）
- **書類作成** - 請求書・見積書のPDF生成（自動採番・Drive保存）
- **SNS管理** - X(Twitter)・Facebook・Instagramへの投稿・予約投稿
- **Web検索** - 最新情報の検索・リサーチ
- **自由会話** - 雑談・ビジネス相談

秘書の名前・呼び方・口調（クール/フレンドリー/フォーマル）はユーザーが自由に設定可能です。

## 技術スタック

- Runtime: Node.js 20+
- Framework: Express.js
- AI: Anthropic Claude API (claude-sonnet-4-20250514) with Tool Use + Web Search
- Google APIs: Calendar v3 / Gmail v1 / People v1 / Drive v3 / Docs v1
- SNS APIs: X API v2 / Facebook Graph API / Instagram Graph API
- PDF生成: Puppeteer
- DB: SQLite (better-sqlite3)
- Scheduler: node-cron（予約投稿）

## 前提条件

- Node.js 20以上
- 以下の各種アカウント・API設定が必要:
  - LINE Developers アカウント
  - Anthropic API キー
  - Google Cloud Console プロジェクト
  - X (Twitter) Developer アカウント（SNS機能使用時）
  - Meta for Developers アカウント（Facebook/Instagram使用時）

## セットアップ手順

### 1. リポジトリのクローンと依存関係インストール

```bash
git clone <repository-url>
cd ai-secretary
npm install
```

### 2. Google Cloud Console設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 以下のAPIを有効化:
   - Google Calendar API
   - Gmail API
   - People API
   - Google Drive API
   - Google Docs API
3. 「認証情報」→「OAuth 2.0 クライアント ID」を作成
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みのリダイレクト URI: `http://localhost:3000/oauth/callback`
4. クライアントID・シークレットを`.env`に設定
5. Refresh Tokenを取得:

```bash
npm run get-token
```

表示されるURLをブラウザで開き、Googleアカウントで認証してください。
取得した`refresh_token`を`.env`にコピーします。

### 3. LINE Developers設定

1. [LINE Developers](https://developers.line.biz/) にログイン
2. 新規プロバイダー → Messaging APIチャネルを作成
3. 「Messaging API設定」から以下を取得:
   - チャネルアクセストークン（長期）
   - チャネルシークレット
4. Webhook URLを設定（デプロイ後の本番URL + `/webhook`）
5. Webhookの利用を「有効」に設定
6. 応答メッセージを「無効」に設定

### 4. X (Twitter) Developer Portal設定

1. [Twitter Developer Portal](https://developer.twitter.com/) でアプリを作成
2. User Authentication Settingsを設定:
   - App permissions: Read and Write
   - Type: Web App
3. 以下のキーを取得:
   - API Key / API Key Secret
   - Access Token / Access Token Secret
   - Bearer Token

### 5. Meta for Developers設定

1. [Meta for Developers](https://developers.facebook.com/) でアプリを作成
2. Facebook Login と Instagram Graph API を追加
3. Facebookページのアクセストークンを取得（長期トークン推奨）
4. Instagramビジネスアカウントを連携:
   - Facebookページ → 設定 → Instagram → アカウントをリンク
   - Instagram Business Account IDを取得

### 6. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを開き、全てのキーを設定してください。

### 7. ローカル起動テスト

```bash
# ローカルサーバー起動
npm start

# 別ターミナルでngrokを起動（HTTPS化）
ngrok http 3000
```

ngrokで表示されるHTTPS URLをLINE DevelopersのWebhook URLに設定します。
例: `https://xxxx.ngrok.io/webhook`

### 8. Render/Railwayへのデプロイ

#### Renderの場合

1. [Render](https://render.com/) でNew Web Serviceを作成
2. GitHubリポジトリを接続
3. 設定:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Environment Variables に`.env`の全変数を設定
5. デプロイ後、Service URLを確認

#### Railwayの場合

1. [Railway](https://railway.app/) でNew Projectを作成
2. GitHubリポジトリをデプロイ
3. Variables タブで`.env`の全変数を設定
4. デプロイ後のドメインを確認

### 9. LINE Webhook URLの更新

デプロイ後の本番URLを使って、LINE DevelopersのWebhook URLを更新します。

例: `https://your-app.onrender.com/webhook`

「検証」ボタンを押して、200 OKが返ることを確認してください。

## プロジェクト構成

```
ai-secretary/
├── src/
│   ├── index.js                    # エントリーポイント
│   ├── line/
│   │   ├── webhook.js              # LINE webhook処理・初回セットアップ
│   │   └── client.js               # LINE Messaging API送信
│   ├── claude/
│   │   ├── agent.js                # Claude Tool Useエージェント
│   │   ├── tools.js                # 全ツール定義
│   │   ├── tool-executor.js        # ツール実行ハンドラー
│   │   └── system-prompt.js        # ユーザー設定から動的生成
│   ├── google/
│   │   ├── auth.js                 # OAuth2認証
│   │   ├── calendar.js             # カレンダーAPI
│   │   ├── gmail.js                # Gmail API
│   │   ├── contacts.js             # People API
│   │   ├── drive.js                # Drive API
│   │   └── docs.js                 # Docs API
│   ├── sns/
│   │   ├── twitter.js              # X (Twitter) API v2
│   │   ├── facebook.js             # Facebook Graph API
│   │   ├── instagram.js            # Instagram Graph API
│   │   ├── composer.js             # SNS投稿文生成エンジン
│   │   └── scheduler.js            # 予約投稿スケジューラー
│   ├── document/
│   │   ├── processor.js            # 議事録・リライト・翻訳
│   │   └── pdf/
│   │       ├── generator.js        # PDF生成エンジン
│   │       ├── invoice.html.js     # 請求書HTMLテンプレート
│   │       └── quote.html.js       # 見積書HTMLテンプレート
│   └── db/
│       ├── history.js              # 会話履歴
│       ├── users.js                # ユーザー設定管理
│       ├── invoice.js              # 書類番号管理
│       └── sns.js                  # SNS投稿管理
├── scripts/
│   └── get-refresh-token.js        # Google OAuth初回認証
├── .env.example
├── package.json
└── README.md
```

## 使い方

LINEで友達追加後、初回メッセージで秘書の設定（名前・呼び方・キャラクター）を行います。

設定完了後は自然言語で指示するだけです:

- 「今日の予定は？」
- 「佐藤さんにお礼メール送って」
- 「さっきの会議メモ整形して」
- 「TOYOTAに請求書作って。Web制作費50万」
- 「Xに新サービスの告知投稿して」
- 「SaaS業界のトレンド調べて」
- 「設定変更」 → 秘書の設定を変更

## ライセンス

MIT
