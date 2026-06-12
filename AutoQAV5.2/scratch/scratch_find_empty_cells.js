import 'dotenv/config';
import SheetsClient from './src/modules/sheetsClient.js';

async function main() {
  const client = new SheetsClient();
  await client.init();
  const cases = await client.getTestCases(true);
  
  const emptyExpected = [];
  const emptyTestId = [];
  const tcTestId = [];
  
  for (const c of cases) {
    if (!c.expected || c.expected.trim() === '') {
      emptyExpected.push(c);
    }
    if (!c.testId || c.testId.trim() === '') {
      emptyTestId.push(c);
    } else if (c.testId.startsWith('TC_')) {
      tcTestId.push(c);
    }
  }

  console.log(`Summary:`);
  console.log(`- Total cases: ${cases.length}`);
  console.log(`- Cases with empty Expected: ${emptyExpected.length}`);
  console.log(`- Cases with empty Test ID: ${emptyTestId.length}`);
  console.log(`- Cases with auto-generated Test ID (starts with TC_): ${tcTestId.length}`);
  
  if (emptyExpected.length > 0) {
    console.log('\nSample empty expected (first 5):');
    console.log(emptyExpected.slice(0, 5));
  }
  if (tcTestId.length > 0) {
    console.log('\nSample auto-generated Test ID (first 5):');
    console.log(tcTestId.slice(0, 5));
  }
}

main().catch(err => console.error(err));
