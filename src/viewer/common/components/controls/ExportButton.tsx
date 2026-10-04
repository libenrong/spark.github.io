import { faFileExport } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import FaButton from '../../../../components/FaButton';
import { ExportCallback } from '../../logic/export';

export interface ExportButtonProps {
    exportCallback: ExportCallback;
}

export default function ExportButton({ exportCallback }: ExportButtonProps) {
    const { t } = useTranslation('common');
    if (!exportCallback) {
        return null;
    }
    return (
        <FaButton
            icon={faFileExport}
            onClick={exportCallback}
            title={t('viewer.controls.export')}
        />
    );
}
