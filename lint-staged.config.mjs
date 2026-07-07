const quote = (file) => `"${file}"`;

const buildEslintCommand = (files) =>
  `eslint --fix --max-warnings=0 ${files.map(quote).join(' ')}`;

const buildPrettierCommand = (files) => `prettier --write ${files.map(quote).join(' ')}`;

const lintStagedConfig = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand, buildPrettierCommand],
  '*.{json,css,md,mdx,yml,yaml}': [buildPrettierCommand],
};

export default lintStagedConfig;
