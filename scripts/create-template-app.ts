import { cp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const APPS_DIRECTORY_NAME = "apps";
const TEMPLATE_DIRECTORY_NAME = "000-template";
const TEMPLATE_SUFFIX = "-template";
const APP_NAME_PADDING = 3;

async function main(): Promise<void> {
  const rootDirectoryPath = process.cwd();
  const appsDirectoryPath = path.join(rootDirectoryPath, APPS_DIRECTORY_NAME);
  const sourceDirectoryPath = path.join(appsDirectoryPath, TEMPLATE_DIRECTORY_NAME);
  const targetDirectoryName = await getNextTemplateDirectoryName(appsDirectoryPath);
  const targetDirectoryPath = path.join(appsDirectoryPath, targetDirectoryName);

  await cp(sourceDirectoryPath, targetDirectoryPath, { recursive: true });
  await syncPackageName(targetDirectoryPath, targetDirectoryName);

  console.log({ created: path.relative(rootDirectoryPath, targetDirectoryPath) });
}

async function getNextTemplateDirectoryName(appsDirectoryPath: string): Promise<string> {
  let appNumber = 1;

  while (true) {
    const appPrefix = String(appNumber).padStart(APP_NAME_PADDING, "0");
    const appDirectoryName = `${appPrefix}${TEMPLATE_SUFFIX}`;
    const appDirectoryPath = path.join(appsDirectoryPath, appDirectoryName);

    try {
      await readFile(path.join(appDirectoryPath, "package.json"), "utf8");
      appNumber += 1;
    } catch {
      return appDirectoryName;
    }
  }
}

async function syncPackageName(
  targetDirectoryPath: string,
  targetDirectoryName: string,
): Promise<void> {
  const packageJsonPath = path.join(targetDirectoryPath, "package.json");
  const packageJsonContent = await readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonContent) as Record<string, unknown>;
  packageJson.name = targetDirectoryName;

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

main().catch((error: unknown) => {
  console.error({ error });
  process.exitCode = 1;
});
