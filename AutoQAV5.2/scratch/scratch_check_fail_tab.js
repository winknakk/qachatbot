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

  console.log('Fetching In_coin_Fail data...');
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'In_coin_Fail!A1:E20',
    });
    console.log(JSON.stringify(res.data.values, null, 2));
  } catch (err) {
    console.error('Error fetching In_coin_Fail:', err.message);
  }
}

check().catch(console.error);
