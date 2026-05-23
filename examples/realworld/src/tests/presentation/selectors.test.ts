import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { renderUrl } from "../../server.js";
import { defaultDataDirectory, makeLayerRunner, ServerPageTestLayer } from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "selectors-test.sqlite");
const TestLayer = ServerPageTestLayer({ databasePath: testDatabasePath });

describe("realworld selector contract", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("renders feed selectors, active page classes, tags, avatars, and stylesheet", async () => {
    const html = await render("/");
    const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

    expect(indexHtml).toContain("/src/common/styles.css");
    expect(html).toContain('class="navbar navbar-light"');
    expect(html).toContain('class="navbar-brand"');
    expect(html).toContain('class="feed-toggle"');
    expect(html).toContain('class="nav-link active"');
    expect(html).toContain('class="article-preview"');
    expect(html).toContain('class="article-meta"');
    expect(html).toContain('class="preview-link"');
    expect(html).toContain('class="tag-pill tag-default"');
    expect(html).toContain('class="page-item active"');
    expect(html).toContain('src="/default-avatar.svg"');
  });

  it("renders auth, settings, editor, article, and profile form selectors", async () => {
    const login = await render("/login");
    const settings = await render("/settings");
    const editor = await render("/editor");
    const article = await render("/article/seeded-typed-realworld-1");
    const profile = await render("/profile/seed_author");

    expect(login).toContain('class="error-messages"');
    expect(login).toContain('placeholder="Email"');
    expect(settings).toContain('class="settings-page"');
    expect(settings).toContain('placeholder="URL of profile picture"');
    expect(editor).toContain('class="editor-page"');
    expect(editor).toContain('placeholder="Write your article (in markdown)"');
    expect(article).toContain("comment-form");
    expect(article).toContain('placeholder="Write a comment..."');
    expect(profile).toContain('class="user-img user-pic"');
    expect(profile).toContain('class="articles-toggle"');
  });
});

const run = makeLayerRunner(TestLayer);

const render = (url: string): Promise<string> => run(renderUrl(url));
