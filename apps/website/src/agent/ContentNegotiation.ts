import { Effect } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { loadMarkdownForPath, markdownPathForPath, origin } from "./Artifacts.js";

const contentSignal = "ai-train=yes, search=yes, ai-input=yes";

const markdownResponse = (body: string) =>
  HttpServerResponse.text(body, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });

interface AcceptRange {
  readonly mediaType: string;
  readonly quality: number;
  readonly order: number;
}

const parseAccept = (header: string): ReadonlyArray<AcceptRange> =>
  header.split(",").flatMap((part, order) => {
    const [mediaType = "", ...parameters] = part.split(";").map((value) => value.trim());
    if (!mediaType.includes("/")) return [];
    const qualityParameter = parameters.find((value) => value.toLowerCase().startsWith("q="));
    const parsed = qualityParameter === undefined ? 1 : Number(qualityParameter.slice(2));
    const quality = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0;
    return [{ mediaType: mediaType.toLowerCase(), quality, order }];
  });

const qualityFor = (ranges: ReadonlyArray<AcceptRange>, mediaType: string): number => {
  const [type] = mediaType.split("/");
  return (
    ranges
      .filter(
        ({ mediaType: range }) => range === mediaType || range === `${type}/*` || range === "*/*",
      )
      .sort((left, right) => {
        const specificity = (range: string) => (range === mediaType ? 2 : range === "*/*" ? 0 : 1);
        return (
          specificity(right.mediaType) - specificity(left.mediaType) || left.order - right.order
        );
      })[0]?.quality ?? 0
  );
};

export const prefersMarkdown = (header: string | undefined): boolean => {
  if (header === undefined) return false;
  const ranges = parseAccept(header);
  const explicit = ranges.some(
    ({ mediaType, quality }) => mediaType === "text/markdown" && quality > 0,
  );
  return (
    explicit &&
    qualityFor(ranges, "text/markdown") >= qualityFor(ranges, "text/html") &&
    qualityFor(ranges, "text/markdown") > 0
  );
};

export const ContentNegotiation = HttpRouter.use(
  Effect.fn(function* (router) {
    yield* router.addGlobalMiddleware((route) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const url = new URL(request.url, origin);
        const acceptsMarkdown = prefersMarkdown(request.headers.accept);
        const markdown = yield* loadMarkdownForPath(url.pathname);
        const response =
          acceptsMarkdown && markdown !== undefined ? markdownResponse(markdown) : yield* route;

        const markdownPath = markdownPathForPath(url.pathname);
        const links = [
          `<${origin}${url.pathname}>; rel=canonical`,
          ...(markdownPath === undefined
            ? []
            : [`<${origin}${markdownPath}>; rel=alternate; type="text/markdown"`]),
          `<${origin}/.well-known/ard.json>; rel="service-desc"`,
        ];
        return HttpServerResponse.setHeaders(response, {
          "access-control-allow-origin": "*",
          "content-signal": contentSignal,
          vary: "Accept",
          link: links.join(", "),
          ...(request.method === "GET" ? { "cache-control": "no-cache" } : {}),
        });
      }),
    );
  }),
);
