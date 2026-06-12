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

  console.log('Fetching all rows from In_coin...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'In_coin!A2:E2000',
  });
  const rows = res.data.values || [];
  console.log(`Total rows: ${rows.length}`);

  const testIdMap = {};
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const testId = row[0] || '';
    if (testId) {
      if (!testIdMap[testId]) {
        testIdMap[testId] = [];
      }
      testIdMap[testId].push(rowNum);
    }
  });

  const duplicates = Object.entries(testIdMap).filter(([id, rows]) => rows.length > 1);
  console.log(`Total unique Test IDs: ${Object.keys(testIdMap).length}`);
  console.log(`Test IDs with duplicates: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('Sample duplicates (first 10):');
    duplicates.slice(0, 10).forEach(([id, rows]) => {
      console.log(`- ${id}: rows ${rows.join(', ')}`);
    });
  }
}

main().catch(console.error);
