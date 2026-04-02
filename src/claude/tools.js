const calendarTools = [
  {
    name: 'get_calendar_events',
    description: 'Googleカレンダーから指定期間の予定を取得する',
    input_schema: {
      type: 'object',
      properties: {
        date_from: {
          type: 'string',
          description: '開始日時 ISO8601形式 例: 2026-01-15T00:00:00+09:00'
        },
        date_to: {
          type: 'string',
          description: '終了日時 ISO8601形式'
        },
        max_results: {
          type: 'number',
          description: '最大取得件数 デフォルト10'
        }
      },
      required: ['date_from', 'date_to']
    }
  },
  {
    name: 'create_calendar_event',
    description: 'Googleカレンダーに予定を追加する',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        start_datetime: { type: 'string', description: 'ISO8601' },
        end_datetime: { type: 'string', description: 'ISO8601' },
        description: { type: 'string' },
        attendee_emails: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['title', 'start_datetime', 'end_datetime']
    }
  },
  {
    name: 'delete_calendar_event',
    description: 'Googleカレンダーから予定を削除する',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'カレンダーイベントID' }
      },
      required: ['event_id']
    }
  }
];

const gmailTools = [
  {
    name: 'send_email',
    description: 'Gmailでメールを送信する',
    input_schema: {
      type: 'object',
      properties: {
        to_email: { type: 'string' },
        to_name: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['to_email', 'subject', 'body']
    }
  },
  {
    name: 'get_emails',
    description: 'Gmailから最近のメールを取得する',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Gmailの検索クエリ 例: from:sato@toyota.co.jp'
        },
        max_results: { type: 'number', description: 'デフォルト5' }
      }
    }
  }
];

const contactsTools = [
  {
    name: 'search_contacts',
    description: 'Google連絡先から人物を検索する',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '検索キーワード（名前・会社名など）'
        }
      },
      required: ['query']
    }
  }
];

const driveTools = [
  {
    name: 'search_drive_files',
    description: 'Google Driveからファイルを検索する',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        file_type: {
          type: 'string',
          enum: ['doc', 'sheet', 'pdf', 'slide', 'any']
        },
        max_results: { type: 'number', description: 'デフォルト5' }
      },
      required: ['query']
    }
  },
  {
    name: 'create_drive_document',
    description: 'Google Docsにドキュメントを作成して保存する',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string', description: '本文（Markdown対応）' },
        folder_name: {
          type: 'string',
          description: '保存フォルダ名 例: 議事録, 提案書'
        }
      },
      required: ['title', 'content']
    }
  },
  {
    name: 'get_drive_file_link',
    description: 'Driveファイルの共有リンクを取得する',
    input_schema: {
      type: 'object',
      properties: {
        file_id: { type: 'string' },
        permission: {
          type: 'string',
          enum: ['view', 'edit'],
          description: 'デフォルトview'
        }
      },
      required: ['file_id']
    }
  }
];

const documentTools = [
  {
    name: 'process_document',
    description: '文章の議事録整形・リライト・翻訳を行う',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['minutes', 'rewrite', 'translate'],
          description: 'minutes=議事録 rewrite=リライト translate=翻訳'
        },
        text: { type: 'string' },
        options: {
          type: 'object',
          properties: {
            style: {
              type: 'string',
              description: 'rewrite用: formal/casual/concise/polite'
            },
            target_language: {
              type: 'string',
              description: 'translate用: en/zh/ko/fr など'
            },
            save_to_drive: { type: 'boolean' }
          }
        }
      },
      required: ['type', 'text']
    }
  }
];

const pdfTools = [
  {
    name: 'create_invoice_pdf',
    description: '請求書または見積書PDFを生成してGoogle Driveに保存する',
    input_schema: {
      type: 'object',
      properties: {
        document_type: {
          type: 'string',
          enum: ['invoice', 'quote'],
          description: 'invoice=請求書 quote=見積書'
        },
        client: {
          type: 'object',
          properties: {
            company: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' }
          },
          required: ['company']
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string', description: '式/時間/個 など' },
              unit_price: { type: 'number' }
            },
            required: ['name', 'quantity', 'unit_price']
          }
        },
        due_date: {
          type: 'string',
          description: '支払期限 例: 2026-02-28（請求書のみ）'
        },
        notes: { type: 'string' },
        tax_rate: {
          type: 'number',
          description: '消費税率 デフォルト0.1（10%）'
        }
      },
      required: ['document_type', 'client', 'items']
    }
  }
];

const snsTools = [
  {
    name: 'create_sns_post',
    description: 'SNS投稿文を生成してドラフト保存する',
    input_schema: {
      type: 'object',
      properties: {
        platforms: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['twitter', 'facebook', 'instagram']
          },
          description: '投稿するSNS（複数可）'
        },
        topic: { type: 'string', description: '投稿テーマ・内容の指示' },
        tone: {
          type: 'string',
          enum: ['professional', 'casual', 'inspiring', 'informative'],
          description: 'デフォルトprofessional'
        },
        include_hashtags: { type: 'boolean', description: 'デフォルトtrue' },
        scheduled_at: {
          type: 'string',
          description: '予約日時 ISO8601 未指定なら即時'
        }
      },
      required: ['platforms', 'topic']
    }
  },
  {
    name: 'publish_sns_post',
    description: 'ドラフトをSNSに投稿する',
    input_schema: {
      type: 'object',
      properties: {
        draft_id: { type: 'number' },
        platforms: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['draft_id']
    }
  },
  {
    name: 'get_sns_drafts',
    description: 'SNS下書き・予約・投稿済み一覧を取得する',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'scheduled', 'posted']
        },
        platform: { type: 'string' }
      }
    }
  },
  {
    name: 'delete_sns_post',
    description: 'SNS投稿または予約を削除する',
    input_schema: {
      type: 'object',
      properties: {
        post_id: { type: 'number' }
      },
      required: ['post_id']
    }
  }
];

const webSearchTool = {
  type: 'web_search_20250305',
  name: 'web_search'
};

const allTools = [
  ...calendarTools,
  ...gmailTools,
  ...contactsTools,
  ...driveTools,
  ...documentTools,
  ...pdfTools,
  ...snsTools,
  webSearchTool
];

module.exports = {
  calendarTools,
  gmailTools,
  contactsTools,
  driveTools,
  documentTools,
  pdfTools,
  snsTools,
  webSearchTool,
  allTools
};
