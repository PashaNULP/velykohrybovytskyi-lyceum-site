import { getCollection, type CollectionEntry } from 'astro:content';

type WithSlug = { data: { slug: string } };

function assertUniqueSlugs<T extends WithSlug>(entries: T[], collectionName: string): void {
  const slugs = new Set<string>();
  for (const entry of entries) {
    if (slugs.has(entry.data.slug)) {
      throw new Error(`Колекція ${collectionName} містить повторний slug: ${entry.data.slug}`);
    }
    slugs.add(entry.data.slug);
  }
}

export async function getPublishedNews(now = new Date()): Promise<CollectionEntry<'news'>[]> {
  const entries = await getCollection('news', ({ data }) => data.status === 'published' && data.publishedAt <= now);
  assertUniqueSlugs(entries, 'news');
  return entries.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getPublishedDocuments(): Promise<CollectionEntry<'documents'>[]> {
  const entries = await getCollection('documents', ({ data }) => data.status === 'published');
  assertUniqueSlugs(entries, 'documents');
  return entries.sort((a, b) => (b.data.documentDate?.valueOf() ?? 0) - (a.data.documentDate?.valueOf() ?? 0));
}

export async function getActiveAnnouncements(now = new Date()): Promise<CollectionEntry<'announcements'>[]> {
  const entries = await getCollection(
    'announcements',
    ({ data }) => data.status === 'published' && data.publishedAt <= now && (!data.expiresAt || data.expiresAt >= now),
  );
  assertUniqueSlugs(entries, 'announcements');
  return entries.sort((a, b) => Number(b.data.important) - Number(a.data.important) || b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getPublishedAnnouncements(now = new Date()): Promise<CollectionEntry<'announcements'>[]> {
  const entries = await getCollection(
    'announcements',
    ({ data }) => data.status === 'published' && data.publishedAt <= now,
  );
  assertUniqueSlugs(entries, 'announcements');
  return entries.sort(
    (a, b) => Number(b.data.important) - Number(a.data.important)
      || b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}

export async function getPublishedGalleries(): Promise<CollectionEntry<'galleries'>[]> {
  const entries = await getCollection('galleries', ({ data }) => data.status === 'published');
  assertUniqueSlugs(entries, 'galleries');
  return entries.sort((a, b) => (b.data.date?.valueOf() ?? 0) - (a.data.date?.valueOf() ?? 0));
}

export const formatDate = (date: Date) => new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
