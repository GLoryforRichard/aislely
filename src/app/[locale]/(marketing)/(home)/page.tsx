import AislelyLanding from '@/components/aislely/AislelyLanding';
import CrispChat from '@/components/chatbox/crisp-chat';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '',
  });
}

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

// Aislely landing replaces the stock MkSaaS marketing blocks.
export default async function HomePage(_props: HomePageProps) {
  return (
    <>
      <AislelyLanding />
      <CrispChat />
    </>
  );
}
