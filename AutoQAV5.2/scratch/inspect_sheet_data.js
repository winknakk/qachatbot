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

  console.log('Fetching In_coin rows 2 to 20 (columns A to G)...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'In_coin!A2:G20',
  });
  const rows = res.data.values || [];
  rows.forEach((row, i) => {
    console.log(`Row ${i + 2}:`, JSON.stringify(row));
  });
}

main().catch(console.error);
