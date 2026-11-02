import { basename, resolve } from 'node:path';
import { rmSync } from 'node:fs';

const output = resolve(process.cwd(), 'dist');

if (basename(output) !== 'dist') {
  throw new Error(`Відмовлено в очищенні неочікуваного каталогу: ${output}`);
}

rmSync(output, { recursive: true, force: true });
