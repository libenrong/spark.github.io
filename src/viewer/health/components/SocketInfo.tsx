import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import TextBox from '../../../components/TextBox';
import styles from '../../../style/sampler.module.scss';
import { SocketBinding } from '../hooks/useSocketBindings';

export interface SocketInfoProps {
    socket: SocketBinding;
}

export default function SocketInfo({ socket }: SocketInfoProps) {
    const { t } = useTranslation('health');
    const { clientId, settings, latency } = socket.socket;

    return (
        <TextBox extraClassName={styles['socket-info']}>
            <h2>
                <FontAwesomeIcon icon={faCloud} />{' '}
                <Trans
                    ns="health"
                    i18nKey="socket.connected"
                    components={{ b: <b /> }}
                />
            </h2>
            <p>
                {t('socket.description')}
                <br />
                {t('socket.statisticsInterval', {
                    n: settings?.statisticsInterval ?? '?',
                })}
            </p>
            <p>
                <Trans
                    ns="health"
                    i18nKey="socket.latency"
                    values={{ n: latency ?? '?' }}
                    components={{ b: <b /> }}
                />
                <br />
                <Trans
                    ns="health"
                    i18nKey="socket.clientId"
                    values={{ id: clientId ?? '' }}
                    components={{ b: <b /> }}
                />
            </p>
        </TextBox>
    );
}
