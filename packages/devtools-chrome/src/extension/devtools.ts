import { registerTypedDevtoolsPage } from "../devtoolsPage.js";
import { registerTypedElementsSidebar, type ChromeElementsSidebarApi } from "../elementsSidebar.js";
import { registerTypedSourcesSidebar, type ChromeSourcesSidebarApi } from "../sourcesSidebar.js";
import type { ChromeDevtoolsPageApi } from "../devtoolsPage.js";

type TypedDevtoolsChromeApi = ChromeDevtoolsPageApi &
  ChromeElementsSidebarApi &
  ChromeSourcesSidebarApi;

declare const chrome: TypedDevtoolsChromeApi | undefined;

if (typeof chrome !== "undefined") {
  registerTypedDevtoolsPage(chrome);
  registerTypedElementsSidebar(chrome);
  registerTypedSourcesSidebar(chrome);
}
