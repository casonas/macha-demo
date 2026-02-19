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
const css = fs.readFileSync(cssFile, 'utf8');
fs.writeFileSync(cssFile, css.replace(/calc\(infinity \* 1px\)/g, '9999px'));
