const { createWorker } = require('tesseract.js');
const worker = createWorker();
console.log('type', typeof worker);
console.log('keys', Object.keys(worker));
console.log('has terminate', typeof worker.terminate);
