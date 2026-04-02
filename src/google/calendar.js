const { google } = require('googleapis');
const { getAuth } = require('./auth');

function getCalendar() {
  return google.calendar({ version: 'v3', auth: getAuth() });
}

async function getEvents(dateFrom, dateTo, maxResults = 10) {
  const calendar = getCalendar();
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: dateFrom,
    timeMax: dateTo,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
    timeZone: 'Asia/Tokyo'
  });

  return (res.data.items || []).map(event => ({
    id: event.id,
    title: event.summary || '(タイトルなし)',
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    description: event.description || '',
    attendees: (event.attendees || []).map(a => a.email)
  }));
}

async function createEvent(title, startDatetime, endDatetime, description, attendeeEmails) {
  const calendar = getCalendar();
  const event = {
    summary: title,
    start: { dateTime: startDatetime, timeZone: 'Asia/Tokyo' },
    end: { dateTime: endDatetime, timeZone: 'Asia/Tokyo' }
  };

  if (description) event.description = description;
  if (attendeeEmails && attendeeEmails.length > 0) {
    event.attendees = attendeeEmails.map(email => ({ email }));
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    sendUpdates: attendeeEmails ? 'all' : 'none'
  });

  return {
    id: res.data.id,
    title: res.data.summary,
    start: res.data.start.dateTime,
    end: res.data.end.dateTime,
    link: res.data.htmlLink
  };
}

async function deleteEvent(eventId) {
  const calendar = getCalendar();
  await calendar.events.delete({
    calendarId: 'primary',
    eventId
  });
  return { success: true, message: '予定を削除しました' };
}

module.exports = { getEvents, createEvent, deleteEvent };
