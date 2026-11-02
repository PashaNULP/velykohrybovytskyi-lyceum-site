import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', '.astro', 'dist', 'node_modules']);
const textExtensions = new Set(['', '.astro', '.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.txt', '.yml', '.yaml']);
const forbiddenNames = [/^\.env(?:\..+)?$/, /^\.dev\.vars(?:\..+)?$/, /\.pem$/i, /\.p12$/i, /\.pfx$/i];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\b(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN|GITHUB_TOKEN)\s*[:=]\s*[^\s$<{][^\s]*/i,
  /\b(?:password|passwd|secret)\s*[:=]\s*["']?[^\s$<{][^\s"']{7,}/i,
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(root);
const forbidden = files.filter((path) => forbiddenNames.some((pattern) => pattern.test(path.split('/').at(-1))) && !path.endsWith('.env.example'));
const leaks = [];
const emails = [];

for (const path of files.filter((file) => textExtensions.has(extname(file)))) {
  const source = readFileSync(path, 'utf8');
  source.split(/\r?\n/).forEach((line, index) => {
    if (secretPatterns.some((pattern) => pattern.test(line))) leaks.push(`${relative(root, path)}:${index + 1}`);
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(line) && !/example\.(?:com|org|ua)/i.test(line)) {
      emails.push(`${relative(root, path)}:${index + 1}`);
    }
  });
}

if (forbidden.length || leaks.length) {
  if (forbidden.length) console.error('Знайдено файли, які не можна публікувати:', forbidden.map((path) => relative(root, path)).join(', '));
  if (leaks.length) console.error('Знайдено можливі секрети:', leaks.join(', '));
  process.exit(1);
}

console.log('Секретів, приватних ключів і локальних env-файлів не знайдено.');
console.log(emails.length ? `Email-адреси для ручної перевірки персональних даних: ${emails.join(', ')}` : 'Email-адрес у файлах репозиторію не знайдено.');
