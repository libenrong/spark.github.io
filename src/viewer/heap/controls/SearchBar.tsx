import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

export interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
}

export default function SearchBar({
    searchQuery,
    setSearchQuery,
}: SearchBarProps) {
    const { t } = useTranslation('heap');

    function onQueryChanged(e: ChangeEvent<HTMLInputElement>) {
        setSearchQuery(e.target.value.toLowerCase());
    }

    return (
        <input
            className="searchbar"
            type="text"
            value={searchQuery}
            onChange={onQueryChanged}
            placeholder={t('searchPlaceholder')}
        ></input>
    );
}
