import rss from '@astrojs/rss';
import { getPublishedNews } from '../lib/content';

export async function GET(context: { site: URL }) {
  const news = await getPublishedNews();
  return rss({
    title: 'Новини Великогрибовицького ліцею',
    description: 'Опубліковані новини та події Великогрибовицького ліцею Львівської міської ради.',
    site: context.site,
    customData: '<language>uk-UA</language>',
    items: news.map((item) => ({
      title: item.data.title,
      description: item.data.summary,
      pubDate: item.data.publishedAt,
      link: `/novyny/${item.data.slug}/`,
    })),
  });
}
