import Navbar from './navbar';
import Footer from './footer';

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return (
    <>
      <Navbar />
      <main>{props.children}</main>
      <Footer />
    </>
  );
}
