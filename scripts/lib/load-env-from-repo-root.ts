import { dirname, join } from "node:path";

/**
 * Loads environment variables from the .env file at the real git repo root.
 *
 * Bun auto-loads .env from the current working directory, but in git worktrees
 * the cwd is a separate directory that won't have .env (since it's gitignored).
 * This function uses git to find the original repo root and loads .env from there,
 * so scripts work seamlessly in both normal repos and worktrees.
 *
 * Only sets variables that aren't already in process.env (no overwriting).
 */
export async function loadEnvFromRepoRoot(): Promise<void> {
  const result = Bun.spawnSync(
    ["git", "rev-parse", "--path-format=absolute", "--git-common-dir"],
    { stderr: "pipe" },
  );

  if (!result.success) {
    return;
  }

  const gitCommonDirectory = result.stdout.toString().trim();
  const repoRoot = dirname(gitCommonDirectory);
  const environmentFile = Bun.file(join(repoRoot, ".env"));

  if (!(await environmentFile.exists())) {
    return;
  }

  const content = await environmentFile.text();

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
