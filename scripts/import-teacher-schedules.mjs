import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const inputPath = process.argv[2];
const sourceUrl = process.argv[3] ?? 'https://www.hrybovychi-school.com.ua/';

if (!inputPath) {
  throw new Error('Вкажіть шлях до JSON-експорту розкладів учителів.');
}

const input = JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
if (input.schema !== 'nit2.teacher-schedules.v1' || !Array.isArray(input.teachers)) {
  throw new Error('Непідтримуваний формат експорту. Очікується nit2.teacher-schedules.v1.');
}

const outputDirectory = resolve('src/content/schedules');
if (basename(outputDirectory) !== 'schedules') {
  throw new Error(`Неочікуваний каталог призначення: ${outputDirectory}`);
}
mkdirSync(outputDirectory, { recursive: true });

const weekdayByNumber = new Map([[1, 'monday'], [2, 'tuesday'], [3, 'wednesday'], [4, 'thursday'], [5, 'friday']]);
const quote = (value) => JSON.stringify(String(value));
const classNumber = (className) => Number(className.match(/^\d+/)?.[0] ?? 99);
const classSlug = (className) => className.toLowerCase().replace('а', 'a').replace('б', 'b').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const teacherSurname = (fullName) => fullName.trim().split(/\s+/)[0];

function parseBellSchedule(path) {
  const source = readFileSync(path, 'utf8');
  return new Map([...source.matchAll(/- number:\s*(\d+)\s+start:\s*["']([^"']+)["']\s+end:\s*["']([^"']+)["']/g)]
    .map((match) => [Number(match[1]), { start: match[2], end: match[3] }]));
}

const bellSchedules = {
  primary1: parseBellSchedule(resolve('src/content/bell-schedules/grade-1.md')),
  primary24: parseBellSchedule(resolve('src/content/bell-schedules/grades-2-4.md')),
  secondary: parseBellSchedule(resolve('src/content/bell-schedules/grades-5-11.md')),
};

const lessons = input.teachers.flatMap((teacher) => teacher.lessons.map((lesson) => ({ ...lesson, teacher: teacher.name })));
const uniqueIds = new Set(lessons.map((lesson) => lesson.id));
if (uniqueIds.size !== lessons.length) {
  throw new Error('Експорт містить повторювані ID уроків.');
}

const lessonDates = lessons.map((lesson) => lesson.date).sort();
const firstLessonDate = new Date(`${lessonDates[0]}T12:00:00Z`);
const lastLessonDate = new Date(`${lessonDates.at(-1)}T12:00:00Z`);
const monthName = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  .formatToParts(firstLessonDate).find((part) => part.type === 'month')?.value;
const lessonDateRange = firstLessonDate.getUTCMonth() === lastLessonDate.getUTCMonth()
  && firstLessonDate.getUTCFullYear() === lastLessonDate.getUTCFullYear()
  ? `${firstLessonDate.getUTCDate()}–${lastLessonDate.getUTCDate()} ${monthName} ${firstLessonDate.getUTCFullYear()} року`
  : `${lessonDates[0]}–${lessonDates.at(-1)}`;

const classes = Map.groupBy(lessons, (lesson) => lesson.className);
const written = [];

for (const [className, classLessons] of [...classes].sort(([left], [right]) => classNumber(left) - classNumber(right) || left.localeCompare(right, 'uk'))) {
  const grade = classNumber(className);
  const bells = grade === 1 ? bellSchedules.primary1 : grade <= 4 ? bellSchedules.primary24 : bellSchedules.secondary;
  const slots = Map.groupBy(classLessons, (lesson) => `${lesson.date}:${lesson.lesson}`);
  const days = new Map();

  for (const slotLessons of slots.values()) {
    const first = slotLessons[0];
    const date = new Date(`${first.date}T12:00:00Z`);
    const day = weekdayByNumber.get(date.getUTCDay());
    if (!day) continue;
    const subjects = [...new Set(slotLessons.map((lesson) => lesson.subject))];
    const time = bells.get(first.lesson);
    const item = {
      number: first.lesson,
      subject: subjects.length === 1 ? subjects[0] : 'Поділ на групи',
      start: time?.start,
      end: time?.end,
      room: slotLessons.length === 1 ? first.classroom : undefined,
      teacher: subjects.length === 1
        ? [...new Set(slotLessons.map((lesson) => teacherSurname(lesson.teacher)))].join(' / ')
        : undefined,
      groups: subjects.length > 1
        ? [...slotLessons].sort((left, right) => left.subject.localeCompare(right.subject, 'uk')).map((lesson, index) => ({
            name: `Підгрупа ${index + 1}`,
            subject: lesson.subject,
            room: lesson.classroom,
            teacher: teacherSurname(lesson.teacher),
          }))
        : [],
    };
    days.set(day, [...(days.get(day) ?? []), item]);
  }

  const slug = classSlug(className);
  const lines = [
    '---',
    `title: ${quote(`Розклад ${className} класу`)}`,
    `slug: ${slug}`,
    `className: ${quote(`${className} клас`)}`,
    'academicYear: 2026–2027',
    `updatedAt: ${input.generatedAt.slice(0, 10)}`,
    'status: published',
    `sourceUrl: ${quote(sourceUrl)}`,
    `notes: ${quote(`Розклад сформовано з електронного журналу за ${lessonDateRange}. Зміни адміністрації та заміни вчителів можуть оновлюватися окремо.`)}`,
    'days:',
  ];

  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) {
    lines.push(`  - day: ${day}`, '    lessons:');
    for (const lesson of (days.get(day) ?? []).sort((left, right) => left.number - right.number)) {
      lines.push(`      - number: ${lesson.number}`, `        subject: ${quote(lesson.subject)}`);
      if (lesson.start && lesson.end) lines.push(`        start: ${quote(lesson.start)}`, `        end: ${quote(lesson.end)}`);
      if (lesson.room) lines.push(`        room: ${quote(lesson.room)}`);
      if (lesson.teacher) lines.push(`        teacher: ${quote(lesson.teacher)}`);
      if (lesson.groups.length > 0) {
        lines.push('        groups:');
        lesson.groups.forEach((group) => {
          lines.push(`          - name: ${quote(group.name)}`, `            subject: ${quote(group.subject)}`);
          if (group.room) lines.push(`            room: ${quote(group.room)}`);
          if (group.teacher) lines.push(`            teacher: ${quote(group.teacher)}`);
        });
      } else {
        lines.push('        groups: []');
      }
    }
  }

  lines.push('---');

  const output = join(outputDirectory, `${slug}.md`);
  writeFileSync(output, `${lines.join('\n')}\n`, 'utf8');
  written.push({ className, output, lessons: classLessons.length, slots: slots.size });
}

console.log(`Створено ${written.length} розкладів із ${lessons.length} записів.`);
written.forEach((item) => console.log(`${item.className}: ${item.slots} часових позицій (${item.lessons} записів) → ${item.output}`));
