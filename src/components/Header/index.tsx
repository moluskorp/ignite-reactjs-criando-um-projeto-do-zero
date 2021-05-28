import { useRouter } from 'next/router';
import styles from './header.module.scss';

export default function Header() {
  const router = useRouter();

  function handleNavigateHomePage() {
    router.push('/', {}, {});
  }

  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <img
          src="/images/logo.svg"
          alt="logo"
          onClick={handleNavigateHomePage}
        />
      </div>
    </header>
  );
}
