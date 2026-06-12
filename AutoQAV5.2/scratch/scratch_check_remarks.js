import fs from 'fs';

const docsDataPath = 'output/in_coin_docs_data.json';
if (fs.existsSync(docsDataPath)) {
  const data = JSON.parse(fs.readFileSync(docsDataPath, 'utf8'));
  const entries = data.entries || [];
  
  const withRemark = entries.filter(e => e.remark && e.remark.trim() !== '');
  console.log(`Total entries: ${entries.length}`);
  console.log(`Entries with non-empty remark: ${withRemark.length}`);
  
  if (withRemark.length > 0) {
    console.log('Sample entry with remark (first 3):');
    console.log(JSON.stringify(withRemark.slice(0, 3), null, 2));
  }
} else {
  console.log('in_coin_docs_data.json not found!');
}
