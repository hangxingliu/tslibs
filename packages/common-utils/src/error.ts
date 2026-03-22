/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export function getErrorMessage(error: unknown): string {
  return getBaseMessage(error) || "Unknown Error";
}
export function getErrorStack(error: unknown): string {
  if (error && error instanceof Error && error.stack) return error.stack;
  if (!error) return "Unknown Error Stack";
  return String(error);
}
export function getDetailedErrorMessage(error: unknown): string {
  try {
    let internal = "";
    let extra = "";
    const base = getBaseMessage(error);

    const internalErrors = getInternalErrors(error);
    if (internalErrors && internalErrors.length > 0)
      internal = internalErrors.map((it) => getErrorMessage(it)).join("\n");

    if (error && typeof error === "object") {
      if ("code" in error) extra += ` (code=${error.code})`;
      if ("syscall" in error) extra += ` (syscall=${error.syscall})`;
      if ("status" in error) extra += ` (status=${error.status})`;
    }
    if (internal) return base + extra + "\n" + internal;
    return base + extra;
  } catch {
    return "Unknown error";
  }
}

function getBaseMessage(error: unknown): string {
  if (error && error instanceof Error) return error.message;
  if (!error) return "";
  return String(error);
}

function getInternalErrors(error: unknown): unknown[] | undefined {
  if (!error || typeof error !== "object") return;
  if (!("errors" in error)) return;
  // AxiosError
  const internalErrors = error.errors;
  if (Array.isArray(internalErrors)) return internalErrors;
}
