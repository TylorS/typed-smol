import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import type { UserProfile } from "./domain.js";

export type UserCardInput = {
  readonly user: UserProfile;
  readonly visits: number;
  readonly featured?: boolean;
};

export default Fx.fn((input: UserCardInput) =>
  html`<article data-testid="user-card">
    <h2>${input.user.name}</h2>
    <p>${input.user.role}</p>
    <strong>${input.visits}</strong>
    ${input.featured ? html`<span>Featured</span>` : ""}
  </article>`,
);
