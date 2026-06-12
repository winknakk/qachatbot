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

  console.log('Scanning "coin" tab for empty Test Case IDs or Expected Answers...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'coin!A1:E300',
  });
  const rows = res.data.values || [];
  console.log(`Total rows fetched from "coin": ${rows.length}`);

  let emptyTestIdCount = 0;
  let emptyExpectedCount = 0;

  rows.forEach((row, i) => {
    if (i === 0) return; // skip header
    const rIdx = i + 1;
    const testId = (row[0] || '').trim();
    const description = (row[1] || '').trim();
    const question = (row[2] || '').trim();
    const expected = (row[3] || '').trim();

    if (question) {
      if (!testId) {
        emptyTestIdCount++;
        console.log(`Row ${rIdx}: Missing Test case ID (Q: "${question.substring(0, 40)}...")`);
      }
      if (!expected) {
        emptyExpectedCount++;
        console.log(`Row ${rIdx}: Missing Expected Answer (Q: "${question.substring(0, 40)}...")`);
      }
    }
  });

  console.log(`Summary for "coin" tab:`);
  console.log(`- Missing Test case IDs: ${emptyTestIdCount}`);
  console.log(`- Missing Expected Answers: ${emptyExpectedCount}`);
}

check().catch(console.error);
