import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const sourceRoot = process.cwd();
const testRoot = mkdtempSync(join(tmpdir(), 'lyceum-editorial-'));
const newsPath = join(testRoot, 'src/content/news/test-editorial-cycle.md');
const documentPath = join(testRoot, 'src/content/documents/test-editorial-document.md');
const testTitle = 'ТЕСТ: редакторський цикл новини';
const documentTitle = 'ТЕСТ: редакторський цикл PDF';

const news = (status) => `---
title: "${testTitle}"
slug: test-editorial-cycle
publishedAt: 2026-11-02
category: Події
summary: "Демонстраційний матеріал для автоматичної перевірки редакторського циклу."
cover:
  src: /images/lyceum-crest.webp
  alt: "Герб Великогрибовицького ліцею для тестового матеріалу"
gallery:
  - src: /images/lyceum-crest.webp
    alt: "Перше тестове зображення у демонстраційній галереї"
  - src: /images/lyceum-crest.webp
    alt: "Друге тестове зображення у демонстраційній галереї"
status: ${status}
featured: false
sourceUrl: https://example.org/news/test-editorial-cycle
---

Це тимчасова тестова новина. Вона створюється лише в ізольованій копії проєкту.
`;

const document = (status) => `---
title: "${documentTitle}"
slug: test-editorial-document
category: Звіти
documentDate: 2026-11-02
summary: "Демонстраційний PDF для автоматичної перевірки публікації документа."
pdf: /files/editorial-check.pdf
status: ${status}
academicYear: 2026–2027
sourceUrl: https://example.org/documents/test-editorial-document
---

Тимчасовий тестовий документ.
`;

function build() {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: testRoot,
    env: { ...process.env, PUBLIC_SITE_ENV: 'preview', SITE_URL: 'http://localhost:4321' },
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  cpSync(sourceRoot, testRoot, {
    recursive: true,
    filter: (path) => !['.git', '.astro', 'dist', 'node_modules'].includes(path.split('/').at(-1)),
  });
  symlinkSync(join(sourceRoot, 'node_modules'), join(testRoot, 'node_modules'), 'dir');
  mkdirSync(join(testRoot, 'public/files'), { recursive: true });
  writeFileSync(join(testRoot, 'public/files/editorial-check.pdf'), '%PDF-1.4\n% Editorial workflow check\n%%EOF\n');

  writeFileSync(newsPath, news('draft'));
  writeFileSync(documentPath, document('draft'));
  build();
  assert(!existsSync(join(testRoot, 'dist/novyny/test-editorial-cycle/index.html')), 'Чернетка новини стала публічною.');
  assert(!readFileSync(join(testRoot, 'dist/dokumenty/index.html'), 'utf8').includes(documentTitle), 'Чернетка PDF стала публічною.');

  writeFileSync(newsPath, news('published'));
  writeFileSync(documentPath, document('published'));
  build();
  assert(existsSync(join(testRoot, 'dist/novyny/test-editorial-cycle/index.html')), 'Опублікована новина не згенерована.');
  assert(readFileSync(join(testRoot, 'dist/dokumenty/index.html'), 'utf8').includes(documentTitle), 'Опублікований PDF не зʼявився.');

  writeFileSync(newsPath, news('draft'));
  writeFileSync(documentPath, document('draft'));
  build();
  assert(!existsSync(join(testRoot, 'dist/novyny/test-editorial-cycle/index.html')), 'Знята з публікації новина залишилася у збірці.');
  assert(!readFileSync(join(testRoot, 'dist/dokumenty/index.html'), 'utf8').includes(documentTitle), 'Знятий з публікації PDF залишився у каталозі.');

  console.log('Редакторський цикл draft → published → draft для новини, галереї з 2 фото та PDF пройдено.');
} finally {
  rmSync(testRoot, { recursive: true, force: true });
}
