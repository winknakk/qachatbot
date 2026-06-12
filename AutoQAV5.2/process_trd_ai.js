import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const DOCUMENT_ID = process.env.GOOGLE_DOCUMENT_ID;
const KEY_FILE = path.resolve(__dirname, './credentials/google-service-account.json');
const INPUT_FILE = path.resolve(__dirname, './logs/in_law.json');
const OUTPUT_DIR = path.resolve(__dirname, './output');
const OUTPUT_IMG_DIR = path.resolve(OUTPUT_DIR, './TRD_AI_images');

// Colors
const STATUS_BG = { red: 0.204, green: 0.659, blue: 0.325 }; // Green

function getCellWritableRange(cell) {
  const content = cell?.content ?? [];
  let startIdx = null, endIdx = null;
  for (const para of content) {
    if (!para.paragraph) continue;
    for (const elem of para.paragraph.elements ?? []) {
      const s = elem.startIndex;
      const e = elem.endIndex;
      if (s != null) {
        if (startIdx == null) startIdx = s;
        endIdx = e;
      }
    }
  }
  if (endIdx != null) endIdx = endIdx - 1;
  return { startIdx, endIdx };
}

function cellTextRequests(cell, text) {
  const { startIdx, endIdx } = getCellWritableRange(cell);
  if (startIdx == null) return [];

  const reqs = [];
  if (endIdx != null && endIdx > startIdx) {
    reqs.push({ deleteContentRange: { range: { startIndex: startIdx, endIndex: endIdx } } });
  }
  if (text) {
    reqs.push({ insertText: { location: { index: startIdx }, text: String(text) } });
  }
  return reqs;
}

function cellColorRequest(tableStartIndex, rowIdx, colIdx) {
  return {
    updateTableCellStyle: {
      tableRange: {
        tableCellLocation: {
          tableStartLocation: { index: tableStartIndex },
          rowIndex: rowIdx,
          columnIndex: colIdx,
        },
        rowSpan: 1,
        columnSpan: 1,
      },
      tableCellStyle: { backgroundColor: { color: { rgbColor: STATUS_BG } } },
      fields: 'backgroundColor',
    },
  };
}

async function main() {
  console.log('=== Starting In-Place TRD_AI Processing ===');

  if (!DOCUMENT_ID) {
    console.error('Error: GOOGLE_DOCUMENT_ID is not set in .env');
    process.exit(1);
  }

  // 1. Read input JSON
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file ${INPUT_FILE} does not exist.`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const allEntries = Array.isArray(rawData) ? rawData : (rawData.entries ? Object.values(rawData.entries) : []);
  
  // Filter only PASS and limit to 90
  let passEntries = allEntries.filter(e => e.Status === 'PASS');
  console.log(`Total test cases in log: ${allEntries.length}`);
  console.log(`PASS test cases: ${passEntries.length}`);

  if (passEntries.length > 90) {
    console.log(`Limiting to first 90 PASS test cases.`);
    passEntries = passEntries.slice(0, 90);
  }

  if (passEntries.length === 0) {
    console.log('No PASS test cases to process.');
    return;
  }

  // Rename and copy screenshots locally
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (fs.existsSync(OUTPUT_IMG_DIR)) {
    fs.rmSync(OUTPUT_IMG_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_IMG_DIR, { recursive: true });

  console.log('Renaming and copying screenshots locally...');
  let copiedCount = 0;
  const mappedEntries = passEntries.map((entry, idx) => {
    const newId = `TRD_AI_${String(idx + 1).padStart(3, '0')}`;
    let success = false;
    let oldImgName = '';

    if (entry.Screenshot) {
      oldImgName = path.basename(entry.Screenshot);
      const srcPath = path.resolve(__dirname, './screenshots/pass-in_law', oldImgName);
      const destPath = path.resolve(OUTPUT_IMG_DIR, `${newId}.png`);

      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
        success = true;
      }
    }

    return {
      ...entry,
      newId,
      imageRenamed: success ? `${newId}.png` : null
    };
  });
  console.log(`Copied ${copiedCount} images to ${OUTPUT_IMG_DIR}`);

  const mappingPath = path.resolve(OUTPUT_DIR, 'trd_ai_pass_results.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mappedEntries, null, 2), 'utf8');

  // Authenticate with Google Docs
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/documents'],
  });
  const client = await auth.getClient();
  const docsApi = google.docs({ version: 'v1', auth: client });

  // ── STEP 1: CLEAN UP APPENDED TABLE ──
  console.log('Fetching document to check for previously appended tables...');
  let doc = await docsApi.documents.get({ documentId: DOCUMENT_ID });
  let bodyContent = doc.data.body.content;

  // Let's count how many tables are there
  const tables = [];
  bodyContent.forEach(elem => {
    if (elem.table) {
      tables.push(elem);
    }
  });

  console.log(`Found ${tables.length} tables in the document.`);

  // If there are 3 tables, the 3rd one is the one we appended. We need to delete it.
  if (tables.length >= 3) {
    console.log('Cleaning up previously appended table and heading...');
    // Table 2 is at index 1 in our array. We want to delete everything after Table 2.
    const table2 = tables[1];
    const deleteStart = table2.endIndex; // Start right after Table 2
    const deleteEnd = bodyContent[bodyContent.length - 1].endIndex - 1; // End at end of doc (minus 1 for final newline)

    if (deleteEnd > deleteStart) {
      await docsApi.documents.batchUpdate({
        documentId: DOCUMENT_ID,
        requestBody: {
          requests: [
            {
              deleteContentRange: {
                range: {
                  startIndex: deleteStart,
                  endIndex: deleteEnd,
                },
              },
            },
          ],
        },
      });
      console.log('Cleaned up appended content. Waiting for doc sync...');
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // ── STEP 2: TRUNCATE MAIN TABLE ──
  // Reload document to get updated indices
  console.log('Reloading document to format the existing table...');
  doc = await docsApi.documents.get({ documentId: DOCUMENT_ID });
  bodyContent = doc.data.body.content;

  const activeTables = [];
  bodyContent.forEach(elem => {
    if (elem.table) activeTables.push(elem);
  });

  // Main table is Table #2 (index 1) which should have 156 rows.
  // Wait, let's find the table with rows > 100
  let mainTableElem = null;
  let mainTable = null;
  for (const t of activeTables) {
    if ((t.table.tableRows ?? []).length > 100) {
      mainTableElem = t;
      mainTable = t.table;
      break;
    }
  }

  if (!mainTable) {
    console.error('Error: Could not find the main test case table (>100 rows) in the Google Doc.');
    process.exit(1);
  }

  const tableStartIndex = mainTableElem.startIndex;
  const currentRows = mainTable.tableRows.length;
  const currentCols = (mainTable.tableRows[0]?.tableCells ?? []).length;
  console.log(`Main table has ${currentRows} rows and ${currentCols} columns.`);

  const modifyRequests = [];

  // A. Delete column 7 (Remark) if it exists (i.e. if number of columns is 8)
  if (currentCols === 8) {
    console.log('Adding request to delete the 8th (Remark) column...');
    modifyRequests.push({
      deleteTableColumn: {
        tableCellLocation: {
          tableStartLocation: { index: tableStartIndex },
          rowIndex: 0,
          columnIndex: 7, // Column index 7 is the 8th column
        },
      },
    });
  }

  // B. Delete extra rows (from index currentRows-1 down to 91)
  const targetRowCount = 91; // 1 header + 90 test cases
  if (currentRows > targetRowCount) {
    console.log(`Adding requests to delete extra rows from row ${currentRows - 1} down to ${targetRowCount}...`);
    for (let r = currentRows - 1; r >= targetRowCount; r--) {
      modifyRequests.push({
        deleteTableRow: {
          tableCellLocation: {
            tableStartLocation: { index: tableStartIndex },
            rowIndex: r,
          },
        },
      });
    }
  }

  if (modifyRequests.length > 0) {
    console.log(`Executing ${modifyRequests.length} formatting requests...`);
    await docsApi.documents.batchUpdate({
      documentId: DOCUMENT_ID,
      requestBody: { requests: modifyRequests },
    });
    console.log('Format complete. Waiting for doc sync...');
    await new Promise(r => setTimeout(r, 2000));
  }

  // ── STEP 3: WRITE THE 90 PASS TEST CASES ──
  console.log('Writing test case data to the main table...');
  
  // Reload document to get updated indices after formatting
  doc = await docsApi.documents.get({ documentId: DOCUMENT_ID });
  bodyContent = doc.data.body.content;

  const finalTables = [];
  bodyContent.forEach(elem => {
    if (elem.table) finalTables.push(elem);
  });

  let finalTableElem = null;
  let finalTable = null;
  for (const t of finalTables) {
    if ((t.table.tableRows ?? []).length > 50) {
      finalTableElem = t;
      finalTable = t.table;
      break;
    }
  }

  if (!finalTable) {
    console.error('Error: Main table not found after formatting!');
    process.exit(1);
  }

  const finalStartIndex = finalTableElem.startIndex;
  const finalRows = finalTable.tableRows;

  // We write in small batches to prevent rate limits
  const BATCH_SIZE = 20;
  for (let i = 0; i < mappedEntries.length; i += BATCH_SIZE) {
    const chunk = mappedEntries.slice(i, i + BATCH_SIZE);
    console.log(`Writing batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} rows)...`);

    // Reload document to get fresh table indexes for this batch
    const freshDoc = await docsApi.documents.get({ documentId: DOCUMENT_ID });
    
    // Find final table
    const freshTables = [];
    freshDoc.data.body.content.forEach(elem => {
      if (elem.table) freshTables.push(elem);
    });
    
    let freshTable = null;
    let freshStart = 0;
    for (const t of freshTables) {
      if ((t.table.tableRows ?? []).length > 50) {
        freshTable = t.table;
        freshStart = t.startIndex;
        break;
      }
    }

    if (!freshTable) {
      console.error('Error: Table disappeared during writing!');
      break;
    }

    const allReqs = [];
    const colorReqs = [];

    chunk.forEach((entry, chunkI) => {
      const rowIdx = i + chunkI + 1; // +1 to skip header row
      if (rowIdx >= freshTable.tableRows.length) return;

      const row = freshTable.tableRows[rowIdx];
      const cells = row.tableCells;

      const stepsText = `1. เข้า Website กรมธนารักษ์\n2. คลิก Bubble Chatbot\n3. ถามด้วยคำถาม\n- ${entry.Question}\n4. กดปุ่มส่ง`;
      const expText = `AI Chatbot สามารถตอบคำถามถูกต้อง\n- ${entry.Expected}`;

      const colData = [
        entry.newId,
        'เปิดใช้ Chatbot',
        'เข้าเว็บไซต์ของกรมธนารักษ์',
        stepsText,
        expText,
        '', // Actual Result left blank for images
        'PASS'
      ];

      colData.forEach((text, colI) => {
        if (colI < cells.length) {
          allReqs.push(...cellTextRequests(cells[colI], text));
        }
      });

      // Color the status cell (col index 6)
      if (cells[6]) {
        colorReqs.push(cellColorRequest(freshStart, rowIdx, 6));
      }
    });

    if (allReqs.length > 0) {
      // Sort descending
      allReqs.sort((a, b) => {
        const ia = a.deleteContentRange?.range?.startIndex ?? a.insertText?.location?.index ?? 0;
        const ib = b.deleteContentRange?.range?.startIndex ?? b.insertText?.location?.index ?? 0;
        return ib - ia;
      });

      await docsApi.documents.batchUpdate({
        documentId: DOCUMENT_ID,
        requestBody: { requests: allReqs },
      });
      await new Promise(r => setTimeout(r, 1200));
    }

    if (colorReqs.length > 0) {
      await docsApi.documents.batchUpdate({
        documentId: DOCUMENT_ID,
        requestBody: { requests: colorReqs },
      });
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log('=== Finished In-Place TRD_AI Processing successfully ===');
}

main().catch(err => {
  console.error('Fatal Error:', err.message);
  console.error(err.stack);
});
