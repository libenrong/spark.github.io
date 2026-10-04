import Head from 'next/head';
import { Trans, useTranslation } from 'react-i18next';
import Avatar from '../common/components/Avatar';
import { formatDate } from '../common/util/format';
import { HealthMetadata } from '../proto/spark_pb';

export interface HealthTitleProps {
    metadata: HealthMetadata;
}

export default function HealthTitle({ metadata }: HealthTitleProps) {
    const { t } = useTranslation('health');
    const { user, generatedTime } = metadata;

    const [timeStr, dateStr] = formatDate(generatedTime);

    return (
        <div className="textbox title">
            <Head>
                <title>{t('title', { time: timeStr, date: dateStr })}</title>
            </Head>
            <span>
                <Trans
                    ns="health"
                    i18nKey="createdBy"
                    values={{ user: user?.name ?? '' }}
                    components={{
                        avatar: (
                            <Avatar user={user} platform={metadata.platform} />
                        ),
                    }}
                />
                {t('at', { time: timeStr, date: dateStr })}
            </span>
        </div>
    );
}
