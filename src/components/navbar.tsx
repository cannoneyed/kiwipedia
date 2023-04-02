import Link from 'next/link';
import { Inter } from 'next/font/google';

import styles from './layout.module.css';

const inter = Inter({ subsets: ['latin'] });

export default function Navbar() {
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
      <div className={styles.search}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search Kiwipedia"
        ></input>
      </div>
    </div>
  );
}
