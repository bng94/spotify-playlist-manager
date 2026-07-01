import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  overline: string;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}

const PageHeader = ({ overline, title, action, children }: PageHeaderProps) => (
  <header className={styles.header}>
    <div className={styles.titleBlock}>
      <div className={`pm-overline-section ${styles.overlineGap}`}>{overline}</div>
      <h1 className={`pm-page-title ${styles.pageTitle}`}>{title}</h1>
      {children}
    </div>
    {action}
  </header>
);

export default PageHeader;
