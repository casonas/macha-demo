/**
 * Post-processes Tailwind v4 CSS output to fix compatibility issues
 * with CRA's CSS minimizer (postcss-calc).
 *
 * Tailwind v4 generates `calc(infinity * 1px)` for `.rounded-full`,
 * which is valid modern CSS but unsupported by the older postcss-calc
 * bundled with Create React App.
 */
const fs = require('fs');
const cssFile = './src/index.css';
let css = fs.readFileSync(cssFile, 'utf8');
css = css.replace(/calc\(infinity \* 1px\)/g, '9999px');
// Remove vertical-align: middle from rules that set display: block (ignored by browsers, triggers IDE warnings)
css = css.replace(/(display:\s*block;)\s*vertical-align:\s*middle;/g, '$1');
fs.writeFileSync(cssFile, css);
