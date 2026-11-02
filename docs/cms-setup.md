# Підключення Pages CMS

`.pages.yml` лежить у корені репозиторію — саме там Pages CMS шукає конфігурацію. Використовується hosted-версія Pages CMS; власний сервер або власна адмінпанель не потрібні.

## Передумови

- приватний GitHub-репозиторій уже створений і містить гілку `main`;
- GitHub App Pages CMS має доступ лише до цього репозиторію;
- Pages CMS відкривається для власника репозиторію без помилок конфігурації;
- збірка `npm run verify` успішна.

## Підключення

1. Власник репозиторію входить на [app.pagescms.org](https://app.pagescms.org/) через GitHub.
2. Встановлює Pages CMS GitHub App для потрібного GitHub-власника.
3. У режимі **Only select repositories** обирає лише репозиторій ліцею.
4. Відкриває репозиторій і гілку `main` у Pages CMS.
5. Перевіряє чотири розділи: Новини, Документи, Оголошення, Фотогалереї.

Реальних редакторів на цьому етапі не запрошувати. Спочатку використати окремий тестовий обліковий запис або власника репозиторію.

## Відповідність полів

| Pages CMS | Astro Content Collection | Збереження |
|---|---|---|
| `body` rich-text | Markdown body | текст після YAML frontmatter |
| `date` | `z.coerce.date()` | `yyyy-MM-dd` |
| `status` select | `draft / review / published` | YAML string |
| `cover`, `photos`, `gallery` | об'єкти `photo` | локальний URL + alt + caption |
| `pdf` file | перевірений шлях `/files/*.pdf` | файл у `public/files/` |
| `slug` | валідований у Zod | латиниця, цифри, дефіси |

Нові Markdown-файли називаються за slug (`{fields.slug}.md`). Slug має бути унікальним і не змінюватися після публікації. Імена медіафайлів Pages CMS нормалізує через `rename: safe`.

## Тест редакторського циклу

Для кожної колекції створити явно тестовий запис:

1. Зберегти зі статусом `draft`.
2. Дочекатися Cloudflare build і перевірити, що запис відсутній на сайті, у RSS та sitemap.
3. Змінити на `review` — публічно нічого не має змінитися.
4. Змінити на `published` — після build запис має з'явитися.
5. Повернути `draft` — після build сторінка або елемент списку має зникнути.

Окремо перевірити завантаження локального зображення з alt-текстом, галереї з кількома фото та тестового PDF. Після кожного CMS commit GitHub Actions і Cloudflare build мають завершитися успішно.

## Обмеження доступу

Pages CMS collaborator може редагувати контент і медіа, але не повинен отримувати ширший доступ до GitHub або Cloudflare. Запрошення надсилаються лише після затвердження списку редакторів. Доступ звільненого працівника треба відкликати і в Pages CMS, і в GitHub/організації, якщо він там був.

Офіційні довідки: [Pages CMS quick start](https://pagescms.org/docs/quick-start/), [configuration](https://pagescms.org/docs/configuration/), [collaborators](https://pagescms.org/docs/configuration/collaborators/), [GitHub App](https://pagescms.org/docs/guides/installing/github-app/).
