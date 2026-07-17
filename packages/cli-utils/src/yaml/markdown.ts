import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

type FrontmatterBase = Record<string, any>;

export type ParseFrontmatterResult<T extends FrontmatterBase> = {
  frontmatter?: T;
  /** The rest part */
  markdown: string;
};

const FRONTMATTER_DELIMITER = "---";
/** Matches the opening `---` delimiter line at the very start of the markdown text. */
const FRONTMATTER_OPEN_REGEXP = /^---[ \t]*\r?\n/;
/** Matches a `---` delimiter line (used to find the closing line of the frontmatter block). */
const FRONTMATTER_CLOSE_REGEXP = /^---[ \t]*\r?\n?$/;

export function parseFrontmatterInMarkdown<T extends FrontmatterBase>(markdown: string): ParseFrontmatterResult<T> {
  const openMatched = FRONTMATTER_OPEN_REGEXP.exec(markdown);
  if (!openMatched) return { markdown };

  const afterOpen = markdown.slice(openMatched[0].length);
  const lines = afterOpen.split(/(?<=\n)/); // split into lines, keeping the trailing newline of each line
  let closeLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (FRONTMATTER_CLOSE_REGEXP.test(lines[i])) {
      closeLineIndex = i;
      break;
    }
  }
  if (closeLineIndex === -1) return { markdown };

  const frontmatterText = lines.slice(0, closeLineIndex).join("");
  const rest = lines.slice(closeLineIndex + 1).join("");
  const frontmatter = (parseYaml(frontmatterText) ?? {}) as T;
  return { frontmatter, markdown: rest };
}

export function mergeFrontmatterWithMarkdown(
  markdown: string,
  frontmatter: FrontmatterBase | undefined | null
): string {
  if (!frontmatter) return markdown;

  const parsed = parseFrontmatterInMarkdown(markdown);
  const merged = { ...parsed.frontmatter, ...frontmatter };
  const frontmatterText = stringifyYaml(merged).trimEnd();
  return `${FRONTMATTER_DELIMITER}\n${frontmatterText}\n${FRONTMATTER_DELIMITER}\n${parsed.markdown}`;
}
