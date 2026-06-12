import { google } from 'googleapis';
import 'dotenv/config';

const KEY_FILE = './credentials/google-service-account.json';
const SHEET_ID = '1RaRKgxmyaVZlEOJIjgA8Keg8UITDdAVSvBvHIEdHlYo';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  console.log('Fetching raw values of In_coin!A150:E165...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'In_coin!A150:E165',
  });
  console.log('Raw values:');
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    console.log(`Row ${i + 150}:`, rows[i]);
  }
}

main().catch(console.error);
