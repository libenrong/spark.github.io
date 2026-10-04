import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextBox from '../components/TextBox';
import ViewerPageContent from '../components/ViewerPageContent';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * In static export mode (GitHub Pages) arbitrary profile codes cannot be
 * pre-rendered, so any single-segment path 404s and lands here - the viewer
 * is then rendered directly from the pathname. Multi-segment unknown paths
 * fall through to the regular "not found" message.
 */
export default function Custom404() {
    const { t } = useTranslation('common');
    const [code, setCode] = useState<string | null>();

    useEffect(() => {
        let path = window.location.pathname;
        if (basePath && path.startsWith(basePath)) {
            path = path.slice(basePath.length);
        }
        const segments = path.split('/').filter(Boolean);
        if (segments.length !== 1) {
            setCode(null);
            return;
        }
        try {
            setCode(decodeURIComponent(segments[0]));
        } catch {
            setCode(null);
        }
    }, []);

    if (code === undefined) {
        return <TextBox>{t('loading')}</TextBox>;
    }
    if (code === null) {
        return <TextBox>{t('error.notFound')}</TextBox>;
    }
    return <ViewerPageContent code={code} />;
}
