import Link from 'next/link';
import { Inter } from 'next/font/google';
import { useMediaQuery } from 'react-responsive';
import AsyncSelect from 'react-select/async';
import algoliasearch from 'algoliasearch/lite';

const client = algoliasearch('RKUVCLFTD5', '7965feda14dff8d50badaa2a92fdb2e1');
const searchIndex = client.initIndex('kiwipedia');

import styles from './layout.module.css';

const inter = Inter({ subsets: ['latin'] });

interface SearchResult {
  pageId: string;
  title: string;
}

const promiseOptions = async (inputValue: string) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  if (inputValue === '') {
    inputValue = randomLetter;
  }

  return searchIndex.search<SearchResult>(inputValue).then(({ hits }) => {
    return hits.map((hit) => {
      return {
        value: hit.pageId,
        label: hit.title,
      };
    });
  });
};

export default function Navbar() {
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });

  return (
    <div className={styles.navbar + ' ' + inter.className}>
      <Link href="/">
        <div className={styles.logoContainer}>
          <div className={styles.logo}>🥝</div>
          <div className={styles.titleContainer}>
            <div className={styles.title}>Kiwipedia</div>
            <div className={styles.subtitle}>The synthetic encyclopedia</div>
          </div>
        </div>
      </Link>
      <Search />
    </div>
  );
}

function Search() {
  return (
    <div className={styles.search}>
      <AsyncSelect
        instanceId="search"
        placeholder="🔎 Search"
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        cacheOptions
        defaultOptions
        loadOptions={promiseOptions}
        onChange={(result) => {
          const pageId = result?.value;
          if (pageId) {
            window.location.href = `/wiki/${pageId}`;
          }
        }}
      />
    </div>
  );
}
