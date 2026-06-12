import fs from 'fs';

const docsDataPath = 'output/in_coin_docs_data.json';
if (fs.existsSync(docsDataPath)) {
  const data = JSON.parse(fs.readFileSync(docsDataPath, 'utf8'));
  const entries = data.entries || [];
  console.log(`Total entries in in_coin_docs_data: ${entries.length}`);
  
  const withActual = entries.filter(e => e.actualResult && e.actualResult.trim() !== '');
  const withStatusPass = entries.filter(e => e.status && e.status.toUpperCase() === 'PASS');
  const withStatus = entries.filter(e => e.status && e.status.trim() !== '');
  
  console.log(`Entries with non-empty actualResult: ${withActual.length}`);
  console.log(`Entries with status === 'Pass': ${withStatusPass.length}`);
  console.log(`Entries with any status: ${withStatus.length}`);
  
  if (withActual.length > 0) {
    console.log('Sample entry with actualResult:', JSON.stringify(withActual[0], null, 2));
  }
} else {
  console.log('in_coin_docs_data.json not found!');
}
