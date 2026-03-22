/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { type BinaryToTextEncoding, createHash } from "node:crypto";
import { createReadStream } from "node:fs";

export async function getFileSHA(file: string, digest: null | undefined, algo?: string): Promise<Buffer>;
export async function getFileSHA(file: string, digest: BinaryToTextEncoding, algo?: string): Promise<string>;
export async function getFileSHA(
  file: string,
  digest: BinaryToTextEncoding | undefined | null = "hex",
  algo: string = "sha256"
) {
  return new Promise<string | Buffer>((resolve, reject) => {
    const hash = createHash(algo);
    const rs = createReadStream(file, { autoClose: true });
    rs.on("error", reject);
    rs.on("data", (chunk) => hash.update(chunk));
    rs.on("end", () => resolve(digest ? hash.digest(digest) : hash.digest()));
  });
}
