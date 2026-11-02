# Розгортання тестового сайту

Цей документ описує майбутнє підключення приватного GitHub-репозиторію та Cloudflare Pages. Він не є дозволом створювати зовнішні ресурси. Офіційний домен на тестовому етапі не підключається.

## GitHub

Рекомендована структура:

- приватний репозиторій, коренем якого є цей каталог `site/`;
- основна гілка `main`;
- короткоживучі гілки `work/<назва>` для змін коду та pull request;
- Pages CMS редагує `main` безпосередньо, оскільки редактори працюють зі статусами `draft`, `review`, `published`, а не з Git-гілками;
- перевірка `.github/workflows/quality.yml` запускає аудит, Astro build і перевірку згенерованого сайту.

Перед першим push:

```sh
npm ci
npm run audit:repo
npm run verify
git status --ignored
```

Репозиторій має залишатися приватним. Не додавайте `.env`, токени, приватні ключі, персональні списки учнів або службові документи. Статус `draft` приховує матеріал із сайту, але не робить файл приватним від людей, які вже мають доступ до репозиторію.

## Cloudflare Pages

Після окремого підтвердження власника GitHub і Cloudflare:

1. У Cloudflare вибрати **Workers & Pages → Create → Pages → Connect to Git**.
2. Надати Cloudflare GitHub App доступ лише до приватного репозиторію сайту.
3. Встановити production branch `main`.
4. Framework preset: `Astro`.
5. Build command: `npm run build`.
6. Build output directory: `dist`.
7. Root directory: залишити порожнім, бо `site/` є коренем репозиторію.
8. Node береться з `.nvmrc`: `22.23.4`.

Для першого тестового розгортання в production-оточенні Cloudflare встановити:

```text
PUBLIC_SITE_ENV=preview
```

`SITE_URL` не задавати: збірка використає автоматичний `CF_PAGES_URL`. Так canonical URL відповідатиме тестовому `pages.dev`. Для preview-оточення також залишити `PUBLIC_SITE_ENV=preview`.

Тестове середовище має три шари захисту від індексації:

- `meta robots=noindex,nofollow,noarchive` у кожній сторінці;
- `robots.txt` із `Disallow: /`;
- Cloudflare автоматично додає `X-Robots-Tag: noindex` до preview deployments.

`noindex` не є контролем доступу. У Cloudflare Pages треба ввімкнути **Settings → General → Enable access policy**. Це захищає preview deployment. Щоб захистити також головний `<project>.pages.dev`, у створеній Access application треба прибрати wildcard із public hostname, зберегти окрему policy для кореневого `pages.dev`, а потім повторно ввімкнути policy для `*.<project>.pages.dev`. Дозволяти вхід лише погодженим тестувальникам; реальних редакторів поки не запрошувати.

## Перевірка тестового deployment

- HTTPS без помилок сертифіката;
- головна, `/novyny/`, новина, `/dokumenty/`, `/halerei/`, галерея та `/404.html`;
- мобільне меню, клавіатурна навігація, фокус і alt-тексти;
- зображення, резервне відображення зовнішніх фото, перегляд і завантаження PDF;
- `robots.txt` забороняє індексацію, HTML містить `noindex`;
- draft/review не присутні в HTML, RSS і sitemap;
- новий commit запускає автоматичну збірку, а pull request — preview deployment.

## Перехід у production

Лише після окремого погодження офіційного домену:

1. Перевірити фінальний контент і резервну копію.
2. Встановити production variables:

   ```text
   PUBLIC_SITE_ENV=production
   SITE_URL=https://погоджений-офіційний-домен
   ```

3. Підключити custom domain у Cloudflare Pages і перевірити DNS/HTTPS.
4. Не змінювати старий офіційний сайт або DNS до погодженого вікна перемикання.
5. Залишити preview environment у режимі `preview` та під Cloudflare Access.

Офіційні довідки: [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [preview deployments та Access](https://developers.cloudflare.com/pages/configuration/preview-deployments/), [захист основного pages.dev](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain).
