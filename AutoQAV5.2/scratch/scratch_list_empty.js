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

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'In_coin!A1:H300',
  });
  
  const rows = res.data.values || [];
  console.log(`Fetched ${rows.length} rows`);
  
  let emptyCount = 0;
  rows.forEach((row, i) => {
    const rIdx = i + 1;
    const testId = row[0] || '';
    const q = row[1] || '';
    const a = row[2] || '';
    if (q && !a) {
      emptyCount++;
      console.log(`EMPTY Row ${rIdx}: ID="${testId}", Q="${q}"`);
    }
  });
  console.log(`Total empty answer rows: ${emptyCount}`);
}

check().catch(console.error);
