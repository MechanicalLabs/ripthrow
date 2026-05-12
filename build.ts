import { execSync } from "node:child_process";

const entrypoints = [
  "./src/index.ts",
  "./src/factories/index.ts",
  "./src/operators/index.ts",
  "./src/consumers/index.ts",
  "./src/utils/index.ts",
  "./src/types/index.ts",
];

console.log("Building JS bundles with esbuild...");

for (const entrypoint of entrypoints) {
  // Determine output path relative to dist
  const outPath = entrypoint.replace("./src/", "./dist/").replace(".ts", ".js");
  
  try {
    execSync(
      `bun x esbuild ${entrypoint} --bundle --format=esm --target=esnext --minify --sourcemap --outfile=${outPath}`,
      { stdio: "inherit" }
    );
  } catch (error) {
    console.error(`Build failed for ${entrypoint}`);
    process.exit(1);
  }
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
