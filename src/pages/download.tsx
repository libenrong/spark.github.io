import { faPlug } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import bukkitLogo from '../assets/logos/bukkit.png';
import bungeeCordLogo from '../assets/logos/bungeecord.png';
import fabricLogo from '../assets/logos/fabric.png';
import foliaLogo from '../assets/logos/folia.png';
import forgeLogo from '../assets/logos/forge.png';
import geyserLogo from '../assets/logos/geyser.png';
import hytaleLogo from '../assets/logos/hytale.png';
import minestomLogo from '../assets/logos/minestom.png';
import neoForgeLogo from '../assets/logos/neoforge.png';
import nukkitLogo from '../assets/logos/nukkit.png';
import spongeLogo from '../assets/logos/sponge.png';
import velocityLogo from '../assets/logos/velocity.png';
import TextBox from '../components/TextBox';
import { env } from '../env';
import useFetchResult, { Status } from '../hooks/useFetchResult';
import changelogStyles from '../style/changelog.module.scss';
import styles from '../style/downloads.module.scss';
import { ChangelogData, ChangelogEntry, ChangelogList } from './changelog';

interface JenkinsInfo {
    artifacts: JenkinsArtifact[];
    timestamp: number;
    url: string;
}

interface JenkinsArtifact {
    fileName: string;
    relativePath: string;
}

interface OldVersion {
    modloader: string;
    curseGameVersionTypeId: number;
    logo: StaticImageData;
    versions: string[];
}

const OLD_VERSIONS: OldVersion[] = [
    {
        modloader: 'Fabric',
        curseGameVersionTypeId: 4,
        logo: fabricLogo,
        versions: [
            '1.21.11',
            '1.21.1',
            '1.20.1',
            '1.19.4',
            '1.18.2',
            '1.17.1',
            '1.16.5',
            '1.15.2',
        ],
    },
    {
        modloader: 'Forge',
        curseGameVersionTypeId: 1,
        logo: forgeLogo,
        versions: [
            '1.21.11',
            '1.21.1',
            '1.20.1',
            '1.19.4',
            '1.18.2',
            '1.17.1',
            '1.16.5',
            '1.15.2',
            '1.12.2',
            '1.7.10',
        ],
    },
    {
        modloader: 'NeoForge',
        curseGameVersionTypeId: 6,
        logo: neoForgeLogo,
        versions: ['1.21.11', '1.21.1', '1.20.6', '1.20.4'],
    },
];

export default function Download() {
    const { t } = useTranslation('pages');
    const [info, status] = useFetchResult<JenkinsInfo>(
        `https://ci.lucko.me/job/spark/lastSuccessfulBuild/api/json?tree=url,timestamp,artifacts[fileName,relativePath]`
    );

    const [changelog] = useFetchResult<ChangelogData>(
        `${env.NEXT_PUBLIC_SPARK_API_URL}/changelog`
    );

    let content;
    if (status !== Status.ERROR) {
        content = <DownloadPage info={info} changelog={changelog} />;
    } else {
        content = <TextBox>{t('downloads.error')}</TextBox>;
    }

    return (
        <article className={styles.downloads}>
            <h1>{t('downloads.heading')}</h1>
            {content}
        </article>
    );
}

interface ArtifactsMap {
    [key: string]: {
        fileName: string;
        url: string;
    };
}

const processJenkinsInfo = (
    info: JenkinsInfo | undefined,
    unknown: string
): [string, string, ArtifactsMap] => {
    const artifacts: ArtifactsMap = {};
    let version = unknown;
    const timestamp = info
        ? new Date(info?.timestamp).toLocaleString()
        : unknown;
    for (const { fileName, relativePath } of info?.artifacts || []) {
        const [v, platform] = fileName.slice(0, -4).split('-').slice(1);
        version = v;
        artifacts[platform] = {
            fileName,
            url: info!.url + 'artifact/' + relativePath,
        };
    }
    return [version, timestamp, artifacts];
};

const DownloadPage = ({
    info,
    changelog,
}: {
    info?: JenkinsInfo;
    changelog?: ChangelogData;
}) => {
    const { t } = useTranslation('pages');
    const [version, timestamp, artifacts] = processJenkinsInfo(
        info,
        t('downloads.unknown')
    );
    const changelogSlice = changelog?.changelog?.slice(0, 5) || [];

    return (
        <>
            <p>
                <Trans
                    ns="pages"
                    i18nKey="downloads.latest"
                    values={{ version, timestamp }}
                    components={{
                        version: <span className="version-number" />,
                    }}
                />
            </p>
            <br />

            <DownloadButtons artifacts={artifacts} />

            <br />
            <p>
                <Trans
                    ns="pages"
                    i18nKey="downloads.docs"
                    components={{
                        link: (
                            <a
                                href={`${env.NEXT_PUBLIC_SPARK_BASE_URL}/docs`}
                            />
                        ),
                    }}
                />
            </p>
            <p className="caveat">{t('downloads.paperNote')}</p>

            <h2>{t('downloads.otherPlatforms.title')}</h2>
            <p>
                <Trans
                    ns="pages"
                    i18nKey="downloads.otherPlatforms.intro"
                    components={{
                        link: (
                            <a href="https://github.com/lucko/spark-extra-platforms" />
                        ),
                    }}
                />
            </p>
            <ExtraDownloadButtons />

            <h2>{t('downloads.recentChanges.title')}</h2>
            <RecentChangelog changelog={changelogSlice} />

            <h2>{t('downloads.olderVersions.title')}</h2>
            <p>{t('downloads.olderVersions.intro')}</p>
            <OlderVersionsList versions={OLD_VERSIONS} />
            <p>{t('downloads.olderVersions.note')}</p>
        </>
    );
};

const RecentChangelog = ({ changelog }: { changelog: ChangelogEntry[] }) => {
    const { t } = useTranslation('pages');
    const { t: tc } = useTranslation('common');

    if (changelog.length === 0) {
        return <p>{tc('loading')}</p>;
    }

    return (
        <div className={changelogStyles.changelog}>
            <ChangelogList entries={changelog} />
            <p>
                <Trans
                    ns="pages"
                    i18nKey="downloads.recentChanges.more"
                    components={{ link: <Link href={'changelog'} /> }}
                />
            </p>
        </div>
    );
};

const DownloadButtons = ({ artifacts }: { artifacts: ArtifactsMap }) => {
    function getUrl(artifact: string) {
        const { url } = Object.keys(artifacts).length
            ? artifacts[artifact]
            : { url: '#' };
        return url;
    }

    return (
        <div className="download-buttons">
            <DownloadInfo
                name="Bukkit"
                comment="Paper/Spigot"
                url={getUrl('bukkit')}
                logo={bukkitLogo}
            />
            <DownloadInfo
                name="BungeeCord"
                url={getUrl('bungeecord')}
                logo={bungeeCordLogo}
            />
            <DownloadInfo
                name="Velocity"
                url={getUrl('velocity')}
                logo={velocityLogo}
            />
            <DownloadInfo
                name="Fabric"
                comment="MC 26.2"
                url={getUrl('fabric')}
                logo={fabricLogo}
            />
            <DownloadInfo
                name="NeoForge"
                comment="MC 26.2"
                url={getUrl('neoforge')}
                logo={neoForgeLogo}
            />
            <DownloadInfo
                name="Forge"
                comment="MC 26.2"
                url={getUrl('forge')}
                logo={forgeLogo}
            />
            <DownloadInfo
                name="Sponge"
                comment="API 12"
                url={getUrl('sponge')}
                logo={spongeLogo}
            />
            <DownloadInfo
                name="Standalone"
                comment="Java Agent"
                url={getUrl('standalone')}
                icon={<FontAwesomeIcon fixedWidth={true} icon={faPlug} />}
            />
        </div>
    );
};

const ExtraDownloadButtons = () => {
    return (
        <div className="download-buttons extra-download-buttons">
            <DownloadInfo
                name="Hytale"
                url="https://www.curseforge.com/hytale/mods/spark"
                logo={hytaleLogo}
            />
            <DownloadInfo
                name="Folia"
                url="https://ci.lucko.me/job/spark-extra-platforms/"
                logo={foliaLogo}
                width={100}
            />
            <DownloadInfo
                name="Geyser"
                url="https://ci.lucko.me/job/spark-extra-platforms/"
                logo={geyserLogo}
                width={70}
            />
            <DownloadInfo
                name="Minestom"
                url="https://ci.lucko.me/job/spark-extra-platforms/"
                logo={minestomLogo}
            />
            <DownloadInfo
                name="Nukkit"
                url="https://ci.lucko.me/job/spark-extra-platforms/"
                logo={nukkitLogo}
            />
        </div>
    );
};

interface DownloadInfoProps {
    name: string;
    comment?: string;
    url: string;
    logo?: StaticImageData;
    icon?: ReactNode;
    width?: number;
}

const DownloadInfo = ({
    name,
    comment,
    url,
    logo,
    icon,
    width,
}: DownloadInfoProps) => {
    const { t } = useTranslation('pages');
    return (
        <a className="link" href={url}>
            {logo && (
                <Image
                    src={logo}
                    style={{ objectFit: 'contain' }}
                    width={width ?? 50}
                    height={50}
                    alt={t('downloads.logoAlt', { name })}
                />
            )}
            {icon}
            <div className="link-title">
                <div className="link-name">
                    <h3>{name}</h3>
                    {comment && <span> ({comment})</span>}
                </div>
            </div>
        </a>
    );
};

const OlderVersionsList = ({ versions }: { versions: OldVersion[] }) => {
    const { t } = useTranslation('pages');
    return (
        <div className="older-versions">
            {versions.map(oldVersion => {
                const getUrl = (version: string) => {
                    return `https://www.curseforge.com/minecraft/mc-mods/spark/files?gameVersionTypeId=${oldVersion.curseGameVersionTypeId}&version=${version}&showAlphaFiles=show`;
                };

                return (
                    <div key={oldVersion.modloader}>
                        <h3>
                            <Image
                                src={oldVersion.logo}
                                style={{
                                    objectFit: 'contain',
                                    verticalAlign: 'middle',
                                }}
                                width={40}
                                height={40}
                                alt={t('downloads.logoAlt', {
                                    name: oldVersion.modloader,
                                })}
                            />{' '}
                            {oldVersion.modloader}
                        </h3>
                        <hr />
                        <ul>
                            {oldVersion.versions.map(version => (
                                <li key={version}>
                                    <a
                                        href={getUrl(version)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {version}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
};
