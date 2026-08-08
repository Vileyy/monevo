module.exports = {
  "backend/src/**/*.{ts,js}": (filenames) => {
    const relativeFiles = filenames.map((file) =>
      file.replace(new RegExp("^.*backend/"), "")
    );
    const commands = [
      `pnpm --filter backend exec eslint --fix ${relativeFiles.join(" ")}`,
      `pnpm --filter backend exec prettier --write ${relativeFiles.join(" ")}`,
    ];
    if (filenames.some((file) => file.endsWith(".ts"))) {
      commands.push("pnpm --filter backend exec tsc --noEmit");
    }
    return commands;
  },
  "frontend/src/**/*.{ts,tsx,js,jsx}": (filenames) => {
    const relativeFiles = filenames.map((file) =>
      file.replace(new RegExp("^.*frontend/"), "")
    );
    const commands = [
      `pnpm --filter frontend exec eslint --fix ${relativeFiles.join(" ")}`,
      `pnpm --filter frontend exec prettier --write ${relativeFiles.join(" ")}`,
    ];
    if (filenames.some((file) => file.endsWith(".ts") || file.endsWith(".tsx"))) {
      commands.push("pnpm --filter frontend exec tsc --noEmit");
    }
    return commands;
  },
  "*.{json,md,yml}": (filenames) => {
    return `prettier --write ${filenames.join(" ")}`;
  },
};
