import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import { Trans, useTranslation } from 'react-i18next';
import TextBox from '../components/TextBox';
import { env } from '../env';
import useFetchResult, { Status } from '../hooks/useFetchResult';
import styles from '../style/changelog.module.scss';

dayjs.extend(relativeTime);

export interface ChangelogData {
    changelog?: ChangelogEntry[];
}

export interface ChangelogEntry {
    version: string;
    timestamp: number;
    title: string;
    commit: string;
}

export default function Changelog() {
    const { t } = useTranslation('pages');
    const [info, status] = useFetchResult<ChangelogData>(
        `${env.NEXT_PUBLIC_SPARK_API_URL}/changelog`
    );

    let content;
    if (status !== Status.ERROR) {
        content = <ChangelogPage info={info} />;
    } else {
        content = <TextBox>{t('changelog.error')}</TextBox>;
    }

    return (
        <article className={styles.changelog}>
            <h1>{t('changelog.heading')}</h1>
            {content}
        </article>
    );
}

const ChangelogPage = ({ info }: { info?: ChangelogData }) => {
    const changelog = info?.changelog || [];
    return (
        <>
            <p>
                <Trans
                    ns="pages"
                    i18nKey="changelog.intro"
                    components={{
                        repo: <a href="https://github.com/lucko/spark" />,
                    }}
                />
            </p>
            <p>
                <Trans
                    ns="pages"
                    i18nKey="changelog.downloadsLink"
                    components={{ link: <Link href={'download'} /> }}
                />
            </p>
            <br />
            <ChangelogList entries={changelog} />
        </>
    );
};

export const ChangelogList = ({ entries }: { entries: ChangelogEntry[] }) => {
    return (
        <ul>
            {entries.map((entry, i) => (
                <ChangelogItem key={i} entry={entry} />
            ))}
        </ul>
    );
};

const ChangelogItem = ({ entry }: { entry: ChangelogEntry }) => {
    return (
        <li>
            <span>
                <a
                    href={`https://github.com/lucko/spark/commit/${entry.commit}`}
                >
                    <code>{entry.version}</code>
                </a>
                <span className="title">{entry.title}</span>
            </span>
            <span
                className="time"
                title={new Date(entry.timestamp * 1000).toString()}
            >
                {dayjs(entry.timestamp * 1000).fromNow()}
            </span>
        </li>
    );
};
