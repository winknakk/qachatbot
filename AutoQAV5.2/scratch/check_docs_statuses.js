import fs from 'fs';

const docsDataPath = 'output/in_coin_docs_data.json';
if (fs.existsSync(docsDataPath)) {
  const data = JSON.parse(fs.readFileSync(docsDataPath, 'utf8'));
  const entries = data.entries || [];
  
  const statusCounts = {};
  const sampleStatuses = [];
  
  entries.forEach((e, idx) => {
    const status = e.status || '';
    if (status) {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      if (sampleStatuses.length < 20) {
        sampleStatuses.push({
          index: idx,
          testId: e.testId,
          question: e.question.substring(0, 40) + '...',
          status: e.status
        });
      }
    }
  });
  
  console.log('Status counts:', statusCounts);
  console.log('Sample entries with status:');
  console.log(JSON.stringify(sampleStatuses, null, 2));
} else {
  console.log('in_coin_docs_data.json not found!');
}
