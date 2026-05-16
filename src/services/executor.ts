/**
 *
 * Runs untrusted user code in an isolated Docker container.
 *
 * Architecture overview:
 * ┌─────────────────────────────────────────────────────────┐
 * │  Node.js process                                        │
 * │    → spawns docker CLI as a child process (no shell)    │
 * │        → Docker daemon creates a container              │
 * │            → container runs user code in isolation      │
 * │                → output written to bind-mounted file    │
 * │    → Node reads output file from host filesystem        │
 * └─────────────────────────────────────────────────────────┘
 *
 * Key isolation guarantees:
 *  - No network access (--network=none)
 *  - No linux capabilities (--cap-drop=ALL)
 *  - Read-only container filesystem (--read-only)
 *  - CPU and memory limits enforced by Docker
 *  - Hard timeout kills both the CLI process and the container
 */

import { spawn, execFile } from "child_process";
import { mkdir, writeFile, rm, readFile } from "fs/promises";
import { join } from "path";
import { promisify } from "util";
import { logger } from "../utils/logger.js";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecutionResult {
  status: "ACCEPTED" | "WRONG_ANSWER" | "TIMEOUT" | "RUNTIME_ERROR";
  /** The actual stdout output produced by the user's code */
  output?: string;
  /** Wall-clock time in milliseconds from container start to exit */
  executionTime: number;
}

// ---------------------------------------------------------------------------
// Language configuration
// ---------------------------------------------------------------------------

/**
 * Maps a language name to the Docker image and run command for that language.
 *
 * To add a new language, add an entry here. No other code needs to change.
 *
 * `image`     — the Docker image to pull and run
 * `command`   — the shell command executed inside the container to run the
 *               solution file. The file is always named `solution.<extension>`
 *               and is available at the working directory `/app`.
 * `extension` — file extension used when writing the code to disk
 */
const LANGUAGE_CONFIG: Record<
  string,
  { image: string; command: string; extension: string }
> = {
  python: {
    image: "python:3.11-slim",
    command: "python3 solution.py",
    extension: "py",
  },
  javascript: {
    image: "node:20-slim",
    command: "node solution.js",
    extension: "js",
  },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Base directory on the host where per-execution sandbox directories are
 * created. Each execution gets its own subdirectory so concurrent runs never
 * interfere with each other.
 *
 * Structure:
 *   <cwd>/tmp/
 *     sandbox-<timestamp>-<random>/
 *       solution.<ext>   ← user code
 *       input.txt        ← stdin fed to the program
 *       output.txt       ← stdout captured from the program
 */
const SANDBOX_DIR = join(process.cwd(), "tmp");

// ---------------------------------------------------------------------------
// Startup helpers
// ---------------------------------------------------------------------------

/**
 * Pre-pulls all Docker images defined in LANGUAGE_CONFIG.
 *
 * Call this once at worker startup. Without pre-pulling, the first execution
 * for each language would block for several seconds while Docker downloads the
 * image. After the pull, Docker uses the locally cached image and startup is
 * near-instant.
 */
export async function pullDockerImages(): Promise<void> {
  for (const config of Object.values(LANGUAGE_CONFIG)) {
    logger.info({ image: config.image }, "Pulling Docker image...");
    // .catch(() => {}) — if the pull fails (e.g. no internet), we log and
    // continue. The image may already be cached locally.
    await execFileAsync("docker", ["pull", config.image]).catch(() => {});
    logger.info({ image: config.image }, "Docker image ready");
  }
}

/**
 * Kills any sandbox containers left running from a previous server crash.
 *
 * Every sandbox container is started with `--label sandbox=true`. This lets
 * us query and kill all of them with a single Docker filter. Call this at
 * startup before accepting requests.
 *
 * Why this is needed: if the server crashes mid-execution, the `finally`
 * block in runCodeInSandbox never runs, so Docker containers can be left
 * running indefinitely consuming CPU and memory.
 */
export async function cleanupOrphanedContainers(): Promise<void> {
  try {
    // `docker ps -q` lists only container IDs (quiet mode)
    // `--filter label=sandbox=true` restricts to our sandbox containers
    const { stdout } = await execFileAsync("docker", [
      "ps",
      "-q",
      "--filter",
      "label=sandbox=true",
    ]);

    const containerIds = stdout.trim().split("\n").filter(Boolean);

    for (const id of containerIds) {
      await execFileAsync("docker", ["kill", id]).catch(() => {});
    }

    if (containerIds.length > 0) {
      logger.info(
        { count: containerIds.length },
        "Cleaned up orphaned containers",
      );
    }
  } catch {
    // Docker might not be running at all - ignore
  }
}

/**
 * Removes leftover `sandbox-*` directories from the tmp folder.
 *
 * Under normal operation each execution cleans up after itself in the
 * `finally` block. This function handles the edge case where a server crash
 * left directories behind, preventing unbounded disk usage over time.
 * Call this at startup alongside cleanupOrphanedContainers.
 */
export async function cleanupSandboxDir(): Promise<void> {
  try {
    const { readdir } = await import("fs/promises");
    const entries = await readdir(SANDBOX_DIR).catch(() => []);

    for (const entry of entries) {
      if (entry.startsWith("sandbox-")) {
        await rm(join(SANDBOX_DIR, entry), {
          recursive: true,
          force: true,
        }).catch(() => {});
      }
    }
  } catch {
    // Ignore — tmp dir may not exist yet on first startup
  }
}

// ---------------------------------------------------------------------------
// Core execution
// ---------------------------------------------------------------------------

/**
 * Runs user-submitted code against a single test case inside an isolated
 * Docker container and returns the result.
 *
 * @param code           - Raw source code submitted by the user
 * @param language       - Language key matching a LANGUAGE_CONFIG entry
 * @param input          - The stdin input for the test case
 * @param expectedOutput - The expected stdout output for the test case
 * @param timeLimitMs    - Hard wall-clock timeout in milliseconds (default 5s)
 *
 * @returns ExecutionResult with status, actual output, and execution time
 */
export async function runCodeInSandbox(
  code: string,
  language: string,
  input: string,
  expectedOutput: string,
  timeLimitMs: number = 5000,
): Promise<ExecutionResult> {
  const config = LANGUAGE_CONFIG[language];

  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // -------------------------------------------------------------------------
  // 1. Create a unique sandbox directory for this execution
  // -------------------------------------------------------------------------
  //
  // Each execution gets an isolated directory. Using both a timestamp and a
  // random suffix makes collisions practically impossible even under high
  // concurrency.
  //
  // The containerName matches the sandboxId so we can kill the container by
  // name if a timeout fires (docker kill <containerName>).

  const sandboxId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const containerName = `sandbox-${sandboxId}`;
  const sandboxDir = join(SANDBOX_DIR, `sandbox-${sandboxId}`);

  await mkdir(sandboxDir, { recursive: true });

  const codeFile = join(sandboxDir, `solution.${config.extension}`);
  const inputFile = join(sandboxDir, "input.txt");
  const outputFile = join(sandboxDir, "output.txt");

  // Write code and input to the sandbox directory on the host.
  await writeFile(codeFile, code);
  await writeFile(inputFile, input);

  // Pre-create output.txt with host-user ownership.
  //
  // The container runs as the host user (--user flag below). When Docker
  // bind-mounts the sandbox directory, file creation permissions are governed
  // by the host filesystem. If output.txt doesn't exist, `sh` inside the
  // container has to CREATE it, which can fail with "Permission denied"
  // depending on directory permissions. Pre-creating it means the container
  // only needs to WRITE to an existing file - a much more permissive operation.
  await writeFile(outputFile, "");

  let start: number = 0;

  try {
    logger.info({ language, sandboxDir }, "Executing code in sandbox...");

    // -----------------------------------------------------------------------
    // 2. Build the docker run arguments
    // -----------------------------------------------------------------------

    const dockerArgs = [
      "run",
      "--rm", // delete the container automatically after it exits

      "--name",
      containerName, // named so we can kill it by name on timeout

      "--cpus=0.5", // limit to half a CPU core
      "--memory=512M", // hard memory cap; process is OOM-killed if exceeded

      "--cap-drop=ALL", // drop ALL linux capabilities (no raw sockets, no mounting, no process signals to other users, etc.)

      "--network=none", // no network interface — the container cannot make any outbound or inbound connections

      "--read-only", // the container's own filesystem is read-only.
      // user code cannot install packages, modify binaries, or write anywhere except explicit mounts.

      "--tmpfs",
      "/tmp", // carve out a small in-memory writable /tmp.
      // some runtimes (Python, Node) need /tmp to function.
      // it lives in RAM only and is gone when the container exits.

      "--label",
      "sandbox=true", // tag this container so cleanupOrphanedContainers can find and kill it on the next server startup.

      // Run the container process as the same UID:GID as the Node.js process.
      //
      // Why: Docker bind-mounts preserve host filesystem permissions. The sandbox
      // directory is owned by the host user (e.g. UID 1000). If the container ran
      // as root (UID 0), the kernel would still deny writes in some configurations
      // because the mounted directory's permissions don't grant root access from
      // outside. Running as the same UID as the host user means the container
      // process is the same owner as the files - writes always succeed.
      //
      // Common concern: does matching the host UID give the container process all
      // the permissions the host user has?
      //
      // No. --user only sets the UID the process runs as INSIDE the container.
      // The actual containment comes from kernel namespace isolation, not the UID.
      //
      // So even running as UID 0 (root) inside the container, the process still
      // cannot touch /home/user - that path does not exist in the container's
      // mount namespace. Root inside a container is NOT the same as root on the host.
      //
      // --user is purely a file permission fix for the bind mount. The kernel checks:
      //   process UID → 1000  matches  file owner → 1000  →  write allowed!
      // That is the only thing UID matching buys us here.
      "--user",
      `${process.getuid!()}:${process.getgid!()}`,

      // Bind-mount the sandbox directory into the container at /app.
      //
      // This is NOT a file copy. The kernel maps the exact same inode (physical disk blocks) to two paths simultaneously:
      //   host:  /project/tmp/sandbox-123/  ← Node writes code + input here
      //   container: /app/                  ← container reads/writes here
      // Any write by the container to /app/output.txt is immediately visible
      // on the host at sandboxDir/output.txt - same bytes, same disk location.
      "-v",
      `${sandboxDir}:/app`,

      "-w",
      "/app", // set working directory inside container to /app
      // so `input.txt` and `output.txt` resolve correctly

      config.image, // the Docker image to run (e.g. python:3.11-slim)

      // The entrypoint: run sh with a -c script.
      //
      // IMPORTANT: "sh", "-c", and the script are THREE separate argv elements.
      // Because we use spawn() (not exec()), there is no intermediate host shell.
      // Node passes the args array directly to the OS via execve(). The script
      // string travels intact as a single argv element to the container's sh.
      // The container's sh then interprets `< input.txt > output.txt` as redirections inside /app.
      //
      // If we had used exec() instead, the HOST shell would see `< input.txt`
      // and try to open it relative to Node's cwd - not sandboxDir - and fail with "cannot open input.txt: No such file".
      "sh",
      "-c",
      `${config.command} < input.txt > output.txt`,
    ];

    // -----------------------------------------------------------------------
    // 3. Spawn docker as a child process and manage its lifecycle manually
    // -----------------------------------------------------------------------
    //
    // We use spawn() instead of execFileAsync() here because we need:
    //   a) a live process handle to attach a real timeout with SIGKILL
    //   b) incremental stderr collection (useful for runtime error messages)
    //
    // execFileAsync buffers everything and only resolves/rejects on exit —
    // you cannot kill it mid-execution from your own timeout logic.
    //
    // The Promise wrapper converts spawn's event-driven API back into a
    // promise so our async/await flow stays clean.

    start = Date.now();

    await new Promise<void>((resolve, reject) => {
      const child = spawn("docker", dockerArgs);

      // Collect stderr from the container.
      // This captures runtime errors (Python tracebacks, JS exceptions, etc.)
      // which are written to stderr rather than stdout.
      let stderr = "";
      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      // Hard timeout - fires if the container hasn't exited within timeLimitMs.
      //
      // We kill TWO things:
      //   1. child.kill("SIGKILL") - kills the `docker` CLI process
      //   2. docker kill containerName - sends SIGKILL to the container itself
      //
      // Killing only the CLI process is NOT enough. The Docker CLI is just a
      // client that talks to the Docker daemon. If the CLI dies, the daemon
      // keeps the container running. We must explicitly tell the daemon to
      // stop the container by name.
      //
      // SIGKILL (vs SIGTERM) cannot be caught or ignored by the target process.
      // It is an unconditional OS-level termination - guaranteed to stop it.
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        execFileAsync("docker", ["kill", containerName]).catch(() => {});
        const err = new Error("TIMEOUT") as any;
        err.killed = true;
        reject(err);
      }, timeLimitMs);

      // Normal exit - clear the timeout and resolve or reject based on exit code.
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        } else {
          // Non-zero exit code means the user's code crashed (uncaught exception, non-zero sys.exit(), etc.)
          const err = new Error(`Process exited with code ${code}`) as any;
          err.code = code;
          err.stderr = stderr;
          err.killed = false;
          reject(err);
        }
      });

      // Spawn-level error : docker binary not found, permission denied, etc.
      child.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // -----------------------------------------------------------------------
    // 4. Read output and compare against expected
    // -----------------------------------------------------------------------
    //
    // At this point the container has exited successfully (code 0).
    // output.txt on the host now contains whatever the user's code wrote to
    // stdout - because the bind mount made /app/output.txt and our host outputFile the same physical file.

    const executionTime = Date.now() - start;
    const actualOutput = (await readFile(outputFile, "utf8")).trim();

    if (actualOutput === expectedOutput.trim()) {
      logger.info({ executionTime }, "Test case ACCEPTED");
      return { status: "ACCEPTED", output: actualOutput, executionTime };
    } else {
      logger.info({ executionTime }, "Test case WRONG_ANSWER");
      return { status: "WRONG_ANSWER", output: actualOutput, executionTime };
    }
  } catch (error: any) {
    const executionTime = Date.now() - start;

    // Timeout - the container was killed by our setTimeout above
    if (error.killed) {
      logger.warn({ executionTime }, "Test case TIMEOUT");
      return { status: "TIMEOUT", executionTime };
    }

    // Runtime error - try to recover any partial output the code wrote before crashing.
    // Useful for debugging: if code printed 3 lines then threw on line 4, we return those 3 lines alongside the error.
    let output: string | undefined;
    try {
      output = (await readFile(outputFile, "utf8")).trim();
    } catch {
      // output.txt might be empty or unreadable - not a problem
    }

    logger.error(
      { error: error.stderr || error.message, executionTime },
      "Test case RUNTIME_ERROR",
    );
    return {
      status: "RUNTIME_ERROR",
      output: output || error.stderr || error.message,
      executionTime,
    };
  } finally {
    // -----------------------------------------------------------------------
    // 5. Cleanup - always runs regardless of success, error, or timeout
    // -----------------------------------------------------------------------
    //
    // Remove the sandbox directory from the host. This deletes code, input,
    // and output files so they don't accumulate on disk.
    //
    // Also attempt to remove the container by name. Under normal execution
    // `--rm` already removed it, so this is a no-op. But if the container
    // was left in a stopped (not removed) state for any reason, this cleans
    // it up. .catch(() => {}) silences the "no such container" error.
    await rm(sandboxDir, { recursive: true, force: true }).catch(() => {});
    await execFileAsync("docker", ["rm", "-f", containerName]).catch(() => {});
  }
}
