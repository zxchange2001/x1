'use client';

import { Grid } from '@lobehub/ui';
import { Empty } from 'antd';
import Link from 'next/link';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import urlJoin from 'url-join';

import { DiscoverPlugintem } from '@/types/discover';

import VirtuosoGridList from '../../../components/VirtuosoGridList';
import SearchResultCount from '../../components/SearchResultCount';
import Title from '../../features/Title';
import Card from './Card';

export interface ListProps {
  category?: string;
  items: DiscoverPlugintem[];
  mobile?: boolean;
  searchKeywords?: string;
}

const List = memo<ListProps>(({ category, mobile, searchKeywords, items = [] }) => {
  const { t } = useTranslation('discover');

  const { all, recent, last } = useMemo(() => {
    const recentLength = mobile ? 4 : 8;
    return {
      all: items,
      last: items.slice(recentLength),
      recent: items.slice(0, recentLength),
    };
  }, [items, mobile]);

  if (searchKeywords) {
    if (!items || items?.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    return (
      <>
        <SearchResultCount count={all.length} keyword={searchKeywords} />
        <VirtuosoGridList
          data={all}
          itemContent={(_, item) => (
            <Link href={urlJoin('/discover/plugin/', item.identifier)} key={item.identifier}>
              <Card showCategory variant={'compact'} {...item} />
            </Link>
          )}
          style={{
            height: '100%',
            minHeight: '100vh',
          }}
        />
      </>
    );
  }

  return (
    <>
      <Title>{t('plugins.recentSubmits')}</Title>
      <Grid maxItemWidth={280} rows={4}>
        {recent.map((item) => (
          <Link href={urlJoin('/discover/plugin/', item.identifier)} key={item.identifier}>
            <Card showCategory={!category} {...item} />
          </Link>
        ))}
      </Grid>
      {last && last?.length > 0 && (
        <>
          <Title>{t('plugins.list')}</Title>
          <VirtuosoGridList
            data={last}
            itemContent={(_, item) => (
              <Link href={urlJoin('/discover/plugin/', item.identifier)} key={item.identifier}>
                <Card showCategory={!category} variant={'compact'} {...item} />
              </Link>
            )}
            style={{
              height: '100%',
              minHeight: '100vh',
            }}
          />
        </>
      )}
    </>
  );
});

export default List;
