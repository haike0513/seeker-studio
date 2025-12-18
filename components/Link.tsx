import { createMemo, type JSX } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";

interface LinkProps {
  href: string;
  children: JSX.Element;
  class?: string;
  onClick?: (e: MouseEvent) => void;
}

export function Link(props: LinkProps) {
  const pageContext = usePageContext();
  const isActive = createMemo(() =>
    props.href === "/" ? pageContext.urlPathname === props.href : pageContext.urlPathname.startsWith(props.href),
  );
  return (
    <a
      href={props.href}
      class={props.class || (isActive() ? "is-active" : undefined)}
      onClick={props.onClick}
    >
      {props.children}
    </a>
  );
}
