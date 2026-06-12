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

function norm(text) {
  return (text ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\u0e00-\u0e7f\u0020-\u007e]/g, '')
    .toLowerCase()
    .trim();
}

async function debug() {
  const inputFile = 'output/in_coin_docs_data.json';
  const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const entries = raw.entries || [];
  
  const client = new SheetsClient();
  await client.init();
  const sheetCases = await client.getTestCases(true);
  
  const testIdToCase = new Map();
  const questionToCase = new Map();
  for (const sc of sheetCases) {
    if (sc.testId) {
      testIdToCase.set(normalizeTestId(sc.testId), sc);
    }
    if (sc.question) {
      questionToCase.set(norm(sc.question), sc);
    }
  }

  // Debug for TRD_AI_009 / TRD_AI_09
  const debugIds = ['TRD_AI_009', 'TRD_AI_010', 'TRD_AI_012', 'TRD_AI_013'];
  
  debugIds.forEach(id => {
    console.log(`\n--- Debugging JSON ID: ${id} ---`);
    const entry = entries.find(e => e.testId === id);
    if (!entry) {
      console.log(`Entry ${id} not found in JSON!`);
      return;
    }
    console.log(`JSON Entry:`, {
      testId: entry.testId,
      question: entry.question.substring(0, 50) + '...',
      status: entry.status,
      actualResult: entry.actualResult
    });
    
    const normJsonId = normalizeTestId(entry.testId);
    console.log(`Normalized JSON ID: "${normJsonId}"`);
    
    const matchedByTestId = testIdToCase.get(normJsonId);
    if (matchedByTestId) {
      console.log(`Matched by Test ID in Sheet:`, {
        rowIndex: matchedByTestId.rowIndex,
        testId: matchedByTestId.testId,
        question: matchedByTestId.question.substring(0, 50) + '...',
        expected: matchedByTestId.expected.substring(0, 50) + '...',
        actual: matchedByTestId.actual,
        status: matchedByTestId.status
      });
      console.log(`Is matched.status falsy?`, !matchedByTestId.status);
      console.log(`Is entry.status truthy?`, !!entry.status);
    } else {
      console.log(`NO Match by Test ID in Sheet!`);
      // Check if this ID is in testIdToCase keys
      console.log(`Available normalized keys:`, Array.from(testIdToCase.keys()).slice(0, 15));
    }
  });
}

debug().catch(console.error);
