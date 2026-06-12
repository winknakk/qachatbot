import { google } from 'googleapis';
import 'dotenv/config';

const KEY_FILE = './credentials/google-service-account.json';
const SHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1RaRKgxmyaVZlEOJIjgA8Keg8UITDdAVSvBvHIEdHlYo';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  console.log('Fetching In_coin all rows (columns A to G)...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'In_coin!A2:G1000',
  });
  const rows = res.data.values || [];
  console.log(`Total rows fetched: ${rows.length}`);

  let rowsWithData = [];
  rows.forEach((row, i) => {
    const rowNum = i + 2;
    const actual = row[3] || '';
    const status = row[4] || '';
    const timestamp = row[5] || '';
    const screenshot = row[6] || '';

    if (actual || status || timestamp || screenshot) {
      rowsWithData.push({
        rowNum,
        testId: row[0] || '',
        question: (row[1] || '').substring(0, 40) + '...',
        actual: actual.substring(0, 30) + '...',
        status,
        timestamp,
        screenshot
      });
    }
  });

  console.log(`Total rows with data in D-G: ${rowsWithData.length}`);
  if (rowsWithData.length > 0) {
    console.log(`First 5 rows with data:`);
    console.log(JSON.stringify(rowsWithData.slice(0, 5), null, 2));
    console.log(`Last 5 rows with data:`);
    console.log(JSON.stringify(rowsWithData.slice(-5), null, 2));
  }
}

main().catch(console.error);
