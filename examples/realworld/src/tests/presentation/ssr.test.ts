import { rmSync } from "node:fs";
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
import { renderUrl } from "../../ssr.js";

const testDatabasePath = resolve(defaultDataDirectory, "ssr-test.sqlite");
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

const run = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> =>
  Effect.runPromise(ServiceLayers.reduce(
    (current, layer) => Effect.provide(current, layer),
    effect,
  ));

const render = (url: string): Promise<string> => run(renderUrl(url));

describe("realworld SSR pages", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("renders the global feed with seeded articles, tags, and pagination", async () => {
    const html = await render("/");

    expect(html).toContain("Global Feed");
    expect(html).toContain("Seeded Typed RealWorld 1");
    expect(html).toContain("seed_author");
    expect(html).toContain("typed");
    expect(html).toContain('class="page-item active"');
  });

  it("renders page two with the next seeded articles", async () => {
    const html = await render("/?page=2");

    expect(html).toContain("Seeded Typed RealWorld 11");
    expect(html).not.toContain(">Seeded Typed RealWorld 1<");
    expect(html).toContain('aria-current="page">2</a>');
  });

  it("renders a tag feed with selected tag evidence", async () => {
    const html = await render("/tag/ssr");

    expect(html).toContain("ssr");
    expect(html).toContain("Seeded Typed RealWorld 5");
    expect(html).not.toContain(">Seeded Typed RealWorld 1<");
  });

  it("renders an article page with full body, metadata, controls, and comments", async () => {
    const html = await render("/article/seeded-typed-realworld-1");

    expect(html).toContain("Seeded Typed RealWorld 1");
    expect(html).toContain("This is deterministic seed article 1.");
    expect(html).toContain("Favorite Article");
    expect(html).toContain("Follow seed_author");
    expect(html).toContain("This seed article proves comments are real.");
  });

  it("renders an author profile with authored articles", async () => {
    const html = await render("/profile/seed_author");

    expect(html).toContain("seed_author");
    expect(html).toContain("Writes about Typed and Effect.");
    expect(html).toContain("Seeded Typed RealWorld 1");
    expect(html).toContain("My Articles");
  });

  it("renders a favorited profile tab with favorited articles only", async () => {
    const html = await render("/profile/seed_reader/favorites");

    expect(html).toContain("seed_reader");
    expect(html).toContain("Favorited Articles");
    expect(html).toContain("Seeded Typed RealWorld 1");
    expect(html).not.toContain("Seeded Typed RealWorld 2");
  });
});
