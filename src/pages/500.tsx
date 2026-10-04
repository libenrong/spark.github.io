import { useTranslation } from 'react-i18next';
import TextBox from '../components/TextBox';

export default function Custom500() {
    const { t } = useTranslation('common');
    return <TextBox>{t('error.serverError')}</TextBox>;
}
