import Head from 'next/head';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import { DATA } from '../../data/alice';
import styles from '@/styles/Home.module.css';

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
            return (
              <>
                <div className={styles.sectionTitle}>{section.section}</div>
                <div className={styles.sectionText}>{section.text}</div>
              </>
            );
          })}
        </div>
      </main>
    </>
  );
}

export function getStaticProps() {
  return { props: DATA };
}
