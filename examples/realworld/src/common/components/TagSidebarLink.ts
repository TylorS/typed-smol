import { Fx, RefSubject } from "@typed/fx";
import { Link } from "@typed/ui";

export const TagSidebarLink = Fx.fn("TagSidebarLink")(<A extends string>(
  tag: RefSubject.RefSubject<A>,
) => {
  const href = RefSubject.map<A, never, never, string>(tag, tagHref);
  return Link({ class: "tag-pill tag-default", href, content: tag });
});

const tagHref = (value: string): string => `/tag/${value}`;
