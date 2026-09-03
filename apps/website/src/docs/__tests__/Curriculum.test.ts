import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Explore } from "../../pages/Explore.js";
import { QuickStart, TutorialStepPage } from "../../pages/Curriculum.js";
import { quickStartSections, tutorialSteps } from "../../tutorial/Content.js";

const render = (value: unknown) =>
  Effect.runPromise(
    Effect.scoped(renderToHtmlString(value as never).pipe(Effect.provide(HtmlRenderTemplate))),
  );

describe("Quick Start and TodoMVC curriculum", () => {
  it("keeps every authored step addressable and ordered", () => {
    expect(quickStartSections.map(({ id }) => id)).toEqual([
      "install",
      "client-only",
      "reactive-state",
      "component-lifetime",
      "server-html",
      "hydrate-state",
    ]);
    expect(tutorialSteps.map(({ slug }) => slug)).toEqual([
      "model-the-domain",
      "application-state",
      "create-a-todo",
      "render-the-shell",
      "render-keyed-items",
      "derive-the-footer",
      "route-the-filter",
      "persist-the-list",
      "assemble-the-application",
      "test-the-boundaries",
    ]);
    expect(tutorialSteps.at(-1)?.architecture).toEqual([
      "domain",
      "application",
      "presentation",
      "infrastructure",
      "main",
    ]);
  });

  it("server-renders a distinct Counter for each progressive milestone", async () => {
    const output = await render(QuickStart);

    expect(output).toContain('data-curriculum-demo="counter-reactive"');
    expect(output).toContain('data-curriculum-demo="counter-component"');
    expect(output).toContain('data-curriculum-demo="counter-hydrated"');
    expect(output).toContain("Reactive Counter");
    expect(output).toContain("Component Counter");
    expect(output).toContain("Hydrated Counter");
    expect(output).toContain(">Decrease</button>");
    expect(output).toContain(">Increase</button>");
    expect(output).toContain("data-typed-refsubject");
    expect(output).toContain("curriculum-file--diff");
    expect(output).toContain("changes since step");
    expect(output).toContain("View current file");
  });

  it("discovers both curricula from Explore", async () => {
    const output = await render(Explore);

    expect(output).toContain('href="/explore/quick-start"');
    expect(output).toContain('href="/explore/tutorial"');
  });

  it("server-renders a resettable Todo preview for a cumulative milestone", async () => {
    const step = tutorialSteps.find(({ slug }) => slug === "render-keyed-items")!;
    const output = await render(TutorialStepPage(step));

    expect(output).toContain('data-curriculum-demo="todo-5"');
    expect(output).toContain('placeholder="What needs to be done?"');
    expect(output).toContain(">Reset preview</button>");
    expect(output).toContain("Learn Typed");
  });

  it("does not render TodoMVC before the presentation milestone", async () => {
    const domain = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "model-the-domain")!),
    );
    const application = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "application-state")!),
    );
    const create = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "create-a-todo")!),
    );
    const shell = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "render-the-shell")!),
    );

    expect(domain).not.toContain("data-curriculum-demo");
    expect(application).not.toContain("data-curriculum-demo");
    expect(create).not.toContain("data-curriculum-demo");
    expect(create).not.toContain('placeholder="What needs to be done?"');
    expect(shell).toContain("Keyed item rendering arrives next");
    expect(shell).toContain('data-curriculum-demo="todo-4"');
    expect(shell).toContain('placeholder="What needs to be done?"');
    expect(shell).not.toContain("todo-demo__list");
  });

  it("keeps the TodoMVC progression client-only while adding keyed presentation", async () => {
    const keyed = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "render-keyed-items")!),
    );
    const routed = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "route-the-filter")!),
    );
    const persisted = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "persist-the-list")!),
    );
    const pages = await Promise.all(tutorialSteps.map((step) => render(TutorialStepPage(step))));
    const authoredTutorial = tutorialSteps
      .flatMap(({ title, summary, body, files }) => [
        title,
        summary,
        body,
        ...files.map(({ source }) => source),
      ])
      .join("\n");

    expect(keyed).toContain("todo-demo__list");
    expect(routed).not.toContain("data-typed-refsubject");
    expect(persisted).not.toContain("data-typed-refsubject");
    expect(pages.every((page) => !page.includes("data-typed-refsubject"))).toBe(true);
    expect(authoredTutorial).not.toMatch(/hydrat/iu);
  });

  it("renders repeated TodoMVC files as milestone diffs", async () => {
    const applicationStateStep = tutorialSteps.find(({ slug }) => slug === "application-state")!;
    const keyedStep = tutorialSteps.find(({ slug }) => slug === "render-keyed-items")!;
    const create = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "create-a-todo")!),
    );
    const keyed = await render(TutorialStepPage(keyedStep));
    const persisted = await render(
      TutorialStepPage(tutorialSteps.find(({ slug }) => slug === "persist-the-list")!),
    );

    expect(
      applicationStateStep.files.find(({ name }) => name === "src/application.ts")?.source,
    ).not.toContain("export const Todos = TodoList");
    expect(create).toContain("curriculum-file--diff");
    expect(create).toContain("createTodo");
    expect(create).not.toContain("toggleTodoCompleted");
    expect(keyed).toContain("toggleTodoCompleted");
    expect(keyedStep.files.find(({ name }) => name === "src/presentation.ts")?.source).toContain(
      "App.TodoList",
    );
    expect(persisted).toContain("changes since step");
    expect(persisted).toContain("KeyValueStore");
  });
});
