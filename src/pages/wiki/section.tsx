import styles from './Wiki.module.css';

export interface Section {
  title: string;
  text: string;
}

export interface Props extends Section {
  subsections?: Section[];
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
  const sectionText = filterOutSectionTitle(text, title);
  const subsections = props.subsections || [];

  return (
    <>
      <div className={styles.sectionTitle}>{props.title}</div>
      <div className={styles.sectionText}>{sectionText}</div>
      {subsections.map((subsection) => {
        return <Subsection key={subsection.title} {...subsection} />;
      })}
    </>
  );
}

function Subsection(props: Section) {
  const { text, title } = props;
  const sectionText = filterOutSectionTitle(text, title);

  return (
    <>
      <div className={styles.subsectionTitle}>{props.title}</div>
      <div className={styles.sectionText}>{sectionText}</div>
    </>
  );
}
