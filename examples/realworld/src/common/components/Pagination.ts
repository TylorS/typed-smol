import { Fx, RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import { PageLink } from "./PageLink.js";
import type { PageLinkData } from "./feedTypes.js";

export const Pagination = Fx.fn("Pagination")(
  <E, R>(input: {
    readonly articlesCount: RefSubject.Computed<number, E, R>;
    readonly page: RefSubject.Computed<number, E, R>;
    readonly selectedTag: RefSubject.Computed<string | undefined, E, R>;
  }) =>
    html`<ul class="pagination">
      ${many(RefSubject.map(RefSubject.struct(input), pageLinks), (link) => link.page, PageLink)}
    </ul>`,
);

const pageSize = 10;

const pageLinks = (input: {
  readonly articlesCount: number;
  readonly page: number;
  readonly selectedTag?: string;
}): readonly PageLinkData[] => {
  const pages = Math.ceil(input.articlesCount / pageSize);
  if (pages <= 1) return [];

  return Array.from({ length: pages }, (_, index) => {
    const page = index + 1;
    return {
      active: page === input.page,
      href: input.selectedTag ? `/tag/${input.selectedTag}?page=${page}` : `/?page=${page}`,
      page,
    };
  });
};
