import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { ApplicationServices } from "../../application/Services.js";
import { defaultDataDirectory, RealWorldConfig } from "../../infrastructure/Config.js";
import { PasswordHasher } from "../../infrastructure/PasswordHasher.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { SessionTokens } from "../../infrastructure/SessionTokens.js";
import { ArticleRepository } from "../../infrastructure/repositories/ArticleRepository.js";
import { CommentRepository } from "../../infrastructure/repositories/CommentRepository.js";
import { ProfileRepository } from "../../infrastructure/repositories/ProfileRepository.js";
import { TagRepository } from "../../infrastructure/repositories/TagRepository.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";
import { renderUrl } from "../../server.js";

const testDatabasePath = resolve(defaultDataDirectory, "selectors-test.sqlite");
const TestConfig = RealWorldConfig.layer({ databasePath: testDatabasePath });
const ServiceLayers = [
  ApplicationServices,
  UserRepository.Live,
  ProfileRepository.Live,
  ArticleRepository.Live,
  CommentRepository.Live,
  TagRepository.Live,
  SessionTokens.Live,
  PasswordHasher.Live,
  TestConfig,
] as const;

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

    expect(indexHtml).toContain("/src/presentation/styles.css");
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

const run = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> =>
  Effect.runPromise(ServiceLayers.reduce(
    (current, layer) => Effect.provide(current, layer),
    effect,
  ));

const render = (url: string): Promise<string> => run(renderUrl(url));
