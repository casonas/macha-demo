module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,css}"],
  safelist: [
    'bg-slate-50',
    'text-slate-900',
    'antialiased',
    'bg-white',
    'border',
    'border-slate-100',
    'shadow-sm',
    'transition-all',
    'duration-300',
    'overflow-hidden',
    'shadow-md',
    'w-full',
    'border-collapse'
  ,
    {
      pattern: /^rounded.*/
    },
    {
      pattern: /^translate-.*$/
    },
    {
      pattern: /^text-\[.*\]$/
    },
    {
      pattern: /^rounded-\[.*\]$/
    },
    {
      pattern: /^-?translate-\[.*\]$/
    }
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
