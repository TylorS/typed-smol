import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { Link } from "@typed/ui";

export const Navbar = Fx.gen(function* () {
  return html`<nav class="navbar navbar-light">
    <div class="container">
      ${Link({ class: "navbar-brand", href: "/", content: "conduit" })}
      <ul class="nav navbar-nav pull-xs-right">
        <li class="nav-item">${Link({ class: "nav-link active", href: "/", content: "Home" })}</li>
        <li class="nav-item">
          ${Link({ class: "nav-link", href: "/editor", content: "New Article" })}
        </li>
        <li class="nav-item">
          ${Link({ class: "nav-link", href: "/settings", content: "Settings" })}
        </li>
        <li class="nav-item">${Link({ class: "nav-link", href: "/login", content: "Sign in" })}</li>
      </ul>
    </div>
  </nav>`;
});
