import { Trans, useTranslation } from 'react-i18next';
import {
    PlatformMetadata,
    PlatformStatistics as PlatformStatisticsProto,
    SamplerMetadata_SamplerEngine,
    SystemStatistics as SystemStatisticsProto,
} from '../../../../proto/spark_pb';
import { formatDuration } from '../../../util/format';

export interface PlatformStatisticsProps {
    platform: PlatformMetadata;
    platformStatistics: PlatformStatisticsProto;
    systemStatistics?: SystemStatisticsProto;
    platformType: string;
    onlineMode?: string;
    runningTime?: number;
    numberOfTicks?: number;
    numberOfIncludedTicks?: number;
    engine?: SamplerMetadata_SamplerEngine;
}

export default function PlatformStatistics({
    platform,
    platformStatistics,
    systemStatistics,
    platformType,
    onlineMode,
    runningTime,
    numberOfTicks,
    numberOfIncludedTicks,
    engine,
}: PlatformStatisticsProps) {
    const { t } = useTranslation('metadata');
    const platformTypeLabel = t(`platformType.${platformType}`);

    return (
        <>
            <p>
                <Trans
                    ns="metadata"
                    i18nKey={
                        platformType === 'application'
                            ? 'platform.introSystem'
                            : 'platform.intro'
                    }
                    values={{
                        brand: platform.brand || platform.name,
                        platformType: platformTypeLabel,
                        version: platform.version,
                    }}
                    components={{ brand: <span />, version: <span /> }}
                />
            </p>
            {platform.minecraftVersion && (
                <p>
                    <Trans
                        ns="metadata"
                        i18nKey="platform.minecraftVersion"
                        values={{ version: platform.minecraftVersion }}
                        components={{ version: <span /> }}
                    />
                </p>
            )}
            {onlineMode && (
                <p>
                    <Trans
                        ns="metadata"
                        i18nKey="platform.onlineMode"
                        values={{
                            platformType: platformTypeLabel,
                            onlineMode: t(`common:onlineMode.${onlineMode}`),
                        }}
                        components={{ mode: <span /> }}
                    />
                </p>
            )}
            {platformStatistics?.playerCount > 0 && (
                <p>
                    <Trans
                        ns="metadata"
                        i18nKey="platform.playerCount"
                        values={{
                            platformType: platformTypeLabel,
                            count: platformStatistics.playerCount,
                        }}
                        components={{ count: <span /> }}
                    />
                </p>
            )}
            {!!systemStatistics && (
                <SystemStatistics systemStatistics={systemStatistics} />
            )}
            {runningTime && (
                <p>
                    <Trans
                        ns="metadata"
                        i18nKey="platform.profilerRun"
                        values={{
                            engine: engine
                                ? t(
                                      engine ==
                                          SamplerMetadata_SamplerEngine.ASYNC
                                          ? 'platform.engineAsync'
                                          : 'platform.engineJava'
                                  )
                                : '',
                            duration: formatDuration(runningTime),
                        }}
                        components={{ duration: <span /> }}
                    />
                    {!!numberOfTicks && (
                        <Trans
                            ns="metadata"
                            i18nKey="platform.profilerTicks"
                            values={{ count: numberOfTicks }}
                            components={{ count: <span /> }}
                        />
                    )}
                    {!!numberOfIncludedTicks ? (
                        <Trans
                            ns="metadata"
                            i18nKey="platform.profilerExceeded"
                            values={{ count: numberOfIncludedTicks }}
                            components={{ count: <span /> }}
                        />
                    ) : (
                        t('punctuation.dot')
                    )}
                </p>
            )}
        </>
    );
}

interface SystemStatisticsProps {
    systemStatistics: SystemStatisticsProto;
}

const SystemStatistics = ({ systemStatistics }: SystemStatisticsProps) => {
    const { t } = useTranslation('metadata');
    return (
        <>
            <p>
                <Trans
                    ns="metadata"
                    i18nKey="platform.os"
                    values={{
                        os: systemStatistics.os!.name,
                        arch: systemStatistics.os!.arch,
                        version: systemStatistics.os!.version,
                        threads: systemStatistics.cpu!.threads,
                    }}
                    components={{
                        os: <span />,
                        arch: <span />,
                        version: <span />,
                        threads: <span />,
                    }}
                />
            </p>
            {systemStatistics.cpu!.modelName && (
                <p>
                    <Trans
                        ns="metadata"
                        i18nKey="platform.cpu"
                        values={{ model: systemStatistics.cpu!.modelName }}
                        components={{ model: <span /> }}
                    />
                </p>
            )}
            <p>
                <Trans
                    ns="metadata"
                    i18nKey="platform.java"
                    values={{
                        version: systemStatistics.java!.version,
                        vendorVersion: systemStatistics.java!.vendorVersion,
                        vendor: systemStatistics.java!.vendor,
                    }}
                    components={{
                        version: <span />,
                        vendorVersion: <span />,
                        vendor: <span />,
                    }}
                />
                {systemStatistics.jvm?.name && (
                    <Trans
                        ns="metadata"
                        i18nKey="platform.jvm"
                        values={{ name: systemStatistics.jvm?.name }}
                        components={{ name: <span /> }}
                    />
                )}
            </p>
            <p>
                <Trans
                    ns="metadata"
                    i18nKey="platform.uptime"
                    values={{
                        duration: formatDuration(systemStatistics.uptime),
                    }}
                    components={{ duration: <span /> }}
                />
            </p>
        </>
    );
};
