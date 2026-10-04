import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchQuery } from '../../hooks/useSearchQuery';

export interface SearchBarProps {
    searchQuery: SearchQuery;
}

export default function SearchBar({ searchQuery }: SearchBarProps) {
    const { t } = useTranslation('sampler');

    function onQueryChanged(e: ChangeEvent<HTMLInputElement>) {
        searchQuery.setValue(e.target.value.toLowerCase());
    }

    return (
        <input
            className="searchbar"
            type="text"
            placeholder={t('controls.search')}
            value={searchQuery.value}
            onChange={onQueryChanged}
        ></input>
    );
}
