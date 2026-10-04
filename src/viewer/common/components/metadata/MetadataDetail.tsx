import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SparkMetadata } from '../../../proto/guards';
import { PlatformMetadata_Type } from '../../../proto/spark_pb';
import {
    detectOnlineMode,
    objectMap,
    unwrapSamplerMetadata,
} from '../../util/metadata';
import ExtraPlatformMetadata from './tabs/ExtraPlatformMetadata';
import GameRules from './tabs/GameRules';
import JvmStartupArgs from './tabs/JvmStartupArgs';
import MemoryStatistics from './tabs/MemoryStatistics';
import NetworkStatistics from './tabs/NetworkStatistics';
import PlatformStatistics from './tabs/PlatformStatistics';
import PluginsModsList from './tabs/PluginsModsList';
import ServerConfigurations from './tabs/ServerConfigurations';
import WorldStatistics from './tabs/WorldStatistics';

interface MetadataDetailProps {
    metadata: SparkMetadata;
}

export default function MetadataDetail({ metadata }: MetadataDetailProps) {
    const { t } = useTranslation('metadata');
    const {
        platform,
        platformStatistics,
        systemStatistics,
        serverConfigurations,
        extraPlatformMetadata,
    } = metadata;
    const platformType = PlatformMetadata_Type[platform!.type].toLowerCase();

    const { parsedConfigurations, onlineMode } = useMemo(() => {
        let parsedConfigurations: Record<string, any> | undefined;
        let onlineMode: string | undefined;

        if (serverConfigurations && Object.keys(serverConfigurations).length) {
            parsedConfigurations = objectMap(serverConfigurations, v =>
                JSON.parse(v)
            );
        }

        try {
            onlineMode = detectOnlineMode(
                platformStatistics?.onlineMode,
                parsedConfigurations
            );
        } catch (e) {
            // ignore
        }
        return { parsedConfigurations, onlineMode };
    }, [serverConfigurations, platformStatistics]);

    const parsedExtraMetadata = useMemo(() => {
        if (
            extraPlatformMetadata &&
            Object.keys(extraPlatformMetadata).length
        ) {
            return objectMap(extraPlatformMetadata, v => JSON.parse(v));
        }
    }, [extraPlatformMetadata]);

    const { runningTime, numberOfTicks, numberOfIncludedTicks, samplerEngine } =
        unwrapSamplerMetadata(metadata);

    const [view, setView] = useState('platform');
    const views: Record<string, () => boolean> = {
        platform: () => true,
        memory: () =>
            !!platformStatistics?.memory?.heap ||
            !!platformStatistics?.memory?.pools?.length,
        network: () => !!Object.keys(systemStatistics?.net ?? {}).length,
        jvmArgs: () => !!systemStatistics?.java?.vmArgs,
        configurations: () => !!parsedConfigurations,
        world: () =>
            !!platformStatistics?.world &&
            !!platformStatistics?.world?.totalEntities,
        misc: () => !!parsedExtraMetadata,
        gameRules: () => !!platformStatistics?.world?.gameRules.length,
        plugins: () =>
            !!platformStatistics?.world?.dataPacks.length ||
            !!Object.keys(metadata.sources).length,
    };

    return (
        <div className="metadata-detail">
            <div className="header">
                <h2>
                    <FontAwesomeIcon icon={faInfoCircle} /> {t('heading')}
                </h2>
                <p>{t('description')}</p>
            </div>

            <div className="metadata-detail-controls">
                {Object.entries(views).map(([name, func]) => {
                    return (
                        func() && (
                            <div
                                key={name}
                                onClick={() => setView(name)}
                                className={
                                    'textbox' +
                                    (view === name ? ' toggled' : '')
                                }
                            >
                                {t(`tabs.${name}`)}
                            </div>
                        )
                    );
                })}
            </div>

            <div className="metadata-detail-content textbox">
                {view === 'platform' ? (
                    <PlatformStatistics
                        platform={platform!}
                        platformStatistics={platformStatistics!}
                        systemStatistics={systemStatistics}
                        platformType={platformType}
                        onlineMode={onlineMode}
                        runningTime={runningTime}
                        numberOfTicks={numberOfTicks}
                        numberOfIncludedTicks={numberOfIncludedTicks}
                        engine={samplerEngine}
                    />
                ) : view === 'memory' ? (
                    <MemoryStatistics
                        memory={platformStatistics?.memory!}
                        gc={platformStatistics?.gc!}
                    />
                ) : view === 'network' ? (
                    <NetworkStatistics systemStatistics={systemStatistics!} />
                ) : view === 'jvmArgs' ? (
                    <JvmStartupArgs systemStatistics={systemStatistics!} />
                ) : view === 'configurations' ? (
                    <ServerConfigurations
                        parsedConfigurations={parsedConfigurations!}
                    />
                ) : view === 'world' ? (
                    <WorldStatistics
                        worldStatistics={platformStatistics!.world!}
                    />
                ) : view === 'gameRules' ? (
                    <GameRules
                        gameRules={platformStatistics?.world?.gameRules!}
                    />
                ) : view === 'plugins' ? (
                    <PluginsModsList
                        plugins={Object.values(metadata.sources || {})}
                        dataPacks={platformStatistics?.world?.dataPacks || []}
                    />
                ) : view === 'misc' ? (
                    <ExtraPlatformMetadata data={parsedExtraMetadata!} />
                ) : (
                    <p>{t('unknownView')}</p>
                )}
            </div>
        </div>
    );
}
