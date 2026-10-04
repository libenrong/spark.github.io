import classNames from 'classnames';
import { useDropzone } from 'react-dropzone';
import { Trans, useTranslation } from 'react-i18next';

import styles from '../style/homepage.module.scss';

export interface FilePickerProps {
    callback: (file: File) => void;
}

export default function FilePicker({ callback }: FilePickerProps) {
    const { t } = useTranslation('common');
    const { getRootProps, getInputProps } = useDropzone({
        accept: { '': ['.sparkprofile', '.sparkheap'] },
        multiple: false,
        onDropAccepted: files => {
            callback(files[0]);
        },
    });

    return (
        <div
            {...getRootProps({
                className: classNames('textbox', styles['file-picker']),
            })}
        >
            <input {...getInputProps()} />
            <p>{t('filePicker.prompt')}</p>
            <em>
                <Trans ns="common" i18nKey="filePicker.accepted" />
            </em>
        </div>
    );
}
