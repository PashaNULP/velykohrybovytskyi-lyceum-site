import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const status = z.enum(['draft', 'review', 'published'], {
  error: 'Статус має бути draft, review або published.',
});

const optionalDate = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.coerce.date({ error: 'Дата має бути коректною.' }).optional(),
);

const optionalAcademicYear = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.string().regex(/^\d{4}–\d{4}$/, 'Навчальний рік має мати формат 2026–2027.').optional(),
);

const academicYear = z
  .string({ error: 'Додайте навчальний рік.' })
  .regex(/^\d{4}–\d{4}$/, 'Навчальний рік має мати формат 2026–2027.');

const optionalShortText = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.string().max(160, 'Текст задовгий: максимум 160 символів.').optional(),
);

const time = z
  .string({ error: 'Додайте час у форматі ГГ:ХХ.' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Час має бути у форматі ГГ:ХХ, наприклад 09:00.');

const minutesFromMidnight = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const slug = z
  .string({ error: 'Додайте унікальний slug.' })
  .min(3, 'Slug має містити щонайменше 3 символи.')
  .max(100, 'Slug задовгий: максимум 100 символів.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug має містити лише малі латинські літери, цифри й дефіси.');

const mediaPath = z
  .string({ error: 'Додайте шлях до зображення.' })
  .min(1, 'Шлях до зображення не може бути порожнім.')
  .refine(
    (value) => value.startsWith('/') || /^https:\/\//.test(value),
    'Зображення повинно мати локальний шлях від / або повну HTTPS-адресу.',
  );

const sourceUrl = z
  .url({ error: 'Посилання на першоджерело має бути коректною URL-адресою.' })
  .refine((value) => value.startsWith('https://'), 'Використовуйте захищене HTTPS-посилання.')
  .optional();

const photo = z.object({
  src: mediaPath,
  alt: z.string({ error: 'Додайте альтернативний опис фотографії.' }).min(5, 'Alt-текст має бути змістовним.'),
  caption: z.string().max(240, 'Підпис фотографії задовгий.').optional(),
});

const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string({ error: 'Додайте заголовок новини.' }).min(5).max(140),
    slug,
    publishedAt: z.coerce.date({ error: 'Додайте коректну дату публікації.' }),
    category: z.enum(['Події', 'Навчання', 'Спільнота', 'Досягнення'], {
      error: 'Оберіть одну з дозволених категорій новин.',
    }),
    summary: z.string({ error: 'Додайте короткий опис новини.' }).min(20).max(360),
    cover: photo.optional(),
    gallery: z.array(photo).max(30, 'Одна новина може містити максимум 30 фотографій.').default([]),
    status,
    featured: z.boolean().default(false),
    seoTitle: z.string().max(70, 'SEO-заголовок має містити не більше 70 символів.').optional(),
    seoDescription: z.string().max(170, 'SEO-опис має містити не більше 170 символів.').optional(),
    sourceUrl,
  }).superRefine((data, context) => {
    if (data.status === 'published' && !data.sourceUrl) {
      context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'Перед публікацією додайте офіційне першоджерело.' });
    }
  }),
});

const documentPdf = z
  .string({ error: 'Додайте шлях до PDF.' })
  .regex(/^\/files\/[a-z0-9/_-]+\.pdf$/i, 'PDF повинен бути в /public/files і мати безпечну назву файла.')
  .refine(
    (value) => existsSync(join(process.cwd(), 'public', value.replace(/^\//, ''))),
    'PDF-файл не знайдено в каталозі public. Перевірте шлях або завантажте файл.',
  );

const documents = defineCollection({
  loader: glob({ base: './src/content/documents', pattern: '**/*.md' }),
  schema: z
    .object({
      title: z.string({ error: 'Додайте назву документа.' }).min(5).max(180),
      slug,
      category: z.enum(['Установчі документи', 'Освітній процес', 'Для батьків', 'Звіти', 'Безпека та правила'], {
        error: 'Оберіть одну з дозволених категорій документів.',
      }),
      documentDate: optionalDate,
      summary: z.string({ error: 'Додайте короткий опис документа.' }).min(10).max(360),
      pdf: documentPdf.optional(),
      externalUrl: sourceUrl,
      status,
      academicYear: optionalAcademicYear,
      sourceUrl,
    })
    .superRefine((data, context) => {
      if (data.status === 'published' && !data.pdf && !data.externalUrl) {
        context.addIssue({ code: 'custom', path: ['pdf'], message: 'Для публікації додайте локальний PDF або офіційне зовнішнє посилання.' });
      }
      if (data.status === 'published' && !data.documentDate) {
        context.addIssue({ code: 'custom', path: ['documentDate'], message: 'Перед публікацією підтвердьте дату документа.' });
      }
      if (data.status === 'published' && !data.sourceUrl) {
        context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'Перед публікацією додайте сторінку-першоджерело.' });
      }
    }),
});

const announcements = defineCollection({
  loader: glob({ base: './src/content/announcements', pattern: '**/*.md' }),
  schema: z
    .object({
      title: z.string({ error: 'Додайте назву оголошення.' }).min(5).max(140),
      slug,
      publishedAt: z.coerce.date({ error: 'Додайте коректну дату публікації.' }),
      expiresAt: optionalDate,
      status,
      important: z.boolean().default(false),
      sourceUrl,
    })
    .superRefine((data, context) => {
      if (data.expiresAt && data.expiresAt < data.publishedAt) {
        context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Дата завершення актуальності не може бути раніше дати публікації.' });
      }
      if (data.status === 'published' && !data.sourceUrl) {
        context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'Перед публікацією додайте офіційне першоджерело.' });
      }
    }),
});

const galleries = defineCollection({
  loader: glob({ base: './src/content/galleries', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string({ error: 'Додайте назву фотогалереї.' }).min(5).max(140),
    slug,
    date: optionalDate,
    description: z.string({ error: 'Додайте опис галереї.' }).min(20).max(500),
    cover: photo,
    photos: z.array(photo).min(1, 'Додайте щонайменше одну фотографію.').max(60),
    status,
    sourceUrl,
  }).superRefine((data, context) => {
    if (data.status === 'published' && !data.date) {
      context.addIssue({ code: 'custom', path: ['date'], message: 'Перед публікацією підтвердьте дату галереї.' });
    }
    if (data.status === 'published' && !data.sourceUrl) {
      context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'Перед публікацією додайте офіційне першоджерело.' });
    }
  }),
});

const lessonGroup = z.object({
  name: z.string({ error: 'Додайте назву групи.' }).min(1).max(60),
  subject: optionalShortText,
  room: optionalShortText,
  teacher: optionalShortText,
  note: optionalShortText,
});

const lesson = z.object({
  number: z.number({ error: 'Номер уроку має бути числом.' }).int().min(0).max(12),
  subject: z.string({ error: 'Додайте назву предмета.' }).min(1).max(120),
  start: time.optional(),
  end: time.optional(),
  room: optionalShortText,
  teacher: optionalShortText,
  note: optionalShortText,
  groups: z.array(lessonGroup).max(6, 'Для одного уроку можна додати максимум 6 груп.').default([]),
}).superRefine((data, context) => {
  if (Boolean(data.start) !== Boolean(data.end)) {
    context.addIssue({ code: 'custom', path: ['start'], message: 'Вкажіть і початок, і завершення уроку або залиште обидва поля порожніми.' });
  }
  if (data.start && data.end && minutesFromMidnight(data.end) <= minutesFromMidnight(data.start)) {
    context.addIssue({ code: 'custom', path: ['end'], message: 'Завершення уроку має бути пізніше за початок.' });
  }
});

const scheduleDay = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], {
    error: 'Оберіть день від понеділка до п’ятниці.',
  }),
  lessons: z.array(lesson).max(13, 'В одному дні може бути максимум 13 уроків.'),
}).superRefine((data, context) => {
  const numbers = new Set<number>();
  let previousEnd = -1;
  data.lessons.forEach((item, index) => {
    if (numbers.has(item.number)) {
      context.addIssue({ code: 'custom', path: ['lessons', index, 'number'], message: `Номер уроку ${item.number} повторюється в цьому дні.` });
    }
    numbers.add(item.number);
    if (item.start && item.end) {
      const start = minutesFromMidnight(item.start);
      if (start < previousEnd) {
        context.addIssue({ code: 'custom', path: ['lessons', index, 'start'], message: 'Уроки мають іти за часом і не перетинатися.' });
      }
      previousEnd = minutesFromMidnight(item.end);
    }
  });
});

const schedules = defineCollection({
  loader: glob({ base: './src/content/schedules', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string({ error: 'Додайте назву запису розкладу.' }).min(3).max(140),
    slug,
    className: z.string({ error: 'Додайте назву класу.' }).min(1).max(30),
    academicYear,
    updatedAt: z.coerce.date({ error: 'Додайте дату останнього оновлення.' }),
    status,
    sourceUrl,
    notes: z.string().max(500, 'Примітка задовга: максимум 500 символів.').optional(),
    days: z.array(scheduleDay).max(5, 'Розклад може містити максимум 5 навчальних днів.'),
  }).superRefine((data, context) => {
    const days = new Set<string>();
    data.days.forEach((item, index) => {
      if (days.has(item.day)) {
        context.addIssue({ code: 'custom', path: ['days', index, 'day'], message: 'Цей день тижня вже додано.' });
      }
      days.add(item.day);
    });
    if (data.status === 'published' && data.days.length === 0) {
      context.addIssue({ code: 'custom', path: ['days'], message: 'Перед публікацією додайте хоча б один навчальний день.' });
    }
    if (data.status === 'published' && !data.sourceUrl) {
      context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'Перед публікацією додайте офіційне першоджерело розкладу.' });
    }
  }),
});

const bellLesson = z.object({
  number: z.number({ error: 'Номер уроку має бути числом.' }).int().min(0).max(12),
  start: time,
  end: time,
  breakAfterMinutes: z.number().int().min(0).max(90).optional(),
}).superRefine((data, context) => {
  if (minutesFromMidnight(data.end) <= minutesFromMidnight(data.start)) {
    context.addIssue({ code: 'custom', path: ['end'], message: 'Завершення уроку має бути пізніше за початок.' });
  }
});

const bellSchedules = defineCollection({
  loader: glob({ base: './src/content/bell-schedules', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string({ error: 'Додайте назву групи класів.' }).min(3).max(100),
    slug,
    note: z.string().max(240, 'Примітка задовга.').optional(),
    academicYear,
    updatedAt: z.coerce.date({ error: 'Додайте дату затвердження або оновлення.' }),
    status,
    sourceUrl,
    documentUrl: sourceUrl,
    lessons: z.array(bellLesson).min(1, 'Додайте хоча б один урок.').max(13),
  }).superRefine((data, context) => {
    const numbers = new Set<number>();
    let previousEnd = -1;
    data.lessons.forEach((item, index) => {
      if (numbers.has(item.number)) {
        context.addIssue({ code: 'custom', path: ['lessons', index, 'number'], message: `Номер уроку ${item.number} повторюється.` });
      }
      numbers.add(item.number);
      const start = minutesFromMidnight(item.start);
      if (start < previousEnd) {
        context.addIssue({ code: 'custom', path: ['lessons', index, 'start'], message: 'Уроки мають іти за часом і не перетинатися.' });
      }
      previousEnd = minutesFromMidnight(item.end);
    });
    if (data.status === 'published' && (!data.sourceUrl || !data.documentUrl)) {
      context.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'Перед публікацією додайте офіційну сторінку та документ-першоджерело.' });
    }
  }),
});

export const collections = { news, documents, announcements, galleries, schedules, bellSchedules };
