/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export type LogArgs<T extends string> = T extends `${string}{}${infer Rest}` ? [arg: any, ...LogArgs<Rest>] : [];
export type LogFormatWithArgs<T extends string> = [format: T, ...args: LogArgs<T>];

const RESET = "\x1b[0m";

export class ConsoleLogFormatter {
  private items: { format: string; args: any[]; color?: string }[] = [];
  private readonly emphasisColor: string;

  constructor(
    private readonly prefix: string,
    emphasisColor?: string
  ) {
    this.emphasisColor = emphasisColor || "";
    this.reset();
  }

  reset() {
    this.items = [{ format: "{}", args: [this.prefix], color: "" }];
    return this;
  }

  add<T extends string>(format: T, args?: LogArgs<T>, emphasisColor?: string) {
    this.items.push({ format, args: args || [], color: emphasisColor ?? this.emphasisColor });
    return this;
  }

  toString(useColors?: string | boolean) {
    const baseColor = typeof useColors === "string" ? useColors : "";
    const resetColor = (useColors === false ? "" : RESET) + baseColor;

    let str = baseColor;
    for (const { format, args, color } of this.items)
      str += format.replace(/\{\}/g, () => (useColors === false ? "" : color) + (args.shift() ?? "") + resetColor);
    str += useColors === false ? "" : RESET;
    return str;
  }

  print(baseColor?: string | boolean) {
    process.stdout.write(this.toString(baseColor ?? process.stdout.hasColors?.()) + "\n");
    return this.reset();
  }

  printToStderr(baseColor?: string | boolean) {
    process.stderr.write(this.toString(baseColor ?? process.stderr.hasColors()) + "\n");
    return this.reset();
  }
}
