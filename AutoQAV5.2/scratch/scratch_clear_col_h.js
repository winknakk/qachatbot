import { google } from 'googleapis';
import 'dotenv/config';

const KEY_FILE = './credentials/google-service-account.json';
const SHEET_ID = '1RaRKgxmyaVZlEOJIjgA8Keg8UITDdAVSvBvHIEdHlYo';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  console.log('Clearing Column H (old screenshot path column) in "In_coin" tab...');
  
  // We clear H2:H2000
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: 'In_coin!H2:H2000',
  });

  console.log('Column H cleared successfully!');
}

main().catch(console.error);
