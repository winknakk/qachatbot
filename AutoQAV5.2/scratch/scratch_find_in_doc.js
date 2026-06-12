import { google } from 'googleapis';
import path from 'path';

const KEY_FILE = './credentials/google-service-account.json';
const DOC_ID = '1p6qSWcVnU4JWaRVO0ydFzAnMNxq0Nr2R_u6OaGziErA';

async function findInDoc() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/documents.readonly'],
  });
  const client = await auth.getClient();
  const docs = google.docs({ version: 'v1', auth: client });

  console.log('Fetching Google Doc...');
  const docRes = await docs.documents.get({ documentId: DOC_ID });
  const docContent = docRes.data.body.content;

  const tableIndex = 21;
  const tableRows = docContent[tableIndex].table.tableRows;
  console.log(`Table 2 has ${tableRows.length} rows.`);

  const searchStr = 'เหรียญกษาปณ์ที่ชำรุดแบบใดที่กฎหมายระบุไว้ชัดเจน';

  tableRows.forEach((row, i) => {
    const cells = row.tableCells.map(cell => {
      let text = '';
      (cell.content || []).forEach(p => {
        if (p.paragraph) {
          p.paragraph.elements.forEach(el => {
            text += el.textRun?.content || '';
          });
        }
      });
      return text.trim();
    });

    const testId = cells[0] || '';
    const rawSteps = cells[3] || '';
    const rawExpected = cells[4] || '';

    if (rawSteps.includes(searchStr) || rawExpected.includes(searchStr) || testId.includes(searchStr)) {
      console.log(`MATCH found in Doc Row ${i}:`);
      console.log(`  Col 0 (ID): "${testId}"`);
      console.log(`  Col 3 (Steps): "${rawSteps.substring(0, 100)}..."`);
      console.log(`  Col 4 (Expected): "${rawExpected.substring(0, 100)}..."`);
    }
  });
}

findInDoc().catch(console.error);
