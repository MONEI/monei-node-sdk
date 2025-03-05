const replace = require('replace-in-file');
const path = require('path');

replace.replaceInFile({
  files: [path.join(__dirname, '../src/api.ts'), path.join(__dirname, '../src/base.ts')],
  from: 'axios',
  to: '../axios'
});
