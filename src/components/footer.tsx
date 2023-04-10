import Link from 'next/link';
import styles from './layout.module.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Footer() {
  return (
    <div className={styles.footer + ' ' + inter.className}>
      <div className={styles.footerTitle}>🥝 Kiwipedia</div>
      <Link href="/about">
        <span className={styles.link}>About</span>
      </Link>
    </div>
  );
}
