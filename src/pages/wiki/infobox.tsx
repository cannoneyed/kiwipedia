import { Inter } from 'next/font/google';
import styles from './Wiki.module.css';

const inter = Inter({ subsets: ['latin'] });

export interface Image {
  url: string;
  prompt: string;
  caption: string;
  showImage?: (image: string, caption: string) => void;
}

export interface Props {
  title?: string;
  image: Image;
  showImage?: (image: string, caption: string) => void;
}

export default function Infobox(props: Props) {
  return (
    <div className={styles.infobox + ' ' + inter.className}>
      {props.image ? (
        <ImageComponent {...props.image} showImage={props.showImage} />
      ) : null}
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

function ImageComponent(props: Image) {
  const caption = postprocessCaption(props.caption);

  const onClick = () => {
    if (props.showImage) {
      props.showImage(props.url, props.caption);
    }
  };

  return (
    <div className={styles.imageContainer}>
      <img
        className={styles.image}
        src={props.url}
        alt={props.prompt}
        onClick={onClick}
      />
      <div className={styles.imageCaption}>{caption}</div>
    </div>
  );
}
