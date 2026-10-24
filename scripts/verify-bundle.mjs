import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const assetsDir = 'dist/assets';

function fail(message) {
  console.error(`Bundle boundary check failed: ${message}`);
  process.exit(1);
}

let files;
try {
  files = readdirSync(assetsDir);
} catch {
  fail(`${assetsDir} does not exist. Run npm run build first.`);
}

const mainFiles = files.filter((file) => /^index-.*\.js$/.test(file));
const workerFiles = files.filter((file) => /^solver\.worker-.*\.js$/.test(file));

if (mainFiles.length === 0) fail('no main bundle found');
if (workerFiles.length === 0) fail('no Solver Worker bundle found');

const mainCode = mainFiles
  .map((file) => readFileSync(join(assetsDir, file), 'utf8'))
  .join('\n');
const workerCode = workerFiles
  .map((file) => readFileSync(join(assetsDir, file), 'utf8'))
  .join('\n');

if (mainCode.includes('initSolver')) {
  fail('cubejs leaked into the main bundle; it belongs only in the Solver Worker');
}
if (!workerCode.includes('initSolver')) {
  fail('the Solver Worker bundle does not contain cubejs');
}

const mainSize = mainFiles.reduce(
  (total, file) => total + statSync(join(assetsDir, file)).size,
  0,
);
const workerSize = workerFiles.reduce(
  (total, file) => total + statSync(join(assetsDir, file)).size,
  0,
);

console.log(
  `Bundle boundary verified: main ${(mainSize / 1024).toFixed(0)} kB without cubejs, worker ${(workerSize / 1024).toFixed(0)} kB with cubejs.`,
);
