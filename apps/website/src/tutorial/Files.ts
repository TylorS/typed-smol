export interface CurriculumFile {
  readonly name: string;
  readonly language: "ts" | "json" | "html" | "sh";
  readonly source: string;
}

// Named fences provide complete snapshots for chapter diffs and agent output.
// This parser is shared by the Astro collection pages and the build-time reader.
export const parseCurriculumFiles = (fileName: string, markdown: string) => {
  const files: Array<CurriculumFile> = [];
  const body = markdown
    .replaceAll("\r\n", "\n")
    .replace(
      /(?:^|\n)#{2,3} ([^\n]+)\n\n```(ts|json|html|sh) file="([^"]+)"\n([\s\S]*?)\n```(?=\n|$)/gu,
      (
        _match,
        heading: string,
        language: CurriculumFile["language"],
        name: string,
        source: string,
      ) => {
        if (heading !== name && !heading.startsWith(`${name}: `)) {
          throw new Error(`File heading and fence disagree in ${fileName}`);
        }
        if (files.some((file) => file.name === name)) {
          throw new Error(`Duplicate file snapshot in ${fileName}: ${name}`);
        }
        files.push({ name, language, source: source.trim() });
        return "";
      },
    );
  if (files.length === 0) throw new Error(`No named file snapshots in ${fileName}`);
  return { body: body.trim(), files };
};
