import { NextPage } from 'next';
import { useTranslation } from 'react-i18next';
import TextBox from '../components/TextBox';

interface ErrorPageProps {
    statusCode?: number;
}

const Error: NextPage<ErrorPageProps> = ({ statusCode }) => {
    const { t } = useTranslation('common');
    return (
        <TextBox>
            {statusCode
                ? t('error.serverErrorWithCode', { statusCode })
                : t('error.clientError')}
        </TextBox>
    );
};

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
