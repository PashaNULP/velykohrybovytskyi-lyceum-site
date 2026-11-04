import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const sourceRoot = process.cwd();
const testRoot = mkdtempSync(join(tmpdir(), 'lyceum-schedule-'));
const schedulePath = join(testRoot, 'src/content/schedules/test-7-a.md');
const testTitle = 'ТЕСТ: розклад 7-А класу';

const schedule = (status, duplicateDay = false) => `---
title: "${testTitle}"
slug: test-7-a
className: 7-А клас
academicYear: 2026–2027
updatedAt: 2026-11-03
status: ${status}
sourceUrl: https://example.org/official-schedule
notes: Автоматична перевірка структури розкладу.
days:
  - day: monday
    lessons:
      - number: 1
        subject: Українська мова
        start: "09:00"
        end: "09:45"
        room: "21"
        groups:
          - name: Група 1
            subject: Українська мова
  - day: ${duplicateDay ? 'monday' : 'tuesday'}
    lessons:
      - number: 2
        subject: Математика
        groups: []
---
`;

function build(expectSuccess = true) {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: testRoot,
    env: { ...process.env, PUBLIC_SITE_ENV: 'preview', SITE_URL: 'http://localhost:4321' },
    encoding: 'utf8',
  });
  if (expectSuccess && result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  if (!expectSuccess && result.status === 0) throw new Error('Некоректний розклад із повторним днем пройшов валідацію.');
  return `${result.stdout}\n${result.stderr}`;
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

  writeFileSync(schedulePath, schedule('draft'));
  build();
  let page = readFileSync(join(testRoot, 'dist/uchnyam/rozklad/index.html'), 'utf8');
  assert(!page.includes('data-class-panel="test-7-a"'), 'Чернетка розкладу стала публічною.');
  assert(page.includes('data-class-panel="1-a"'), 'Опубліковані розклади зникли під час перевірки чернетки.');

  writeFileSync(schedulePath, schedule('published'));
  build();
  page = readFileSync(join(testRoot, 'dist/uchnyam/rozklad/index.html'), 'utf8');
  assert(page.includes('7-А клас'), 'Опублікований розклад не з’явився на сторінці.');
  assert(page.includes('data-class-panel="test-7-a"'), 'Немає панелі класу для перемикання.');
  assert(page.includes('data-day-panel="monday"') && page.includes('data-day-panel="friday"'), 'Не показано повний навчальний тиждень.');
  assert(!page.includes('data-day="monday"'), 'На сторінці залишився зайвий перемикач окремого дня.');
  assert(page.includes('Українська мова'), 'Предмети не потрапили до публічної сторінки.');
  assert(page.includes('Група 1'), 'Поділ уроку на групи не відображається.');

  writeFileSync(schedulePath, schedule('draft'));
  build();
  page = readFileSync(join(testRoot, 'dist/uchnyam/rozklad/index.html'), 'utf8');
  assert(!page.includes('data-class-panel="test-7-a"'), 'Знятий із публікації розклад залишився на сторінці.');

  writeFileSync(schedulePath, schedule('published', true));
  const errorOutput = build(false);
  assert(errorOutput.includes('Цей день тижня вже додано'), 'Помилка повторного дня не має зрозумілого повідомлення.');

  assert(existsSync(join(testRoot, '.pages.yml')), 'Конфігурація Pages CMS відсутня.');
  const cms = readFileSync(join(testRoot, '.pages.yml'), 'utf8');
  assert(cms.includes('name: schedules') && cms.includes('name: bellSchedules'), 'Колекції розкладів не додано до Pages CMS.');

  console.log('Редакторський цикл розкладу, приховування чернетки, групи та валідація повторних днів пройдені.');
} finally {
  rmSync(testRoot, { recursive: true, force: true });
}
