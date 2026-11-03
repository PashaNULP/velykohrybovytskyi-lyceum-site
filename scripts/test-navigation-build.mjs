import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const readPage = (path) => readFileSync(join(root, 'dist', path, 'index.html'), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(existsSync(join(root, 'dist/index.html')), 'Спочатку виконайте npm run build.');

const home = readFileSync(join(root, 'dist/index.html'), 'utf8');
const students = readPage('uchnyam');
const parents = readPage('batkam');
const documents = readPage('dokumenty');
const article = readPage('novyny/uchnivske-samovriaduvannia-plany-2026');
const gallery = readPage('halerei/power4girls-zapal');

assert(home.includes('href="/uchnyam/rozklad/"') && home.includes('>Розклад<'), 'У головній навігації немає прямого розкладу.');
assert(home.includes('/uchnyam/rozklad/#lesson-schedule-title'), 'На головній немає прямого переходу до розкладу уроків.');
assert(home.includes('/uchnyam/rozklad/#bell-schedule-title'), 'На головній немає прямого переходу до розкладу дзвінків.');
assert(home.includes('href="/oholoshennia/"') && home.includes('href="/kontakty/"'), 'На головній бракує оголошень або контактів.');
assert(home.includes('data-menu-toggle') && home.includes('aria-expanded="false"') && home.includes('aria-controls="mobile-navigation"'), 'Mobile-menu не має потрібних ARIA-атрибутів.');

assert(parents.includes('правила-прийому-до-закладу'), 'Сторінка для батьків не веде на офіційні правила зарахування.');
assert(students.includes('/novyny/uchnivske-samovriaduvannia-plany-2026/'), 'Самоврядування веде не на конкретний матеріал.');
for (const slug of ['osvitnia-prohrama-1-4-2025-2026', 'osvitnia-prohrama-5-8-2025-2026', 'osvitnia-prohrama-9-11-2025-2026']) {
  assert(students.includes(`/dokumenty/#${slug}`), `Немає прямого посилання на програму ${slug}.`);
  assert(documents.includes(`id="${slug}"`), `Ціль документа ${slug} відсутня.`);
}
assert(parents.includes('/dokumenty/#statut-velykohrybovytskoho-litseiu') && documents.includes('id="statut-velykohrybovytskoho-litseiu"'), 'Посилання на Статут не є прямим або його ціль відсутня.');

assert(article.includes('class="breadcrumbs"') && article.includes('Повернутися до всіх новин'), 'З новини немає зрозумілого повернення до архіву.');
assert(article.includes('Пов’язані матеріали'), 'На сторінці новини немає пов’язаних матеріалів.');
assert(gallery.includes('class="breadcrumbs"') && gallery.includes('Повернутися до всіх фотогалерей'), 'З фотогалереї немає зрозумілого повернення.');

console.log('Навігаційні сценарії учня, батьків, учителя, контактів, новин і галерей перевірено.');
