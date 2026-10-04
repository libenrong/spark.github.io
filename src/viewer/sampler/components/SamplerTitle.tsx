import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import Avatar from '../../common/components/Avatar';
import { formatBytesShort, formatDate } from '../../common/util/format';
import {
    SamplerMetadata,
    SamplerMetadata_DataAggregator_Type,
    SamplerMetadata_SamplerMode,
} from '../../proto/spark_pb';

export interface SamplerTitleProps {
    metadata: SamplerMetadata;
}

export default function SamplerTitle({ metadata }: SamplerTitleProps) {
    const { t } = useTranslation('sampler');
    const { user, startTime, interval, dataAggregator } = metadata;

    const comment = metadata.comment
        ? t('title.comment', { comment: metadata.comment })
        : '';
    const [startTimeStr, startDateStr] = formatDate(startTime);

    let ticksOver = '';
    if (
        dataAggregator &&
        dataAggregator.type === SamplerMetadata_DataAggregator_Type.TICKED
    ) {
        ticksOver = t('title.ticksOver', {
            n: dataAggregator.tickLengthThreshold / 1000,
        });
    }

    const alloc =
        metadata.samplerMode === SamplerMetadata_SamplerMode.ALLOCATION;
    const title = alloc ? t('title.memoryProfile') : t('title.profile');
    const formattedInterval = alloc
        ? formatBytesShort(interval)
        : `${interval / 1000}ms`;

    return (
        <div className="textbox title">
            <Head>
                <title>
                    {t('title.document', {
                        title,
                        time: startTimeStr,
                        date: startDateStr,
                    })}
                </title>
            </Head>
            <span>
                {comment}
                <Avatar user={user} platform={metadata.platform} />
                {t('title.heading', {
                    user: user?.name ?? '',
                    time: startTimeStr,
                    date: startDateStr,
                    interval: formattedInterval,
                    ticksOver,
                })}
            </span>
        </div>
    );
}
