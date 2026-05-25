import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Link } from "@typed/ui";
import { BrowserAuthState, type AuthSnapshot } from "../State.js";

export const BrowserNavbar = Fx.gen(function* () {
  if (typeof localStorage === "undefined") return navbarShell(unauthenticatedLinks());

  const auth = yield* BrowserAuthState.service;
  return navbarShell(
    RefAsyncData.matchFx(auth, {
      NoData: unauthenticatedLinks,
      Loading: unauthenticatedLinks,
      Failure: unauthenticatedLinks,
      Success: navbarLinks,
      Optimistic: navbarLinks,
    }),
  );
});

const navbarShell = (links: unknown) => html`<nav class="navbar navbar-light">
  <div class="container">
    ${Link({ class: "navbar-brand", href: "/", content: "conduit" })} ${links}
  </div>
</nav>`;

const navbarLinks = (snapshot: RefSubject.Computed<AuthSnapshot>) => {
  const accountLinks = RefSubject.map(snapshot, accountNavLinks);

  return html`<ul class="nav navbar-nav pull-xs-right">
    <li class="nav-item">${Link({ class: "nav-link active", href: "/", content: "Home" })}</li>
    <li class="nav-item">
      ${Link({ class: "nav-link", href: "/editor", content: "New Article" })}
    </li>
    <li class="nav-item">${Link({ class: "nav-link", href: "/settings", content: "Settings" })}</li>
    ${accountLinks}
  </ul>`;
};

const accountNavLinks = (snapshot: AuthSnapshot) =>
  snapshot.state === "authenticated" && snapshot.currentUser
    ? html`<li class="nav-item">
        ${Link({
          class: "nav-link",
          href: `/profile/${snapshot.currentUser.username}`,
          content: snapshot.currentUser.username,
        })}
      </li>`
    : signInLinks();

const signInLinks = () => html`<li class="nav-item">
    ${Link({ class: "nav-link", href: "/login", content: "Sign in" })}
  </li>
  <li class="nav-item">${Link({ class: "nav-link", href: "/register", content: "Sign up" })}</li>`;

const unauthenticatedLinks = () => html`<ul class="nav navbar-nav pull-xs-right">
  <li class="nav-item">${Link({ class: "nav-link active", href: "/", content: "Home" })}</li>
  ${signInLinks()}
</ul>`;

export const Navbar = navbarShell(unauthenticatedLinks());
