import { Trans } from 'react-i18next';
import { env } from '../env';
import styles from '../style/footer.module.scss';

export default function Footer() {
    const year = new Date().getFullYear().toString();
    return (
        <footer className={styles.footer}>
            <Trans
                ns="common"
                i18nKey="footer.openSource"
                values={{ year }}
                components={{
                    spark: <a href="https://github.com/lucko/spark" />,
                    viewer: <a href="https://github.com/lucko/spark-viewer" />,
                    lucko: <a href="https://github.com/lucko" />,
                    contributors: (
                        <a
                            href={`${env.NEXT_PUBLIC_SPARK_DOCS_URL}/misc/Credits`}
                        />
                    ),
                    br: <br />,
                }}
            />
        </footer>
    );
}
