const { google } = require('googleapis');
const { getAuth } = require('./auth');
const { findOrCreateFolder } = require('./drive');

function getDocs() {
  return google.docs({ version: 'v1', auth: getAuth() });
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

async function createDocument(title, content, folderName) {
  const docs = getDocs();
  const drive = getDrive();

  // Create the document
  const doc = await docs.documents.create({
    requestBody: { title }
  });

  const docId = doc.data.documentId;

  // Insert content
  if (content) {
    const requests = buildInsertRequests(content);
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests }
      });
    }
  }

  // Move to folder if specified
  if (folderName) {
    const folderId = await findOrCreateFolder(folderName);
    await drive.files.update({
      fileId: docId,
      addParents: folderId,
      fields: 'id, parents'
    });
  }

  return {
    id: docId,
    title,
    link: `https://docs.google.com/document/d/${docId}/edit`
  };
}

function buildInsertRequests(content) {
  // Simple markdown-like conversion
  const requests = [];
  const lines = content.split('\n');
  let index = 1;

  for (const line of lines) {
    let text = line;
    let style = null;

    if (line.startsWith('### ')) {
      text = line.substring(4);
      style = 'HEADING_3';
    } else if (line.startsWith('## ')) {
      text = line.substring(3);
      style = 'HEADING_2';
    } else if (line.startsWith('# ')) {
      text = line.substring(2);
      style = 'HEADING_1';
    }

    const insertText = text + '\n';
    requests.push({
      insertText: {
        location: { index },
        text: insertText
      }
    });

    if (style) {
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: index,
            endIndex: index + insertText.length
          },
          paragraphStyle: { namedStyleType: style },
          fields: 'namedStyleType'
        }
      });
    }

    index += insertText.length;
  }

  return requests;
}

module.exports = { createDocument };
