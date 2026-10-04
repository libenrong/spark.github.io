import FilePicker from '../components/FilePicker';

import NextLink from 'next/link';

import {
    faArrowCircleDown,
    faBook,
    faHeartbeat,
    faMemory,
    faMicrochip,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { ReactNode, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { HomepageHeader } from '../components/Header';
import SparkLayout from '../components/SparkLayout';
import { NextPageWithLayout, SelectedFileContext } from './_app';

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { env } from '../env';
import styles from '../style/homepage.module.scss';

const Index: NextPageWithLayout = () => {
    const { setSelectedFile } = useContext(SelectedFileContext);
    const router = useRouter();

    function onFileSelected(file: File) {
        setSelectedFile(file);
        router.push('/_');
    }

    return (
        <article className={styles.homepage}>
            <Navigation />
            <AboutSection />
            <ViewerSection onFileSelected={onFileSelected} />
        </article>
    );
};

const Navigation = () => {
    const { t } = useTranslation('pages');
    return (
        <nav>
            <Link
                title={t('nav.downloads.title')}
                icon={faArrowCircleDown}
                url="/download"
            >
                {t('nav.downloads.description')}
            </Link>
            <Link
                title={t('nav.docs.title')}
                icon={faBook}
                url={env.NEXT_PUBLIC_SPARK_DOCS_URL}
            >
                {t('nav.docs.description')}
            </Link>
        </nav>
    );
};

interface LinkProps {
    title: string;
    icon: IconProp;
    url: string;
    children: ReactNode;
}

const Link = ({ title, icon, url, children }: LinkProps) => {
    return (
        <NextLink href={url} className="link">
            <div className="link-title">
                <FontAwesomeIcon icon={icon} fixedWidth />
                <h3>{title}</h3>
            </div>
            <div className="link-description">{children}</div>
        </NextLink>
    );
};

const AboutSection = () => {
    const { t } = useTranslation('pages');
    return (
        <section>
            <h2>{t('about.heading')}</h2>
            <p>{t('about.intro')}</p>
            <AboutFeature
                title={t('features.profiler.title')}
                icon={faMicrochip}
            >
                {t('features.profiler.description')}
            </AboutFeature>
            <AboutFeature title={t('features.memory.title')} icon={faMemory}>
                {t('features.memory.description')}
            </AboutFeature>
            <AboutFeature title={t('features.health.title')} icon={faHeartbeat}>
                {t('features.health.description')}
            </AboutFeature>

            <p>
                <Trans
                    ns="pages"
                    i18nKey="about.links"
                    components={{
                        github: <a href="https://github.com/lucko/spark" />,
                        discord: <a href="https://discord.gg/PAGT2fu" />,
                    }}
                />
            </p>
        </section>
    );
};

interface AboutFeatureProps {
    title: string;
    icon: IconProp;
    children: ReactNode;
}

const AboutFeature = ({ title, icon, children }: AboutFeatureProps) => {
    return (
        <div className="feature">
            <FontAwesomeIcon icon={icon} fixedWidth />
            <div>
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    );
};

const ViewerSection = ({
    onFileSelected,
}: {
    onFileSelected: (file: File) => void;
}) => {
    const { t } = useTranslation('pages');
    return (
        <section>
            <h2>{t('viewer.heading')}</h2>
            <p>{t('viewer.intro')}</p>
            <p>{t('viewer.usageIntro')}</p>
            <ol>
                <li>
                    <Trans
                        ns="pages"
                        i18nKey="viewer.steps.step1"
                        components={{
                            profile: (
                                <a
                                    href={`${env.NEXT_PUBLIC_SPARK_BASE_URL}/docs/Command-Usage#spark-profiler`}
                                />
                            ),
                            heapSummary: (
                                <a
                                    href={`${env.NEXT_PUBLIC_SPARK_BASE_URL}/docs/Command-Usage#spark-heapsummary`}
                                />
                            ),
                        }}
                    />
                </li>
                <li>{t('viewer.steps.step2')}</li>
            </ol>
            <p>
                <Trans ns="pages" i18nKey="viewer.localFiles" />
            </p>
            <FilePicker callback={onFileSelected} />
            <p>{t('viewer.opensource')}</p>
        </section>
    );
};

Index.getLayout = page => (
    <SparkLayout header={<HomepageHeader />}>{page}</SparkLayout>
);

export default Index;
