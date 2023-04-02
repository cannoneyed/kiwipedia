import Head from 'next/head';
import { Inter } from 'next/font/google';
import styles from './Wiki.module.css';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import clientPromise from '@/lib/mongodb';

const inter = Inter({ subsets: ['latin'] });

export interface Section {
  title: string;
  text: string;
}

export interface Props {
  title: string;
  summary: string;
  sections: Section[];
}

export default function Article(props: Props) {
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
          <div className={styles.summary}>{props.summary}</div>
          {props.sections.map((section) => {
            // Oftentimes, the section text contains the name of the section.
            // The generation API should filter this but we'll do it again here
            // to be safe.
            const text = section.text;
            const lines = text.split('\n');
            if (
              lines.length &&
              lines[0].toUpperCase().includes(section.title.toUpperCase()) &&
              lines[0].length - section.title.length < 3
            ) {
              lines.shift();
            }
            const sectionText = lines.join('\n').trim();

            return (
              <>
                <div className={styles.sectionTitle}>{section.title}</div>
                <div className={styles.sectionText}>{sectionText}</div>
              </>
            );
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
