export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // replace spaces/special chars with -
    .replace(/(^-|-$)+/g, "");    // trim - from start/end
}
