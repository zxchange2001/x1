'use client';

import { useTranslation } from 'react-i18next';

import FullscreenLoading from '@/components/FullscreenLoading';

const Loading = () => {
  const { t } = useTranslation('common');

  return <FullscreenLoading title={t('appInitializing')} title2={t('await')} />;
};

export default Loading;
