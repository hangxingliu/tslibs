import type {
  DocumentOptions,
  ParseOptions,
  SchemaOptions,
  ToJSOptions,
  ToStringOptions,
  CreateNodeOptions,
} from "yaml";
import { parse, stringify } from "yaml";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

type ParseOpts = ParseOptions & DocumentOptions & SchemaOptions & ToJSOptions;
type StringifyOpts = DocumentOptions & SchemaOptions & ParseOptions & CreateNodeOptions & ToStringOptions;

export type ParsedYAMLHeaderComment = {
  line: string;
  /** yaml-language-server */
  schema?: string;
};

export type ParsedYAML<Doc> = {
  headers: ParsedYAMLHeaderComment[];
  doc: Doc;
};

/** Matches a `# yaml-language-server: $schema=PATH` comment line. */
const SCHEMA_COMMENT_REGEXP = /^#\s*yaml-language-server:\s*\$schema=(\S+)\s*$/;
/** Matches a comment line (allowing leading indentation). */
const COMMENT_LINE_REGEXP = /^\s*#/;

export function parseYAML<Doc = any>(yaml: string, opts?: ParseOpts): ParsedYAML<Doc> {
  const lines = yaml.split(/\r?\n/);

  const headers: ParsedYAMLHeaderComment[] = [];
  let bodyStartIndex = 0;
  for (; bodyStartIndex < lines.length; bodyStartIndex++) {
    const line = lines[bodyStartIndex];
    if (!COMMENT_LINE_REGEXP.test(line)) break;

    const matched = SCHEMA_COMMENT_REGEXP.exec(line.trim());
    headers.push(matched ? { line, schema: matched[1] } : { line });
  }

  const body = lines.slice(bodyStartIndex).join("\n");
  const doc = parse(body, opts) as Doc;
  return { headers, doc };
}

export function stringifyYAML(doc: any, headers?: ParsedYAMLHeaderComment[], opts?: StringifyOpts) {
  const body = stringify(doc, opts);
  if (!headers || headers.length === 0) return body;

  const headerText = headers.map((header) => header.line).join("\n");
  return `${headerText}\n${body}`;
}

export function getYAMLSchemaPath(headers: ParsedYAMLHeaderComment[], docPath: string): string | undefined {
  const found = headers.find((header) => header.schema);
  if (!found?.schema) return undefined;

  const { schema } = found;
  if (isAbsolute(schema) || /^[a-z][a-z0-9+.-]*:\/\//i.test(schema)) return schema;
  return resolve(dirname(docPath), schema);
}

export function getYAMLSchemaComment(schemaPathOrURL: string, docPath?: string): string {
  let finalPath = schemaPathOrURL;
  if (docPath) {
    const relativePath = relative(dirname(docPath), schemaPathOrURL).split(sep).join("/");
    finalPath = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  }
  return `# yaml-language-server: $schema=${finalPath}`;
}
