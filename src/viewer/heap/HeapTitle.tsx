import Head from 'next/head';
import { Trans, useTranslation } from 'react-i18next';
import Avatar from '../common/components/Avatar';
import { formatDate } from '../common/util/format';
import { HeapMetadata } from '../proto/spark_pb';

export interface HeapTitleProps {
    metadata: HeapMetadata;
}

export default function HeapTitle({ metadata }: HeapTitleProps) {
    const { t } = useTranslation('heap');
    const { user, generatedTime } = metadata;

    let at = '';
    if (generatedTime) {
        const [timeStr, dateStr] = formatDate(generatedTime);
        at = t('at', { time: timeStr, date: dateStr });
    }

    return (
        <div className="textbox title">
            <Head>
                <title>{t('title', { at })}</title>
            </Head>
            <span>
                <Trans
                    ns="heap"
                    i18nKey="createdBy"
                    values={{ user: user?.name ?? '' }}
                    components={{
                        avatar: (
                            <Avatar user={user} platform={metadata.platform} />
                        ),
                    }}
                />
                {at}
            </span>
        </div>
    );
}
