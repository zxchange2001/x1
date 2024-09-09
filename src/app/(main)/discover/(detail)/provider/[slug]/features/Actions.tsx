'use client';

import { ProviderIcon } from '@lobehub/icons';
import { Tag } from '@lobehub/ui';
import { memo } from 'react';
import { Flexbox, FlexboxProps } from 'react-layout-kit';
import urlJoin from 'url-join';

import { OFFICIAL_URL } from '@/const/url';
import { DiscoverProviderItem } from '@/types/discover';

import ShareButton from '../../../features/ShareButton';
import ConfigProvider from './ConfigProvider';

interface ModelActionsProps extends FlexboxProps {
  data: DiscoverProviderItem;
  identifier: string;
}

const ProviderActions = memo<ModelActionsProps>(({ identifier, data }) => {
  return (
    <Flexbox align={'center'} gap={8} horizontal width={'100%'}>
      <ConfigProvider identifier={identifier} />
      <ShareButton
        meta={{
          avatar: <ProviderIcon provider={identifier} size={64} type={'avatar'} />,
          desc: data.meta.description,
          tags: (
            <Flexbox gap={6} horizontal style={{ flexWrap: 'wrap' }}>
              {data.models
                .slice(0, 3)
                .filter(Boolean)
                .map((tag: string, index) => (
                  <Tag key={index} style={{ margin: 0 }}>
                    {tag}
                  </Tag>
                ))}
              {data.models.length > 3 && <Tag>+{data.models.length - 3}</Tag>}
            </Flexbox>
          ),
          title: data.meta.title,
          url: urlJoin(OFFICIAL_URL, '/discover/provider', identifier),
        }}
      />
    </Flexbox>
  );
});

export default ProviderActions;
