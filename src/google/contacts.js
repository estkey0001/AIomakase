const { google } = require('googleapis');
const { getAuth } = require('./auth');

async function searchContacts(query) {
  const people = google.people({ version: 'v1', auth: getAuth() });

  const res = await people.people.searchContacts({
    query,
    readMask: 'names,emailAddresses,phoneNumbers,organizations',
    pageSize: 10
  });

  if (!res.data.results || res.data.results.length === 0) {
    return [];
  }

  return res.data.results.map(r => {
    const person = r.person;
    const name = person.names?.[0]?.displayName || '(名前なし)';
    const emails = (person.emailAddresses || []).map(e => e.value);
    const phones = (person.phoneNumbers || []).map(p => p.value);
    const org = person.organizations?.[0]?.name || '';

    return { name, emails, phones, organization: org };
  });
}

module.exports = { searchContacts };
