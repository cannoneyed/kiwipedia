import { Inter } from 'next/font/google';
import styles from './Wiki.module.css';

const inter = Inter({ subsets: ['latin'] });

export interface Image {
  url: string;
  prompt: string;
  caption: string;
}

export interface Props {
  title: string;
  mainImage: Image;
}

export default function Infobox(props: Props) {
  return (
    <div className={styles.infobox + ' ' + inter.className}>
      {props.mainImage ? <MainImage {...props.mainImage} /> : null}
    </div>
  );
}

function postprocessCaption(caption: string): string {
  if (caption.startsWith('"')) {
    caption = caption.slice(1);
  }
  if (caption.endsWith('"')) {
    caption = caption.slice(0, -1);
  }
  return caption;
}

function MainImage(props: Image) {
  const caption = postprocessCaption(props.caption);

  return (
    <div className={styles.imageContainer}>
      <img className={styles.mainImage} src={props.url} alt={props.prompt} />
      <div className={styles.imageCaption}>{caption}</div>
    </div>
  );
}
