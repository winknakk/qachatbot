import { google } from 'googleapis';
import path from 'path';

const KEY_FILE = './credentials/google-service-account.json';
const SHEET_ID = '1RaRKgxmyaVZlEOJIjgA8Keg8UITDdAVSvBvHIEdHlYo';

async function find() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  console.log('Fetching sheet metadata...');
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tabs = meta.data.sheets.map(s => s.properties.title);
  
  const searchQ = 'เหรียญกษาปณ์ที่ชำรุดแบบใดที่กฎหมายระบุไว้ชัดเจนในข้อ 2 (1)';

  for (const tab of tabs) {
    console.log(`Searching tab "${tab}"...`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A1:H300`,
    });
    const rows = res.data.values || [];
    rows.forEach((row, i) => {
      const q = row[1] || '';
      if (q.includes(searchQ)) {
        console.log(`  MATCH FOUND! Tab: "${tab}", Row: ${i + 1}`);
        console.log(`  Row contents: ${JSON.stringify(row)}`);
      }
    });
  }
}

find().catch(console.error);
