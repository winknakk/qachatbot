import { google } from 'googleapis';
import path from 'path';

const KEY_FILE = './credentials/google-service-account.json';
const SHEET_ID = '1RaRKgxmyaVZlEOJIjgA8Keg8UITDdAVSvBvHIEdHlYo';

async function check() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  console.log('Fetching sheet metadata...');
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tabs = meta.data.sheets.map(s => s.properties.title);
  console.log('Available tabs:', tabs);

  if (tabs.includes('coin')) {
    console.log('\nFetching "coin" tab data (rows 1 to 20)...');
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'coin!A1:E20',
    });
    console.log(JSON.stringify(res.data.values, null, 2));
  } else {
    console.log('\nTab "coin" not found!');
  }
}

check().catch(console.error);
