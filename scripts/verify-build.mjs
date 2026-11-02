import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function frontmatter(path) {
  const source = readFileSync(path, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Немає YAML frontmatter: ${relative(root, path)}`);
  const value = (name) => match[1].match(new RegExp(`^${name}:\\s*["']?([^\\n"']*)`, 'm'))?.[1]?.trim();
  return { source, title: value('title'), slug: value('slug'), status: value('status'), pdf: value('pdf'), expiresAt: value('expiresAt') };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(existsSync(dist), 'Каталог dist відсутній. Спочатку виконайте npm run build.');
const htmlFiles = walk(dist).filter((path) => extname(path) === '.html');
const rendered = htmlFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
const generatedText = walk(dist)
  .filter((path) => ['.html', '.xml'].includes(extname(path)))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');
const home = readFileSync(join(dist, 'index.html'), 'utf8');

for (const collection of ['news', 'documents', 'announcements', 'galleries']) {
  const directory = join(root, 'src', 'content', collection);
  for (const path of walk(directory).filter((file) => file.endsWith('.md'))) {
    const entry = frontmatter(path);
    assert(entry.slug, `Немає slug: ${relative(root, path)}`);
    assert(entry.status, `Немає status: ${relative(root, path)}`);
    if (entry.status !== 'published') {
      assert(!generatedText.includes(entry.slug), `Slug неопублікованого матеріалу потрапив у HTML/XML: ${entry.slug}`);
    }

    if (collection === 'news') {
      const output = join(dist, 'novyny', entry.slug, 'index.html');
      assert(entry.status === 'published' ? existsSync(output) : !existsSync(output), `Неправильна видимість новини ${entry.slug}.`);
    }

    if (collection === 'galleries') {
      const output = join(dist, 'halerei', entry.slug, 'index.html');
      assert(entry.status === 'published' ? existsSync(output) : !existsSync(output), `Неправильна видимість галереї ${entry.slug}.`);
    }

    if (collection === 'documents') {
      assert(entry.pdf, `Немає PDF: ${relative(root, path)}`);
      const publicPdf = join(root, 'public', entry.pdf.replace(/^\//, ''));
      const builtPdf = join(dist, entry.pdf.replace(/^\//, ''));
      assert(existsSync(publicPdf), `PDF не знайдено: ${entry.pdf}`);
      assert(existsSync(builtPdf), `PDF не скопійовано до dist: ${entry.pdf}`);
      if (entry.status !== 'published') assert(!rendered.includes(entry.title), `Неопублікований документ потрапив у HTML: ${entry.title}`);
    }

    if (collection === 'announcements') {
      if (entry.status !== 'published') assert(!rendered.includes(entry.title), `Неопубліковане оголошення потрапило у HTML: ${entry.title}`);
      if (entry.expiresAt && new Date(`${entry.expiresAt}T23:59:59`) < new Date()) {
        assert(!home.includes(entry.title), `Прострочене оголошення залишилося на головній: ${entry.title}`);
      }
    }
  }
}

for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, 'utf8');
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
    const pathname = decodeURIComponent(href.split(/[?#]/)[0]);
    if (!pathname || !pathname.startsWith('/')) continue;
    const target = join(dist, pathname.replace(/^\//, ''));
    const valid = extname(target) ? existsSync(target) : existsSync(target) || existsSync(join(target, 'index.html'));
    assert(valid, `Неробоче посилання ${href} у ${relative(root, htmlPath)}.`);
  }
}

const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
if (process.env.PUBLIC_SITE_ENV === 'production') {
  assert(robots.includes('Allow: /'), 'Production robots.txt повинен дозволяти індексацію.');
} else {
  assert(robots.includes('Disallow: /'), 'Тестовий robots.txt повинен забороняти індексацію.');
  assert(rendered.includes('noindex,nofollow,noarchive'), 'Тестові HTML-сторінки повинні містити noindex.');
}

console.log(`Перевірено ${htmlFiles.length} HTML-сторінок: маршрути, статуси, PDF, посилання та robots.txt коректні.`);
