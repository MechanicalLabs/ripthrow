const entrypoints = [
  "./src/index.ts",
  "./src/factories/index.ts",
  "./src/operators/index.ts",
  "./src/consumers/index.ts",
  "./src/utils/index.ts",
  "./src/types/index.ts",
];

const result = await Bun.build({
  entrypoints,
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: {
    syntax: true,
    whitespace: true,
  },
  sourcemap: "external",
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

console.log("JS bundle build succeeded!");

// Emit type declarations using tsc
const tsc = Bun.spawnSync(["bun", "x", "tsc", "--project", "tsconfig.build.json"], {
  cwd: import.meta.dir,
});

if (!tsc.success) {
  console.error("Type declaration generation failed:");
  console.error(tsc.stderr.toString());
  process.exit(1);
}

console.log("Type declarations generated!");
