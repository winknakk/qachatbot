import { google } from 'googleapis';

const KEY_FILE = './credentials/google-service-account.json';
const SHEET_ID = '1RaRKgxmyaVZlEOJIjgA8Keg8UITDdAVSvBvHIEdHlYo';

async function check() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  console.log('Fetching header row of In_coin...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'In_coin!A1:Z1',
  });
  console.log('Header row:', res.data.values);
}

check().catch(console.error);
