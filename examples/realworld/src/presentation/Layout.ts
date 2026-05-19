import { html } from "@typed/template";
import { Link } from "@typed/ui";

export const defaultAvatar = "/default-avatar.svg";

export const avatarSrc = (image: string | null | undefined): string => {
  const value = image?.trim() ?? "";
  if (value === "") return defaultAvatar;
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : defaultAvatar;
  } catch {
    return defaultAvatar;
  }
};

export const Navbar = html`<nav class="navbar navbar-light">
  <div class="container">
    ${Link({ class: "navbar-brand", href: "/", content: "conduit" })}
    <ul class="nav navbar-nav pull-xs-right">
      <li class="nav-item">${Link({ class: "nav-link", href: "/", content: "Home" })}</li>
      <li class="nav-item">${Link({ class: "nav-link", href: "/login", content: "Sign in" })}</li>
      <li class="nav-item">${Link({ class: "nav-link", href: "/register", content: "Sign up" })}</li>
    </ul>
  </div>
</nav>`;

export const Banner = html`<div class="banner">
  <div class="container">
    <h1>conduit</h1>
    <p>A place to share your knowledge.</p>
  </div>
</div>`;
