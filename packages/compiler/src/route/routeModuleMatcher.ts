export interface RouteModuleMatcherOptions {
  readonly projectRoot?: string;
  readonly routeDirectories?: readonly string[];
}

export type RouteModuleMatcher = (moduleId: string) => boolean;

const defaultRouteDirectories = ["routes"] as const;

export function createRouteModuleMatcher(
  options: RouteModuleMatcherOptions = {},
): RouteModuleMatcher {
  const directories = normalizeRouteDirectories(options.routeDirectories);
  const projectRoot = options.projectRoot ? normalizePath(options.projectRoot) : undefined;

  return (moduleId) => {
    const normalizedModuleId = normalizePath(moduleIdWithoutQuery(moduleId));
    return directories.some((directory) =>
      routeDirectoryMatches(normalizedModuleId, directory, projectRoot),
    );
  };
}

function normalizeRouteDirectories(
  routeDirectories: readonly string[] | undefined,
): readonly string[] {
  return (routeDirectories?.length ? routeDirectories : defaultRouteDirectories)
    .map((directory) => normalizePath(directory))
    .map((directory) => directory.replace(/^\.?\//, "").replace(/\/+$/, ""))
    .filter((directory) => directory.length > 0);
}

function routeDirectoryMatches(
  moduleId: string,
  routeDirectory: string,
  projectRoot: string | undefined,
): boolean {
  if (isAbsolutePath(routeDirectory)) return isWithinDirectory(moduleId, routeDirectory);
  if (projectRoot !== undefined) {
    const rootedDirectory = `${projectRoot.replace(/\/+$/, "")}/${routeDirectory}`;
    if (isWithinDirectory(moduleId, rootedDirectory)) return true;
    if (routeDirectory.includes("/")) return false;
  }
  return hasPathSegments(moduleId, routeDirectory);
}

function hasPathSegments(moduleId: string, routeDirectory: string): boolean {
  const moduleSegments = moduleId.split("/").filter(Boolean);
  const routeSegments = routeDirectory.split("/").filter(Boolean);
  if (routeSegments.length === 0 || moduleSegments.length <= routeSegments.length) return false;

  for (let index = 0; index <= moduleSegments.length - routeSegments.length; index++) {
    const matches = routeSegments.every(
      (segment, offset) => moduleSegments[index + offset] === segment,
    );
    if (matches) return true;
  }

  return false;
}

function isWithinDirectory(moduleId: string, directory: string): boolean {
  const normalizedDirectory = directory.replace(/\/+$/, "");
  return moduleId.startsWith(`${normalizedDirectory}/`);
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith("/") || /^[A-Za-z]:\//.test(path);
}

function moduleIdWithoutQuery(moduleId: string): string {
  const queryIndex = moduleId.indexOf("?");
  return queryIndex === -1 ? moduleId : moduleId.slice(0, queryIndex);
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}
