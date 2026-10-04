import {
    faClock,
    faDatabase,
    faGamepad,
    faServer,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import SparkLogo from '../../../assets/spark-logo.svg';
import styles from '../../../style/thumbnail.module.scss';
import { SparkMetadata } from '../../proto/guards';
import {
    PlatformMetadata_Type,
    SamplerMetadata_SamplerMode,
} from '../../proto/spark_pb';
import { SparkContentType } from '../logic/contentType';
import { formatDuration } from '../util/format';
import { unwrapDateMetadata, unwrapSamplerMetadata } from '../util/metadata';
import Avatar from './Avatar';
import Widgets from './widgets/Widgets';

export interface ThumbnailProps {
    metadata: SparkMetadata;
    code: string;
    type: SparkContentType;
}

export default function Thumbnail({ metadata, code, type }: ThumbnailProps) {
    const { t } = useTranslation('common');
    const ref = useRef<HTMLDivElement>(null);

    // override the css of body/#root to fix a specific size
    useEffect(() => {
        const rootElement = ref.current!.parentElement!;
        rootElement.style.minHeight = 'unset';
        rootElement.style.width = '100%';
        rootElement.style.height = '100%';

        const bodyElement = rootElement.parentElement!;
        bodyElement.style.width = '1200px';
        bodyElement.style.height = '600px';

        const htmlElement = bodyElement.parentElement!;
        htmlElement.style.backgroundColor = '#fff';
    }, []);

    let { platform, platformStatistics } = metadata;

    if (!platform) {
        platform = {
            minecraftVersion: '',
            sparkVersion: 0,
            name: t('thumbnail.unknown'),
            brand: t('thumbnail.unknown'),
            version: t('thumbnail.unknownVersion'),
            type: 0,
        };
    }

    const platformType = PlatformMetadata_Type[platform.type].toLowerCase();

    const contentTypeKey = {
        'application/x-spark-sampler': 'profile',
        'application/x-spark-heap': 'heapSummary',
        'application/x-spark-health': 'healthReport',
    }[type];

    const { runningTime, numberOfTicks, samplerMode } =
        unwrapSamplerMetadata(metadata);

    const { time, date } = unwrapDateMetadata(metadata);

    return (
        <div ref={ref} className={classNames('thumbnail', styles.thumbnail)}>
            <div>
                <h1>spark {t(`thumbnail.${contentTypeKey}`)}</h1>
                <h2>/{code}</h2>
            </div>

            {!!platformStatistics && (
                <Widgets metadata={metadata} expanded={true}></Widgets>
            )}

            <div className="stats">
                {samplerMode === SamplerMetadata_SamplerMode.ALLOCATION && (
                    <p>
                        <FontAwesomeIcon fixedWidth={true} icon={faDatabase} />{' '}
                        <Trans
                            ns="common"
                            i18nKey="thumbnail.allocProfile"
                            components={{ span: <span /> }}
                        />
                    </p>
                )}
                <p>
                    <FontAwesomeIcon fixedWidth={true} icon={faServer} />{' '}
                    <span>{platform.brand || platform.name}</span>{' '}
                    {t(`thumbnail.platformType.${platformType}`)} &quot;
                    <span>{platform.version}</span>&quot;
                </p>
                {!!platformStatistics?.playerCount && (
                    <p>
                        <FontAwesomeIcon fixedWidth={true} icon={faGamepad} />{' '}
                        <Trans
                            ns="common"
                            i18nKey="thumbnail.playersOnline"
                            values={{ count: platformStatistics.playerCount }}
                            components={{ span: <span /> }}
                        />
                    </p>
                )}
                {runningTime && (
                    <p>
                        <FontAwesomeIcon fixedWidth={true} icon={faClock} />{' '}
                        <Trans
                            ns="common"
                            i18nKey="thumbnail.duration"
                            values={{
                                duration: formatDuration(runningTime),
                            }}
                            components={{ span: <span /> }}
                        />
                        {!!numberOfTicks && (
                            <Trans
                                ns="common"
                                i18nKey="thumbnail.ticks"
                                values={{ count: numberOfTicks }}
                                components={{ span: <span /> }}
                            />
                        )}
                    </p>
                )}
            </div>

            <div className="footer">
                <p>
                    <Trans
                        ns="common"
                        i18nKey="thumbnail.uploadedBy"
                        values={{ name: metadata.user?.name }}
                        components={{
                            avatar: (
                                <Avatar
                                    user={metadata.user}
                                    platform={metadata.platform}
                                />
                            ),
                        }}
                    />
                    {time && <> {t('thumbnail.at', { date, time })}</>}
                </p>
                <SparkLogo alt="" width="65px" height="65px" />
            </div>
        </div>
    );
}
