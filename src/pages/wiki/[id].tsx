import Head from 'next/head';
import { Inter } from 'next/font/google';
import styles from './Wiki.module.css';
import clientPromise from '@/lib/mongodb';

import Infobox from './infobox';
import Section from './section';

const inter = Inter({ subsets: ['latin'] });

export interface Image {
  url: string;
  prompt: string;
  caption: string;
}

export interface Section {
  title: string;
  text: string;
}

export interface Props {
  title: string;
  summary: string;
  mainImage: Image;
  sections: Section[];
}

export default function Wiki(props: Props) {
  return (
    <>
      <Head>
        <title>Kiwipedia</title>
        <meta
          name="description"
          content="Kiwipedia is a free online encyclopedia, completely synthesize by AI."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={inter.className}>
        <div className={styles.main}>
          <div className={styles.title}>{props.title}</div>
          <div className={styles.subtitle}>
            From Kiwipedia, the synthetic encyclopedia
          </div>
          <div className={styles.summary}>
            <Infobox {...props} />
            {props.summary}
          </div>
          {props.sections.map((section) => {
            return <Section key={section.title} {...section} />;
          })}
        </div>
      </main>
    </>
  );
}

export async function getStaticProps({ params }: any) {
  try {
    const client = await clientPromise;
    const db = client.db('kiwipedia');

    let pageId = encodeURI(params.id);
    pageId = pageId.replace(/'/g, '%27');

    const pages = await db
      .collection('wikis')
      .find({ pageId })
      .project({ _id: 0 })
      .toArray();

    const page = pages[0];

    return {
      props: page,
    };
  } catch (e) {
    console.error(e);
  }
}

export async function getStaticPaths() {
  try {
    const client = await clientPromise;
    const db = client.db('kiwipedia');

    const wikis = await db
      .collection('wikis')
      .find({})
      .project({ pageId: 1, _id: 0 })
      .toArray();
    const paths = wikis.map((wiki) => {
      return { params: { id: decodeURI(wiki.pageId) } };
    });

    return {
      paths,
      fallback: false,
    };
  } catch (e) {
    console.error(e);
  }
}
