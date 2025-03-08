import {join} from 'path';
import {replaceInFile} from 'replace-in-file';

replaceInFile({
  files: [join(import.meta.dirname, '../src/api.ts'), join(import.meta.dirname, '../src/base.ts')],
  from: 'axios',
  to: '../axios'
});
