import urlJoin from 'url-join';

import StructuredData from '@/components/StructuredData';
import { ldModule } from '@/server/ld';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { discoverService } from '@/services/discover';
import { PluginCategory } from '@/types/discover';
import { isMobileDevice } from '@/utils/responsive';

import List from '../features/List';

type Props = { params: { slug: PluginCategory }; searchParams: { hl?: string } };

export const generateMetadata = async ({ params, searchParams }: Props) => {
  const { t } = await translation('metadata', searchParams?.hl);
  const { t: td } = await translation('discover', searchParams?.hl);

  return metadataModule.generate({
    description: t('discover.plugins.description'),
    title: [td(`category.plugin.${params.slug}`), t('discover.plugins.title')].join(' · '),
    url: urlJoin('/discover/plugins', params.slug),
  });
};

const Page = async ({ params, searchParams }: Props) => {
  const { t, locale } = await translation('metadata', searchParams?.hl);
  const { t: td } = await translation('discover', searchParams?.hl);
  const mobile = isMobileDevice();

  const items = await discoverService.getPluginCategory(locale, params.slug);

  const ld = ldModule.generate({
    description: t('discover.plugins.description'),
    title: [td(`category.plugin.${params.slug}`), t('discover.plugins.title')].join(' · '),
    url: urlJoin('/discover/plugins', params.slug),
    webpage: {
      enable: true,
      search: true,
    },
  });

  return (
    <>
      <StructuredData ld={ld} />
      <List category={params.slug} items={items} mobile={mobile} />
    </>
  );
};

export const generateStaticParams = async () => {
  const cates = Object.values(PluginCategory);
  return cates.map((cate) => ({
    slug: cate,
  }));
};

Page.DisplayName = 'DiscoverToolsCategory';

export default Page;
