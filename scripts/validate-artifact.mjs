import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");

const [source, manifest] = await Promise.all([
  readFile(workerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
JSON.parse(manifest);

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  "function",
  `${pathToFileURL(workerPath)} must export default.fetch`,
);

// Validate that the static UI's choices have matching, freshly generated reports.
const staticHtml = await readFile(resolve(projectRoot, "public/index.html"), "utf8");
const staticIcon = await readFile(resolve(projectRoot, "public/icon.svg"), "utf8");
assert.match(staticHtml, /rel="icon" type="image\/svg\+xml" href="\.\/icon\.svg"/);
assert.match(staticIcon, /<svg[\s>]/);
for (const window of [5, 10, 15]) {
  assert.match(staticHtml, new RegExp(`<option value="${window}">${window} sorteos</option>`));
  const report = JSON.parse(await readFile(resolve(projectRoot, `public/data/ai-analysis-${window}.json`), "utf8"));
  assert.equal(report.window, window);
  assert.equal(report.status, "ready");
}
const defaultReport = JSON.parse(await readFile(resolve(projectRoot, "data/ai-analysis.json"), "utf8"));
const defaultModel = JSON.parse(await readFile(resolve(projectRoot, "data/ai-model.json"), "utf8"));
assert.equal(defaultReport.window, 30);
assert.equal(defaultReport.status, "ready");
assert.equal(defaultModel.window, 30);
assert.equal(defaultModel.version, defaultReport.modelState.version);

console.log("Artifact is valid ESM, exports default.fetch, and contains consistent AI reports");
