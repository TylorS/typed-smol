import { html } from "@typed/template";
import { packageCatalog, referenceCounts } from "../docs/Content.js";
import type { ReferenceModule, ReferencePackage } from "../docs/Model.js";

const exposureLabel = (count: number) => `${count} ${count === 1 ? "export" : "exports"}`;
const exportNameOf = (id: string) => id.slice(id.indexOf("#") + 1);
const packageHref = (pkg: (typeof packageCatalog)[number]) =>
  pkg.moduleCount === 1
    ? `/reference/modules/${encodeURIComponent(pkg.packageName)}`
    : `/reference/packages/${encodeURIComponent(pkg.packageName)}`;
const categoryId = (category: string) =>
  `category-${category.toLocaleLowerCase().replace(/[^a-z0-9]+/gu, "-")}`;

const ReferenceBreadcrumb = (
  items: ReadonlyArray<{ readonly href?: string; readonly label: string }>,
) => html`
  <nav class="reference-breadcrumb" aria-label="Breadcrumb">
    <ol>
      ${items.map(
        (item, index) => html`
          <li>
            ${
              item.href === undefined || index === items.length - 1
                ? html`<span aria-current="page">${item.label}</span>`
                : html`<a href=${item.href}>${item.label}</a>`
            }
          </li>
        `,
      )}
    </ol>
  </nav>
`;

export const Reference = html`
  <main id="main-content" class="page reference-overview" tabindex="-1">
    <header class="page-intro reference-overview__intro">
      <span class="index">REFERENCE / PUBLIC API</span>
      <h1>API reference</h1>
      <p>
        The complete public surface, organized the way you import it: package, module, then symbol.
        Every entry resolves to its declaration, behavioral documentation, examples, and a
        machine-readable record.
      </p>
    </header>

    <section class="reference-overview__summary" aria-label="Reference inventory">
      <dl class="reference-overview__totals">
        <div>
          <dt>Packages</dt>
          <dd>${referenceCounts.packageCount}</dd>
        </div>
        <div>
          <dt>Modules</dt>
          <dd>${referenceCounts.moduleCount}</dd>
        </div>
        <div>
          <dt>Unique exports</dt>
          <dd>${referenceCounts.uniqueExportCount}</dd>
        </div>
      </dl>
    </section>

    <section class="reference-catalog" aria-labelledby="packages-title">
      <header class="reference-catalog__header">
        <div>
          <span class="index">PACKAGES</span>
          <h2 id="packages-title">Choose a package</h2>
        </div>
      </header>

      <ol class="reference-package-list">
        ${packageCatalog.map(
          (pkg) => html`
            <li>
              <article class="reference-package-row">
                <div class="reference-package-row__identity">
                  <span class="index">PACKAGE</span>
                  <h3>
                    <a href=${packageHref(pkg)}>${pkg.packageName}</a>
                  </h3>
                </div>
                <dl class="reference-package-row__facts">
                  <div>
                    <dt>Version</dt>
                    <dd><code>${pkg.packageVersion}</code></dd>
                  </div>
                  <div>
                    <dt>Modules</dt>
                    <dd>${pkg.moduleCount}</dd>
                  </div>
                  <div>
                    <dt>Unique exports</dt>
                    <dd>${pkg.uniqueExportCount}</dd>
                  </div>
                </dl>
              </article>
            </li>
          `,
        )}
      </ol>
    </section>
  </main>
`;

export const PackagePage = (pkg: ReferencePackage) => html`
  <main id="main-content" class="page package-page reference-page" tabindex="-1">
    ${ReferenceBreadcrumb([{ href: "/reference", label: "Reference" }, { label: pkg.packageName }])}

    <header class="page-intro reference-package-intro">
      <span class="index">PACKAGE</span>
      <h1>${pkg.packageName}</h1>
    </header>

    <dl class="reference-package-facts" aria-label="${pkg.packageName} package facts">
      <div>
        <dt>Version</dt>
        <dd><code>${pkg.packageVersion}</code></dd>
      </div>
      <div>
        <dt>Import paths</dt>
        <dd>${pkg.moduleSpecifiers.length}</dd>
      </div>
      <div>
        <dt>Unique exports</dt>
        <dd>${pkg.uniqueExportCount}</dd>
      </div>
    </dl>

    <section class="reference-modules" aria-labelledby="package-modules-title">
      <header class="reference-section-header">
        <div>
          <span class="index">MODULES</span>
          <h2 id="package-modules-title">Import surfaces</h2>
        </div>
      </header>

      <ol class="reference-module-list">
        ${pkg.moduleGroups.flatMap(({ modules }) =>
          modules.map(
            (module) => html`
              <li>
                <article class="reference-module-row">
                  <a
                    href=${
                      module.exposureIds.length === 1
                        ? `/reference/${encodeURIComponent(module.exposureIds[0]!)}`
                        : `/reference/modules/${encodeURIComponent(module.consumerSpecifier)}`
                    }
                  >
                    <code>${module.consumerSpecifier}</code>
                  </a>
                </article>
              </li>
            `,
          ),
        )}
      </ol>
    </section>
  </main>
`;

export const ModulePage = (module: ReferenceModule) => html`
  <main id="main-content" class="page module-page reference-page" tabindex="-1">
    ${ReferenceBreadcrumb([
      { href: "/reference", label: "Reference" },
      {
        href: `/reference/packages/${encodeURIComponent(module.packageName)}`,
        label: module.packageName,
      },
      { label: module.consumerSpecifier },
    ])}

    <header class="page-intro reference-module-intro">
      <span class="index">MODULE</span>
      <h1><code>${module.consumerSpecifier}</code></h1>
    </header>

    <dl class="reference-module-facts" aria-label="${module.consumerSpecifier} module facts">
      <div>
        <dt>Package</dt>
        <dd>
          <a href="/reference/packages/${encodeURIComponent(module.packageName)}"
            >${module.packageName}</a
          >
        </dd>
      </div>
      <div>
        <dt>Unique exports</dt>
        <dd>${module.uniqueExportCount}</dd>
      </div>
      <div>
        <dt>Declarations</dt>
        <dd>${module.mediaType === "text/typescript" ? "TypeScript" : "JSON"}</dd>
      </div>
    </dl>

    <div class="reference-module-layout">
      <nav class="reference-module-navigation" aria-label="Module categories">
        <strong>In this module</strong>
        ${module.categories.map(
          (category) =>
            html`<a href="#${categoryId(category.name)}"
              ><span>${category.name}</span><small>${category.exposureIds.length}</small></a
            >`,
        )}
      </nav>

      <div class="reference-module-content">
        ${module.categories.map(
          (category) => html`
            <section
              class="reference-category"
              id=${categoryId(category.name)}
              aria-labelledby="${categoryId(category.name)}-title"
            >
              <header class="reference-category__header">
                <h2 id="${categoryId(category.name)}-title">${category.name}</h2>
                <span>${exposureLabel(category.exposureIds.length)}</span>
              </header>
              <ol class="reference-category-list">
                ${category.exposureIds.map(
                  (id) => html`
                    <li>
                      <a class="reference-symbol-row" href="/reference/${encodeURIComponent(id)}">
                        <code>${exportNameOf(id)}</code>
                        <span>${module.consumerSpecifier}</span>
                      </a>
                    </li>
                  `,
                )}
              </ol>
            </section>
          `,
        )}
      </div>
    </div>
  </main>
`;
