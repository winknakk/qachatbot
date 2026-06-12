import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const KEY_FILE = './credentials/google-service-account.json';
const SHEET_ID = '1RaRKgxmyaVZlEOJIjgA8Keg8UITDdAVSvBvHIEdHlYo';
const TAB_NAME = 'In_coin';
const JSON_FILE = './output/in_coin_docs_data.json';

function norm(text) {
  return (text ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\u0e00-\u0e7f\u0020-\u007e]/g, '')
    .toLowerCase()
    .trim();
}

function formatTestIdForSheet(testId) {
  if (!testId) return '';
  const m = testId.trim().match(/^TRD_AI_(\d+)$/i);
  if (m) {
    const num = parseInt(m[1], 10);
    return `TRD_AI_${String(num).padStart(2, '0')}`;
  }
  return testId;
}

async function main() {
  if (!fs.existsSync(JSON_FILE)) {
    console.error(`Error: JSON file not found at ${JSON_FILE}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const entries = rawData.entries || [];
  console.log(`Loaded ${entries.length} entries from JSON.`);

  // Map normalized question to JSON entry
  const jsonMap = new Map();
  entries.forEach(entry => {
    const qNorm = norm(entry.question);
    if (qNorm) {
      jsonMap.set(qNorm, entry);
    }
  });

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  console.log('Fetching existing rows from Google Sheet...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_NAME}!A1:E1050`,
  });

  const rows = res.data.values || [];
  console.log(`Fetched ${rows.length} rows from Google Sheet.`);

  const updateData = [];
  let testIdUpdates = 0;
  let expectedUpdates = 0;

  rows.forEach((row, i) => {
    if (i === 0) return; // skip header
    const rowIndex = i + 1;
    const currentTestId = (row[0] || '').trim();
    const currentQuestion = (row[1] || '').trim();
    const currentExpected = (row[2] || '').trim();

    if (!currentQuestion) return;

    const qNorm = norm(currentQuestion);
    const matchedEntry = jsonMap.get(qNorm);

    if (matchedEntry) {
      const targetTestId = formatTestIdForSheet(matchedEntry.testId);
      const targetExpected = matchedEntry.expected || '';

      let updateRow = false;
      let newTestId = currentTestId;
      let newExpected = currentExpected;

      if (!currentTestId && targetTestId) {
        newTestId = targetTestId;
        testIdUpdates++;
        updateRow = true;
      }
      if (!currentExpected && targetExpected) {
        newExpected = targetExpected;
        expectedUpdates++;
        updateRow = true;
      }

      if (updateRow) {
        updateData.push({
          range: `${TAB_NAME}!A${rowIndex}:C${rowIndex}`,
          values: [[newTestId, currentQuestion, newExpected]]
        });
      }
    }
  });

  console.log(`Summary of planned updates:`);
  console.log(`- Test case ID updates: ${testIdUpdates}`);
  console.log(`- Expected Answer updates: ${expectedUpdates}`);
  console.log(`- Total rows to update: ${updateData.length}`);

  if (updateData.length === 0) {
    console.log('No updates needed. Everything is already populated!');
    return;
  }

  console.log('Executing batch update on Google Sheet...');
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updateData,
    },
  });

  console.log('✅ Google Sheet updated successfully!');
}

main().catch(console.error);
