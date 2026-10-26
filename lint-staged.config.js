const path = require('path');

const quote = (file) => `"${file.replace(/(["\\$`])/g, '\\$1')}"`;

const relativeTo = (dir, files) =>
  files.map((file) => quote(path.relative(dir, file))).join(' ');

const formatAll = (files) => `prettier --write ${files.map(quote).join(' ')}`;

module.exports = {
  'backend/{src,test,prisma,scripts}/**/*.ts': (files) => {
    const commands = [
      `pnpm --filter backend exec eslint --fix ${relativeTo('backend', files)}`,
    ];
    if (files.some((file) => file.endsWith('.ts'))) {
      commands.push(
        'pnpm --filter backend exec tsc --noEmit -p tsconfig.build.json',
      );
    }
    return commands;
  },
  'frontend/{src,test,scripts}/**/*.{ts,tsx}': (files) => {
    const commands = [
      `pnpm --filter frontend exec eslint --fix ${relativeTo('frontend', files)}`,
      'pnpm --filter frontend exec tsc --noEmit',
    ];
    return commands;
  },
  '*.{ts,tsx,js,jsx,json,md,yml,yaml,css,scss}': formatAll,
};
