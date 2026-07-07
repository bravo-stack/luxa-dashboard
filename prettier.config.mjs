/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 90,
  tabWidth: 2,
  plugins: ['prettier-plugin-tailwindcss'],

  // If your app uses src/app/globals.css, change this path.
  tailwindStylesheet: './src/app/globals.css',
};

export default config;
