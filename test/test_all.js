const fs = require('fs');
const path = require('path');
const hdrunpack = require('../lib/hdrunpack');

(async () => {
  let files = await new Promise((resolve, reject) => fs.readdir(__dirname, (err, files) => err ? reject(err) : resolve(files)));

  for (let file of files) {
    if (!file.endsWith('.hdr')) continue;
    await hdrunpack(path.resolve(__dirname, file));
  }
})().catch(err => {
  console.error('TEST FAILED!');
  console.error(err);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});