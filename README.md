# Новий сайт Великогрибовицького ліцею

Технічна основа на Astro + TypeScript. Дизайн перенесено з оригінального HTML-прототипу. Новини, документи, оголошення й фотогалереї зберігаються у типізованих Astro Content Collections.

Оригінальний незмінений HTML-прототип збережено окремо у `prototype/`.

## Локальний запуск

```sh
npm install
npm run dev
```

Після запуску відкрийте адресу, яку покаже Astro (типово `http://localhost:4321`).

## Перевірка production-збірки

```sh
npm run build
npm run preview
```

Згенерований статичний сайт зберігається в `dist/`.

Повна локальна перевірка збірки, маршрутів, статусів публікації та PDF:

```sh
npm run audit:repo
npm run verify
```

## Основні каталоги

- `src/components/` — повторно використовувані компоненти;
- `src/content/` — Markdown-контент колекцій;
- `src/content.config.ts` — Zod-схеми та перевірка контенту;
- `src/lib/content.ts` — спільні запити лише до опублікованих матеріалів;
- `src/layouts/` — спільний HTML-каркас і SEO;
- `src/pages/` — маршрути сайту;
- `src/styles/` — дизайн-токени, глобальні та адаптивні стилі;
- `public/` — герб, favicon та інші статичні файли.

Матеріали, позначені як демонстраційні або тестові, не є офіційними публікаціями ліцею.

Конфігурація `.pages.yml` підготовлена, але Pages CMS, GitHub і Cloudflare Pages ще не підключені. Інструкції містяться у `docs/cms-setup.md`, `docs/deployment.md`, `docs/editor-guide.md` та `docs/backup.md`.
