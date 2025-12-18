// https://vike.dev/Head

import logoUrl from "../assets/logo.svg";
import faviconUrl from "../assets/favicon.svg";

export function Head() {
  return (
    <>
      <link rel="icon" href={faviconUrl} type="image/svg+xml" />
      <link rel="apple-touch-icon" href={logoUrl} />
    </>
  );
}
