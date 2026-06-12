import fs from 'fs';

const docsDataPath = 'output/in_coin_docs_data.json';
if (fs.existsSync(docsDataPath)) {
  const data = JSON.parse(fs.readFileSync(docsDataPath, 'utf8'));
  const entries = data.entries || [];
  const passEntries = entries.filter(e => e.status && e.status.toUpperCase() === 'PASS');
  console.log(`Found ${passEntries.length} pass entries.`);
  if (passEntries.length > 0) {
    console.log('First 5 pass entries:');
    console.log(JSON.stringify(passEntries.slice(0, 5), null, 2));
  }
} else {
  console.log('in_coin_docs_data.json not found!');
}
