import { Effect } from "effect"

const exec = (cmd: string[]): Effect.Effect<string, Error> =>
  Effect.tryPromise({
    try: async () => {
      const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" })
      const exitCode = await proc.exited
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      if (exitCode !== 0) {
        throw new Error(`Command failed: ${cmd.join(" ")}\n${stderr}`)
      }
      return stdout.trim()
    },
    catch: (error) => new Error(`Failed to execute: ${error}`),
  })

export const addSubmodule = (
  url: string,
  path: string,
  options?: { shallow?: boolean }
): Effect.Effect<string, Error> => {
  const cmd = ["git", "submodule", "add"]
  if (options?.shallow) {
    cmd.push("--depth", "1")
  }
  cmd.push(url, path)
  return exec(cmd)
}

export const updateSubmodules = (path?: string): Effect.Effect<string, Error> => {
  const cmd = ["git", "submodule", "update", "--remote", "--merge"]
  if (path) {
    cmd.push(path)
  }
  return exec(cmd)
}

export const initSubmodules = (): Effect.Effect<string, Error> =>
  exec(["git", "submodule", "update", "--init", "--recursive"])

export const submoduleStatus = (): Effect.Effect<string, Error> =>
  exec(["git", "submodule", "status"])
