function invoiceTemplate(data) {
  const {
    documentNumber,
    issueDate,
    client,
    items,
    subtotal,
    tax,
    total,
    dueDate,
    notes,
    issuer
  } = data;

  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.name}</td>
      <td class="center">${item.quantity}</td>
      <td class="center">${item.unit || '式'}</td>
      <td class="right">¥${item.unit_price.toLocaleString()}</td>
      <td class="right">¥${(item.quantity * item.unit_price).toLocaleString()}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
    font-size: 12px;
    color: #333;
    padding: 40px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
  }
  .doc-title {
    font-size: 28px;
    font-weight: bold;
    color: #1e3a5f;
    border-bottom: 3px solid #1e3a5f;
    padding-bottom: 5px;
  }
  .doc-number {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
  }
  .issue-date {
    text-align: right;
    font-size: 13px;
  }
  .parties {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
  }
  .client, .issuer {
    width: 48%;
  }
  .client-name {
    font-size: 18px;
    font-weight: bold;
    border-bottom: 2px solid #1e3a5f;
    padding-bottom: 5px;
    margin-bottom: 10px;
  }
  .client-name::after { content: ' 御中'; font-size: 14px; }
  .issuer { text-align: right; }
  .issuer-company {
    font-size: 16px;
    font-weight: bold;
    color: #1e3a5f;
    margin-bottom: 5px;
  }
  .issuer-detail { font-size: 11px; line-height: 1.6; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  th {
    background: #1e3a5f;
    color: white;
    padding: 10px 8px;
    font-size: 12px;
    text-align: left;
  }
  td {
    padding: 10px 8px;
    border-bottom: 1px solid #ddd;
  }
  tr:nth-child(even) { background: #f8f9fa; }
  .center { text-align: center; }
  .right { text-align: right; }
  .totals {
    width: 300px;
    margin-left: auto;
    margin-bottom: 30px;
  }
  .totals table { margin-bottom: 0; }
  .totals td { padding: 8px; }
  .total-row {
    background: #1e3a5f !important;
    color: white;
    font-size: 16px;
    font-weight: bold;
  }
  .due-date {
    background: #fff3cd;
    border: 1px solid #ffc107;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
    font-size: 13px;
  }
  .bank-info {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
    font-size: 12px;
    line-height: 1.6;
  }
  .notes {
    font-size: 11px;
    color: #666;
    border-top: 1px solid #ddd;
    padding-top: 10px;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="doc-title">請求書</div>
      <div class="doc-number">${documentNumber}</div>
    </div>
    <div class="issue-date">発行日: ${issueDate}</div>
  </div>

  <div class="parties">
    <div class="client">
      <div class="client-name">${client.company}</div>
      ${client.name ? `<div>${client.name} 様</div>` : ''}
      ${client.address ? `<div>${client.address}</div>` : ''}
    </div>
    <div class="issuer">
      <div class="issuer-company">${issuer.company}</div>
      <div class="issuer-detail">
        ${issuer.postal}<br>
        ${issuer.address}<br>
        TEL: ${issuer.tel}<br>
        ${issuer.email}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:5%">No</th>
        <th style="width:40%">品目</th>
        <th style="width:10%">数量</th>
        <th style="width:10%">単位</th>
        <th style="width:15%">単価</th>
        <th style="width:20%">金額</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>小計</td>
        <td class="right">¥${subtotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td>消費税</td>
        <td class="right">¥${tax.toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td>合計</td>
        <td class="right">¥${total.toLocaleString()}</td>
      </tr>
    </table>
  </div>

  ${dueDate ? `<div class="due-date">お支払期限: ${dueDate}</div>` : ''}

  <div class="bank-info">
    <strong>お振込先</strong><br>
    ${issuer.bank}
  </div>

  ${notes ? `<div class="notes">備考: ${notes}</div>` : ''}
</body>
</html>`;
}

module.exports = { invoiceTemplate };
