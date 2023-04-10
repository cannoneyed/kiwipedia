import styles from './Wiki.module.css';
import Infobox from './infobox';

export interface Section {
  title: string;
  text: string;
  showImage?: (image: string) => void;
}

export interface Image {
  url: string;
  prompt: string;
  caption: string;
}

export interface Props extends Section {
  subsections?: Section[];
  image?: Image;
}

function filterOutSectionTitle(text: string, title: string) {
  if (!text) return text;
  // Oftentimes, the section text contains the name of the section.
  // The generation API should filter this but we'll do it again here
  // to be safe.
  const lines = text.split('\n');
  if (
    lines.length &&
    lines[0].toUpperCase().includes(title.toUpperCase()) &&
    lines[0].length - title.length < 3
  ) {
    lines.shift();
  }
  const sectionText = lines.join('\n').trim();
  return sectionText;
}

export default function Section(props: Props) {
  const { text, title } = props;
  if (!text) return <></>;
  const sectionText = filterOutSectionTitle(text, title);
  const paragraphs = sectionText.split('\n');
  const subsections = props.subsections || [];

  return (
    <>
      <div className={styles.sectionTitle}>{props.title}</div>
      <div className={styles.sectionText}>
        {props.image ? (
          <Infobox showImage={props.showImage} image={props.image} />
        ) : null}
        {paragraphs.map((paragraph, index) => {
          return (
            <p className={styles.paragraph} key={index}>
              {paragraph}
            </p>
          );
        })}
      </div>
      {subsections.map((subsection) => {
        return <Subsection key={subsection.title} {...subsection} />;
      })}
    </>
  );
}

function Subsection(props: Section) {
  const { text, title } = props;
  if (!text) return <></>;
  const sectionText = filterOutSectionTitle(text, title);
  const paragraphs = sectionText.split('\n');

  return (
    <>
      <div className={styles.subsectionTitle}>{props.title}</div>
      <div className={styles.sectionText}>
        {paragraphs.map((paragraph, index) => {
          return (
            <p className={styles.paragraph} key={index}>
              {paragraph}
            </p>
          );
        })}
      </div>
    </>
  );
}
