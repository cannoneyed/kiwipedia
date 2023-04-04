import Link from 'next/link';
import { Inter } from 'next/font/google';
import { useMediaQuery } from 'react-responsive';

import styles from './layout.module.css';

const inter = Inter({ subsets: ['latin'] });

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
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search Kiwipedia"
      ></input>
    </div>
  );
}
