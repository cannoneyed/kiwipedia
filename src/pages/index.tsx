import Head from 'next/head';
import { Inter } from 'next/font/google';
import shuffle from 'shuffle-array';
import styles from '@/styles/Home.module.css';
import Link from 'next/link';
import clientPromise from '@/lib/mongodb';

const inter = Inter({ subsets: ['latin'] });

interface Page {
  title: string;
  pageId: string;
}

export interface Props {
  nArticles: number;
  pages: Page[];
}

export default function Home(props: Props) {
  return (
    <>
      <main className={inter.className}>
        <div className={styles.main}>
          <div className={styles.topBanner}>
            <div className={styles.title}>Welcome to Kiwipedia</div>
            <div className={styles.subtitle}>
              The synthetic encyclopedia completely generated by AI.
            </div>
            <div className={styles.articleCount}>
              {props.nArticles} articles in English.
            </div>
          </div>
          <div className={styles.articles}>
            <div className={styles.articlesTitle}>Featured articles</div>
            <form action="/api/random_page" method="post">
              <button className={styles.randomButton} type="submit">
                ✨ Random page
              </button>
            </form>
            {props.pages.map((page) => {
              const url = `/wiki/${page.pageId}`;
              return (
                <div key={page.pageId}>
                  <Link href={url}>
                    <span className={styles.link}>{page.title}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ req, res }: any) {
  try {
    const client = await clientPromise;
    const db = client.db('kiwipedia');

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=240',
    );

    const pages = await db
      .collection('wikis')
      .aggregate([{ $sample: { size: 20 } }])
      .project({ title: 1, pageId: 1, _id: 0 })
      .toArray();

    shuffle(pages);

    const nArticles = await db.collection('wikis').countDocuments();

    return {
      props: { pages: pages.slice(0, 20), nArticles },
    };
  } catch (e) {
    console.error(e);
  }
}
