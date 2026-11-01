import '../styles/globals.css';
import Layout from '../components/Layout';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import CookieConsent from '../components/CookieConsent';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
          <CookieConsent />
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;
