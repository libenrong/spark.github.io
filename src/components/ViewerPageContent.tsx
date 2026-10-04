import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { env } from '../env';
import SparkLayout from './SparkLayout';
import TextBox from './TextBox';

const SparkViewer = dynamic(() => import('../viewer/SparkViewer'));

export interface ViewerPageProps {
    code: string;
}

/**
 * Shared content for the profile viewer page. Used by the dynamic `[code]`
 * route (server / client navigation) and by the 404 page (static export
 * fallback, where the code is read from the pathname instead).
 */
export default function ViewerPageContent({ code }: ViewerPageProps) {
    const { t } = useTranslation('common');
    const { t: tp } = useTranslation('pages');
    return (
        <>
            {code !== '_' && (
                <ThumbnailMetaTags
                    code={code}
                    title={tp('viewerPage.title', { code })}
                />
            )}
            <Suspense
                fallback={
                    <SparkLayout>
                        <TextBox>{t('loading')}</TextBox>
                    </SparkLayout>
                }
            >
                <SparkViewer code={code} />
            </Suspense>
        </>
    );
}

const ThumbnailMetaTags = ({
    code,
    title,
}: ViewerPageProps & { title: string }) => {
    return (
        <Head>
            <title>{title}</title>
            <meta
                property="og:image"
                content={`${env.NEXT_PUBLIC_SPARK_BASE_URL}/thumb/${code}.png`}
                key="og-image"
            />
            <meta
                name="twitter:image"
                content={`${env.NEXT_PUBLIC_SPARK_BASE_URL}/thumb/${code}.png`}
                key="twitter-image"
            />
            <meta name="twitter:card" content="summary_large_image" />
        </Head>
    );
};
