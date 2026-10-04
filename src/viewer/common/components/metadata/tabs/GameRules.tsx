import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { WorldStatistics_GameRule } from '../../../../proto/spark_pb';

export interface GameRulesProps {
    gameRules: WorldStatistics_GameRule[];
}

export default function GameRules({ gameRules }: GameRulesProps) {
    const { t } = useTranslation('metadata');
    const setRules = gameRules.filter(
        gameRule => !gameRuleIsDefaultInAllWorlds(gameRule)
    );

    const [showDefaults, setShowDefaults] = useState<boolean>(false);

    return (
        <div className="gamerules">
            {setRules.length === 0 && (
                <>
                    <p>{t('gamerules.allDefault')}</p>
                </>
            )}
            {setRules.length > 0 && (
                <>
                    <h2>{t('gamerules.overridesHeading')}</h2>
                    <span>{t('gamerules.overridesNote')}</span>
                    <ul>
                        {setRules.map(gameRule => (
                            <li key={gameRule.name}>
                                <Trans
                                    ns="metadata"
                                    i18nKey="gamerules.ruleDefault"
                                    values={{ name: gameRule.name }}
                                    components={{
                                        value: (
                                            <GameRuleValue
                                                value={gameRule.defaultValue}
                                            />
                                        ),
                                    }}
                                />
                                <ul>
                                    {Object.entries(gameRule.worldValues)
                                        .filter(
                                            ([_, value]) =>
                                                value !== gameRule.defaultValue
                                        )
                                        .map(([worldName, value]) => (
                                            <li key={worldName}>
                                                {worldName}:{' '}
                                                <GameRuleValue value={value} />
                                            </li>
                                        ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <button onClick={() => setShowDefaults(value => !value)}>
                {t(
                    showDefaults
                        ? 'gamerules.hideDefaults'
                        : 'gamerules.showDefaults'
                )}
            </button>

            {showDefaults && (
                <>
                    <h2>{t('gamerules.defaultsHeading')}</h2>
                    <span>{t('gamerules.defaultsNote')}</span>
                    <ul>
                        {gameRules.map(gameRule => (
                            <li key={gameRule.name}>
                                {gameRule.name}:{' '}
                                <GameRuleValue value={gameRule.defaultValue} />
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

const GameRuleValue = ({ value }: { value: string }) => {
    if (value === 'true' || value === 'false') {
        return <span className={`value-${value}`}>{value}</span>;
    }
    if (/^-?\d+$/.test(value)) {
        return <span className="value-number">{value}</span>;
    } else {
        return <span className="value-string">{value}</span>;
    }
};

const gameRuleIsDefaultInAllWorlds = (gameRule: WorldStatistics_GameRule) => {
    const worldValuesSet = Array.from(
        new Set(Object.values(gameRule.worldValues))
    );
    return (
        worldValuesSet.length === 1 &&
        worldValuesSet[0] === gameRule.defaultValue
    );
};
