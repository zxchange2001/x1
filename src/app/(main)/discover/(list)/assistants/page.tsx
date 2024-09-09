import StructuredData from '@/components/StructuredData';
import { ldModule } from '@/server/ld';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { discoverService } from '@/services/discover';
import { isMobileDevice } from '@/utils/responsive';

import List from './features/List';

type Props = { searchParams: { hl?: string } };

export const generateMetadata = async ({ searchParams }: Props) => {
  const { t } = await translation('metadata', searchParams?.hl);
  return metadataModule.generate({
    description: t('discover.assistants.description'),
    title: t('discover.assistants.title'),
    url: '/discover/assistants',
  });
};

const Page = async ({ searchParams }: Props) => {
  const { t, locale } = await translation('metadata', searchParams?.hl);
  const mobile = isMobileDevice();

  const items = await discoverService.getAssistantList(locale);

  const ld = ldModule.generate({
    description: t('discover.assistants.description'),
    title: t('discover.assistants.title'),
    url: '/discover/assistants',
    webpage: {
      enable: true,
      search: true,
    },
  });

  return (
    <>
      <StructuredData ld={ld} />
      <List items={items} mobile={mobile} />
    </>
  );
};

Page.DisplayName = 'DiscoverAssistants';

export default Page;
