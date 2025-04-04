/**
 * Simple CSS minifier that removes unnecessary whitespace and comments
 * @param css The CSS content to minify
 * @returns The minified CSS string
 */
export function minifyCSS(css: string): string {
  // Remove comments
  let result = css.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, "");

  // Remove newlines and tabs
  result = result.replace(/[\n\t]+/g, " ");

  // Remove spaces around special characters
  result = result.replace(/\s*([{}:;,])\s*/g, "$1");

  // Remove spaces before closing braces
  result = result.replace(/\s+}/g, "}");

  // Remove spaces after opening braces
  result = result.replace(/{\s+/g, "{");

  // Remove multiple spaces
  result = result.replace(/\s+/g, " ");

  // Trim the result
  return result.trim();
}
