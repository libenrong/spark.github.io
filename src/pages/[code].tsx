import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import ViewerPageContent from '../components/ViewerPageContent';

export default function ViewerPage() {
    const router = useRouter();
    const code = (router.query['code'] as string) ?? '';
    return <ViewerPageContent code={code} />;
}

// no data is fetched at build/request time - the viewer loads the profile
// from bytebin client-side. getStaticProps is only required so that
// getStaticPaths is accepted by Next.
export const getStaticProps: GetStaticProps = async () => {
    return { props: {} };
};

/**
 * In server (standalone) mode, arbitrary codes are rendered on demand.
 * In static export mode (GitHub Pages) no codes can be enumerated at build
 * time - the 404 page renders the viewer content from the pathname instead,
 * so this route emits nothing.
 */
export const getStaticPaths: GetStaticPaths = async () => {
    if (process.env.NEXT_PUBLIC_STATIC_EXPORT === '1') {
        return { paths: [], fallback: false };
    }
    return { paths: [], fallback: 'blocking' };
};
