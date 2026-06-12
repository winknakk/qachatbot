import fs from 'fs';
import 'dotenv/config';
import SheetsClient from '../src/modules/sheetsClient.js';

function normalizeTestId(id) {
  if (!id) return '';
  const m = id.trim().match(/^TRD_AI_(\d+)$/i);
  if (m) {
    return `TRD_AI_${parseInt(m[1], 10)}`;
  }
  const m2 = id.trim().match(/^TC_(\d+)$/i);
  if (m2) {
    return `TRD_AI_${parseInt(m2[1], 10) - 1}`;
  }
  return id.trim().toUpperCase();
}

async function main() {
  const listedIds = [
    'TRD_AI_09', 'TRD_AI_10', 'TRD_AI_12', 'TRD_AI_13', 'TRD_AI_14',
    'TRD_AI_15', 'TRD_AI_16', 'TRD_AI_17', 'TRD_AI_18', 'TRD_AI_19',
    'TRD_AI_20', 'TRD_AI_22', 'TRD_AI_24', 'TRD_AI_27', 'TRD_AI_28',
    'TRD_AI_29', 'TRD_AI_30', 'TRD_AI_32', 'TRD_AI_88', 'TRD_AI_97',
    'TRD_AI_99', 'TRD_AI_696', 'TRD_AI_738', 'TRD_AI_750', 'TRD_AI_898',
    'TRD_AI_918', 'TRD_AI_927', 'TRD_AI_943', 'TRD_AI_944', 'TRD_AI_947',
    'TRD_AI_948', 'TRD_AI_949', 'TRD_AI_951'
  ];

  const docsDataPath = 'output/in_coin_docs_data.json';
  const raw = JSON.parse(fs.readFileSync(docsDataPath, 'utf8'));
  const entries = raw.entries || [];

  const client = new SheetsClient();
  await client.init();
  const sheetCases = await client.getTestCases(true);

  console.log(`Analyzing ${listedIds.length} listed Test IDs...`);

  listedIds.forEach(id => {
    const normId = normalizeTestId(id);
    
    // Find in JSON
    // Note: in JSON, IDs are e.g. TRD_AI_009, so we normalize to search
    const jsonEntry = entries.find(e => normalizeTestId(e.testId) === normId);
    const jsonStatus = jsonEntry ? jsonEntry.status : 'NOT FOUND IN JSON';
    const jsonQuestion = jsonEntry ? jsonEntry.question.substring(0, 30) + '...' : '';

    // Find all rows in Sheet with this normalized Test ID
    const sheetRows = sheetCases
      .filter(sc => normalizeTestId(sc.testId) === normId)
      .map(sc => ({
        rowNum: sc.rowIndex,
        testId: sc.testId,
        question: sc.question.substring(0, 30) + '...',
        actual: sc.actual,
        status: sc.status
      }));

    console.log(`\nTest ID: ${id} (${normId})`);
    console.log(`- JSON status: "${jsonStatus}" | Q: "${jsonQuestion}"`);
    console.log(`- Sheet rows matching:`, JSON.stringify(sheetRows, null, 2));
  });
}

main().catch(console.error);
