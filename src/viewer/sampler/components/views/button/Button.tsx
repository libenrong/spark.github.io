import { faCogs } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

export interface ButtonProps {
    value: boolean;
    setValue: Dispatch<SetStateAction<boolean>>;
    title: string;
    labelTrue: string;
    labelFalse: string;
    children: ReactNode[];
}

export default function Button({
    value,
    setValue,
    title,
    labelTrue,
    labelFalse,
    children,
}: ButtonProps) {
    const { t } = useTranslation('sampler');

    function onClick() {
        setValue(!value);
    }

    return (
        <div className="button">
            <button onClick={onClick}>
                <FontAwesomeIcon icon={faCogs} />{' '}
                <span>{t('buttons.titleLabel', { title })}</span>{' '}
                {value ? labelTrue : labelFalse}
            </button>
            {value ? children[0] : children[1]}
        </div>
    );
}
