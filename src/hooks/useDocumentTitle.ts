import { useEffect } from "react";

const APP_NAME = "Tour Maker";

/**
 * Sets the document title for the current page.
 * Automatically appends the app name as a suffix.
 * Restores the previous title on unmount.
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
