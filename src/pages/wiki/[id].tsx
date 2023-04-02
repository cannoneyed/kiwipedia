import Head from 'next/head';
import { Inter } from 'next/font/google';
import styles from './Wiki.module.css';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const inter = Inter({ subsets: ['latin'] });

export interface Section {
  section: string;
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
              lines[0].toUpperCase().includes(section.section.toUpperCase()) &&
              lines[0].length - section.section.length < 3
            ) {
              lines.shift();
            }
            const sectionText = lines.join('\n').trim();

            return (
              <>
                <div className={styles.sectionTitle}>{section.section}</div>
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
  // open the database
  const filename = path.resolve(process.cwd(), '.db/database.db');
  const db = await open({
    filename,
    driver: sqlite3.Database,
  });

  const parsed = encodeURI(params.id).replace(/'/g, '%27');
  console.log(params.id, parsed);

  const result = await db.get('SELECT * FROM synth_articles WHERE page_id=?', [
    parsed,
  ]);

  const json = JSON.parse(result.json);

  return {
    props: json,
  };
}

export async function getStaticPaths() {
  // open the database
  const filename = path.resolve(process.cwd(), '.db/database.db');
  const db = await open({
    filename,
    driver: sqlite3.Database,
  });

  const results = await db.all('SELECT page_id FROM synth_articles');
  const paths = results.map((result) => {
    return { params: { id: decodeURI(result.page_id) } };
  });

  return {
    paths,
    fallback: false,
  };
}
