import Head from 'next/head';
import { useState } from 'react';
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
  image?: Image;
}

export interface Props {
  title: string;
  summary: string;
  mainImage: Image;
  sections: Section[];
}

export default function Wiki(props: Props) {
  const [imageToShow, setImageToShow] = useState('');
  const [captionToShow, setCaptionToShow] = useState('');
  const [lightboxDisplay, setLightBoxDisplay] = useState(false);

  let images: string[] = [];
  if (props.mainImage) {
    images.push(props.mainImage.url);
  }
  for (let section of props.sections) {
    if (section.image) {
      images.push(section.image.url);
    }
  }

  //function to show a specific image in the lightbox, amd make lightbox visible
  const showImage = (image: string, caption?: string) => {
    setImageToShow(image);
    setCaptionToShow(caption || '');
    setLightBoxDisplay(true);
  };

  //hide lightbox
  const hideLightBox = () => {
    setLightBoxDisplay(false);
  };

  //show next image in lightbox
  const showNext = (e: any) => {
    e.stopPropagation();
    let currentIndex = images.indexOf(imageToShow);
    if (currentIndex >= images.length - 1) {
      setLightBoxDisplay(false);
    } else {
      let nextImage = images[currentIndex + 1];
      setImageToShow(nextImage);
    }
  };

  //show previous image in lightbox
  const showPrev = (e: any) => {
    e.stopPropagation();
    let currentIndex = images.indexOf(imageToShow);
    if (currentIndex <= 0) {
      setLightBoxDisplay(false);
    } else {
      let nextImage = images[currentIndex - 1];
      setImageToShow(nextImage);
    }
  };

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
            <Infobox showImage={showImage} image={props.mainImage} />
            {props.summary}
          </div>
          {props.sections.map((section) => {
            return (
              <Section showImage={showImage} key={section.title} {...section} />
            );
          })}
          {lightboxDisplay ? (
            <div className={styles.lightboxContainer} onClick={hideLightBox}>
              <img className={styles.lightboxImage} src={imageToShow}></img>
              <div className={styles.lightboxCaption}>{captionToShow}</div>
            </div>
          ) : (
            ''
          )}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }: any) {
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

    if (!page) {
      return {
        notFound: true,
      };
    }

    return {
      props: page,
    };
  } catch (e) {
    console.error(e);
  }
}
