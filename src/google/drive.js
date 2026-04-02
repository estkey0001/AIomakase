const { google } = require('googleapis');
const { getAuth } = require('./auth');
const { Readable } = require('stream');

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

async function findOrCreateFolder(folderName) {
  const drive = getDrive();

  const res = await drive.files.list({
    q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id'
  });

  return folder.data.id;
}

async function searchFiles(query, fileType, maxResults = 5) {
  const drive = getDrive();

  let q = `name contains '${query}' and trashed = false`;

  const mimeTypes = {
    doc: 'application/vnd.google-apps.document',
    sheet: 'application/vnd.google-apps.spreadsheet',
    pdf: 'application/pdf',
    slide: 'application/vnd.google-apps.presentation'
  };

  if (fileType && fileType !== 'any' && mimeTypes[fileType]) {
    q += ` and mimeType = '${mimeTypes[fileType]}'`;
  }

  const res = await drive.files.list({
    q,
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: maxResults,
    spaces: 'drive'
  });

  return (res.data.files || []).map(f => ({
    id: f.id,
    name: f.name,
    type: f.mimeType,
    modified: f.modifiedTime,
    link: f.webViewLink
  }));
}

async function uploadFile(fileName, content, mimeType, folderName) {
  const drive = getDrive();
  let folderId = null;

  if (folderName) {
    folderId = await findOrCreateFolder(folderName);
  }

  const fileMetadata = { name: fileName };
  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType,
    body: Readable.from(Buffer.from(content))
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name, webViewLink'
  });

  return {
    id: res.data.id,
    name: res.data.name,
    link: res.data.webViewLink
  };
}

async function getFileLink(fileId, permission = 'view') {
  const drive = getDrive();

  await drive.permissions.create({
    fileId,
    resource: {
      role: permission === 'edit' ? 'writer' : 'reader',
      type: 'anyone'
    }
  });

  const res = await drive.files.get({
    fileId,
    fields: 'webViewLink'
  });

  return { link: res.data.webViewLink };
}

module.exports = { searchFiles, uploadFile, getFileLink, findOrCreateFolder };
