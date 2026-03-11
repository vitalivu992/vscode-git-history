import * as path from 'path';
import { glob } from 'glob';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mocha = require('mocha');

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 30000
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    glob('screenshot/**/*.test.js', { cwd: testsRoot })
      .then((files: string[]) => {
        files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

        try {
          mocha.run((failures?: number) => {
            if (failures && failures > 0) {
              e(new Error(`${failures} tests failed.`));
            } else {
              c();
            }
          });
        } catch (err) {
          console.error(err);
          e(err);
        }
      })
      .catch(err => {
        e(err);
      });
  });
}
