const puppeteer = require('puppeteer');
const { format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');
const { generateNumber } = require('../../db/invoice');
const { uploadFile } = require('../../google/drive');
const { invoiceTemplate } = require('./invoice.html');
const { quoteTemplate } = require('./quote.html');

function getIssuer() {
  return {
    company: process.env.ISSUER_COMPANY_NAME || '株式会社○○',
    postal: process.env.ISSUER_POSTAL || '〒000-0000',
    address: process.env.ISSUER_ADDRESS || '東京都○○区',
    tel: process.env.ISSUER_TEL || '03-0000-0000',
    email: process.env.ISSUER_EMAIL || 'info@example.com',
    bank: process.env.ISSUER_BANK || '○○銀行 ○○支店'
  };
}

async function createInvoicePdf(input) {
  const { document_type, client, items, due_date, notes, tax_rate = 0.1 } = input;

  const documentNumber = generateNumber(document_type);
  const now = toZonedTime(new Date(), 'Asia/Tokyo');
  const issueDate = format(now, 'yyyy年MM月dd日');

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const tax = Math.floor(subtotal * tax_rate);
  const total = subtotal + tax;

  const issuer = getIssuer();

  let html;
  if (document_type === 'invoice') {
    html = invoiceTemplate({
      documentNumber,
      issueDate,
      client,
      items,
      subtotal,
      tax,
      total,
      dueDate: due_date,
      notes,
      issuer
    });
  } else {
    // Calculate valid until (30 days from now by default)
    const validDate = new Date(now);
    validDate.setDate(validDate.getDate() + 30);
    const validUntil = format(validDate, 'yyyy年MM月dd日');

    html = quoteTemplate({
      documentNumber,
      issueDate,
      client,
      items,
      subtotal,
      tax,
      total,
      validUntil,
      notes,
      issuer
    });
  }

  // Generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    // Upload to Drive
    const folderName = document_type === 'invoice' ? '請求書' : '見積書';
    const fileName = `${documentNumber}.pdf`;

    const uploaded = await uploadFile(
      fileName,
      pdfBuffer,
      'application/pdf',
      folderName
    );

    return {
      document_number: documentNumber,
      client: client.company,
      subtotal,
      tax,
      total,
      file_name: fileName,
      drive_link: uploaded.link,
      drive_file_id: uploaded.id
    };
  } finally {
    await browser.close();
  }
}

module.exports = { createInvoicePdf };
