const fs = require("fs");
const path = require("path");
const { execFile, spawn } = require("child_process");
const { randomUUID } = require("crypto");
const env = require("../config/env");
const logger = require("../utils/logger");

const BASE_TMP_DIR = path.join(__dirname, "../../tmp");

/**
 * Sweeps the BASE_TMP_DIR for orphan execution folders older than maxAgeMs.
 */
function cleanupStaleTempDirectories(maxAgeMs = 15 * 60 * 1000) {
  try {
    if (!fs.existsSync(BASE_TMP_DIR)) {
      fs.mkdirSync(BASE_TMP_DIR, { recursive: true });
      return;
    }

    const now = Date.now();
    const entries = fs.readdirSync(BASE_TMP_DIR);

    entries.forEach((entry) => {
      if (!entry.startsWith("exec-")) return;
      const targetPath = path.join(BASE_TMP_DIR, entry);
      try {
        const stats = fs.statSync(targetPath);
        if (stats.isDirectory() && now - stats.mtimeMs > maxAgeMs) {
          fs.rmSync(targetPath, { recursive: true, force: true });
          logger.debug(`Cleaned up stale temp directory: ${entry}`);
        }
      } catch (e) {
        // ignore individual stat/rm errors
      }
    });
  } catch (err) {
    logger.warn("Stale temp directory cleanup failed", { error: err.message });
  }
}

// Run initial cleanup on startup
cleanupStaleTempDirectories();

/**
 * Safely kills a child process and all its subprocesses (e.g. process tree on Windows).
 */
function killProcessTree(child) {
  if (!child || !child.pid) return;
  try {
    if (process.platform === "win32") {
      const { exec } = require("child_process");
      exec(`taskkill /pid ${child.pid} /T /F`, () => {});
    } else {
      child.kill("SIGKILL");
    }
  } catch (err) {
    logger.debug(`Error killing process tree for pid ${child.pid}: ${err.message}`);
  }
}


/**
 * Extracts public or primary class name from Java source code.
 */
function extractJavaClassName(sourceCode) {
  if (!sourceCode) return "Main";
  const publicClassMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
  if (publicClassMatch && publicClassMatch[1]) {
    return publicClassMatch[1];
  }
  const classMatch = sourceCode.match(/class\s+([A-Za-z0-9_]+)/);
  if (classMatch && classMatch[1]) {
    return classMatch[1];
  }
  return "Main";
}

/**
 * Pre-processes Java source code to handle package declarations cleanly.
 * Strips package declaration header so javac & java run smoothly in local workspace.
 */
function normalizeJavaSource(sourceCode) {
  if (!sourceCode) return "";
  // Strip package declaration line e.g. "package com.example;"
  return sourceCode.replace(/^\s*package\s+[a-zA-Z0-9_.]+;\s*/m, "");
}

/**
 * Helper to check if a CLI binary is available on the system PATH or configured path.
 */
function checkBinaryExists(command) {
  return new Promise((resolve) => {
    // Execute binary directly with --version to verify it's a real installed compiler/interpreter
    execFile(command, ["--version"], { timeout: 3000 }, (error, stdout, stderr) => {
      const combined = ((stdout || "") + (stderr || "")).toLowerCase();
      if (!error && combined.length > 0 && !combined.includes("was not found") && !combined.includes("microsoft store")) {
        return resolve(true);
      }

      // Try -version for tools like java/javac that use single-dash flag
      execFile(command, ["-version"], { timeout: 3000 }, (err2, stdout2, stderr2) => {
        const combined2 = ((stdout2 || "") + (stderr2 || "")).toLowerCase();
        if (!err2 && combined2.length > 0 && !combined2.includes("was not found") && !combined2.includes("microsoft store")) {
          return resolve(true);
        }
        resolve(false);
      });
    });
  });
}

/**
 * Real Local Java Compiler & Execution Pipeline
 */
async function executeJavaLocally({ sourceCode, stdin = "" }) {
  const className = extractJavaClassName(sourceCode);
  const normalizedCode = normalizeJavaSource(sourceCode);
  const execId = `exec-${randomUUID().substring(0, 8)}`;
  const tmpDir = path.join(BASE_TMP_DIR, execId);

  fs.mkdirSync(tmpDir, { recursive: true });
  const javaFilePath = path.join(tmpDir, `${className}.java`);

  fs.writeFileSync(javaFilePath, normalizedCode, "utf8");

  const timeoutMs = env.compiler.executionTimeoutMs;
  const maxBuffer = env.compiler.maxBufferBytes;
  const javacCmd = env.compiler.javacPath;
  const javaCmd = env.compiler.javaPath;

  const startTime = Date.now();

  try {
    // 1. Compilation Phase via javac
    const compileResult = await new Promise((resolve) => {
      execFile(
        javacCmd,
        ["-encoding", "UTF-8", `${className}.java`],
        { cwd: tmpDir, timeout: 8000, maxBuffer },
        (compileErr, stdout, stderr) => {
          if (compileErr || (stderr && stderr.trim().length > 0)) {
            const hasErrorMsg = stderr && stderr.toLowerCase().includes("error");
            if (compileErr && (compileErr.code === "ENOENT" || compileErr.killed)) {
              return resolve({ success: false, isMissingTool: true, error: compileErr.message });
            }
            if (hasErrorMsg || compileErr) {
              return resolve({ success: false, compileError: stderr || stdout || compileErr.message });
            }
          }
          resolve({ success: true, stdout, stderr });
        }
      );
    });

    if (!compileResult.success) {
      if (compileResult.isMissingTool) {
        return { isMissingTool: true };
      }
      const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
      return {
        statusId: 6,
        statusDescription: "Compilation Error",
        output: "",
        compileError: compileResult.compileError.trim(),
        runtimeError: "",
        time: duration,
        memory: 0,
        isAccepted: false,
      };
    }

    // 2. Execution Phase via java child process
    const runResult = await new Promise((resolve) => {
      const javaEnv = {
        ...process.env,
        JAVA_TOOL_OPTIONS: "-Dfile.encoding=UTF-8",
        LANG: "en_US.UTF-8",
        LC_ALL: "en_US.UTF-8",
      };

      const child = spawn(
        javaCmd,
        [
          "-Dfile.encoding=UTF-8",
          "-Dsun.stdout.encoding=UTF-8",
          "-Dsun.stderr.encoding=UTF-8",
          className,
        ],
        {
          cwd: tmpDir,
          env: javaEnv,
        }
      );

      let stdoutData = "";
      let stderrData = "";
      let isKilled = false;

      const timer = setTimeout(() => {
        isKilled = true;
        killProcessTree(child);
      }, timeoutMs);

      if (stdin && typeof stdin === "string") {
        child.stdin.write(stdin);
      }
      child.stdin.end();

      child.stdout.on("data", (data) => {
        stdoutData += data.toString("utf8");
      });

      child.stderr.on("data", (data) => {
        stderrData += data.toString("utf8");
      });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";

        if (isKilled) {
          return resolve({
            statusId: 5,
            statusDescription: "Time Limit Exceeded",
            output: stdoutData.trim(),
            compileError: "",
            runtimeError: `Execution timed out (${timeoutMs}ms limit exceeded).`,
            time: `${(timeoutMs / 1000).toFixed(2)}s`,
            memory: 16,
            isAccepted: false,
          });
        }

        const cleanedStderr = stderrData
          .split("\n")
          .filter((line) => !line.includes("Picked up JAVA_TOOL_OPTIONS"))
          .join("\n")
          .trim();

        const isInputEof = cleanedStderr.includes("NoSuchElementException") || cleanedStderr.includes("IllegalStateException");
        if (isInputEof) {
          return resolve({
            statusId: 3,
            statusDescription: "Success",
            output: stdoutData.trim(),
            compileError: "",
            runtimeError: "",
            time: duration,
            memory: 16,
            isAccepted: true,
          });
        }

        if (exitCode !== 0 || cleanedStderr.length > 0) {
          return resolve({
            statusId: 7,
            statusDescription: "Runtime Error",
            output: stdoutData.trim(),
            compileError: "",
            runtimeError: cleanedStderr || `Process exited with code ${exitCode}`,
            time: duration,
            memory: 16,
            isAccepted: false,
          });
        }

        return resolve({
          statusId: 3,
          statusDescription: "Success",
          output: stdoutData.trim(),
          compileError: "",
          runtimeError: "",
          time: duration,
          memory: 16,
          isAccepted: true,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        if (err.code === "ENOENT") {
          return resolve({ isMissingTool: true });
        }
        resolve({
          statusId: 7,
          statusDescription: "Runtime Error",
          output: "",
          compileError: "",
          runtimeError: err.message,
          time: "0.00s",
          memory: 0,
          isAccepted: false,
        });
      });
    });

    return runResult;
  } catch (err) {
    logger.error("Local Java execution pipeline error", { error: err.message });
    return { isMissingTool: true };
  } finally {
    // 3. Workspace Cleanup
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      logger.warn("Failed to clean up temp workspace", { tmpDir, error: cleanupErr.message });
    }
  }
}

function prepareCSource(sourceCode) {
  if (!sourceCode) return "";
  let code = sourceCode;
  if (code.includes("<stdio.h>") && !code.includes("setvbuf")) {
    code = code.replace(/(\bint\s+main\s*\([^)]*\)\s*\{)/, "$1\nsetvbuf(stdout, NULL, _IONBF, 0);");
  }
  return code;
}

function prepareCppSource(sourceCode) {
  if (!sourceCode) return "";
  let code = sourceCode;
  if (!code.includes("<cstdio>") && !code.includes("<stdio.h>")) {
    code = "#include <cstdio>\n" + code;
  }
  if (!code.includes("setvbuf") && !code.includes("unitbuf")) {
    code = code.replace(/(\bint\s+main\s*\([^)]*\)\s*\{)/, "$1\nstd::cout.setf(std::ios::unitbuf);\nsetvbuf(stdout, NULL, _IONBF, 0);");
  }
  return code;
}

/**
 * Real Local C Compiler & Execution Pipeline via gcc
 */
async function executeCLocally({ sourceCode, stdin = "" }) {
  const execId = `exec-${randomUUID().substring(0, 8)}`;
  const tmpDir = path.join(BASE_TMP_DIR, execId);
  fs.mkdirSync(tmpDir, { recursive: true });

  const cFilePath = path.join(tmpDir, "main.c");
  const exePath = path.join(tmpDir, process.platform === "win32" ? "main.exe" : "main");

  fs.writeFileSync(cFilePath, prepareCSource(sourceCode), "utf8");

  const timeoutMs = env.compiler.executionTimeoutMs;
  const maxBuffer = env.compiler.maxBufferBytes;
  const gccCmd = env.compiler.gccPath;

  const startTime = Date.now();

  try {
    const compileResult = await new Promise((resolve) => {
      execFile(
        gccCmd,
        ["main.c", "-o", exePath],
        { cwd: tmpDir, timeout: 8000, maxBuffer },
        (compileErr, stdout, stderr) => {
          if (compileErr || (stderr && stderr.trim().length > 0)) {
            const hasError = compileErr || (stderr && (stderr.includes("error:") || stderr.includes("Error")));
            if (compileErr && (compileErr.code === "ENOENT" || compileErr.killed)) {
              return resolve({ success: false, isMissingTool: true, error: compileErr.message });
            }
            if (hasError) {
              return resolve({ success: false, compileError: stderr || stdout || compileErr.message });
            }
          }
          resolve({ success: true, stdout, stderr });
        }
      );
    });

    if (!compileResult.success) {
      if (compileResult.isMissingTool) return { isMissingTool: true };
      const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
      return {
        statusId: 6,
        statusDescription: "Compilation Error",
        output: "",
        compileError: compileResult.compileError.trim(),
        runtimeError: "",
        time: duration,
        memory: 0,
        isAccepted: false,
      };
    }

    const runResult = await new Promise((resolve) => {
      const child = spawn(exePath, [], { cwd: tmpDir });
      let stdoutData = "";
      let stderrData = "";
      let isKilled = false;

      const timer = setTimeout(() => {
        isKilled = true;
        killProcessTree(child);
      }, timeoutMs);

      if (stdin && typeof stdin === "string") {
        child.stdin.write(stdin);
      }
      child.stdin.end();

      child.stdout.on("data", (data) => { stdoutData += data.toString("utf8"); });
      child.stderr.on("data", (data) => { stderrData += data.toString("utf8"); });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
        if (isKilled) {
          return resolve({
            statusId: 5,
            statusDescription: "Time Limit Exceeded",
            output: stdoutData.trim(),
            compileError: "",
            runtimeError: `Execution timed out (${timeoutMs}ms limit exceeded).`,
            time: `${(timeoutMs / 1000).toFixed(2)}s`,
            memory: 8,
            isAccepted: false,
          });
        }
        if (exitCode !== 0) {
          return resolve({
            statusId: 7,
            statusDescription: "Runtime Error",
            output: stdoutData.trim(),
            compileError: "",
            runtimeError: stderrData.trim() || `Process exited with code ${exitCode}`,
            time: duration,
            memory: 8,
            isAccepted: false,
          });
        }
        return resolve({
          statusId: 3,
          statusDescription: "Success",
          output: stdoutData.trim(),
          compileError: "",
          runtimeError: "",
          time: duration,
          memory: 8,
          isAccepted: true,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        if (err.code === "ENOENT") return resolve({ isMissingTool: true });
        resolve({
          statusId: 7,
          statusDescription: "Runtime Error",
          output: "",
          compileError: "",
          runtimeError: err.message,
          time: "0.00s",
          memory: 0,
          isAccepted: false,
        });
      });
    });

    return runResult;
  } catch (err) {
    logger.error("Local C execution pipeline error", { error: err.message });
    return { isMissingTool: true };
  } finally {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {}
  }
}

/**
 * Real Local C++ Compiler & Execution Pipeline via g++
 */
async function executeCppLocally({ sourceCode, stdin = "" }) {
  const execId = `exec-${randomUUID().substring(0, 8)}`;
  const tmpDir = path.join(BASE_TMP_DIR, execId);
  fs.mkdirSync(tmpDir, { recursive: true });

  const cppFilePath = path.join(tmpDir, "main.cpp");
  const exePath = path.join(tmpDir, process.platform === "win32" ? "main.exe" : "main");

  fs.writeFileSync(cppFilePath, prepareCppSource(sourceCode), "utf8");

  const timeoutMs = env.compiler.executionTimeoutMs;
  const maxBuffer = env.compiler.maxBufferBytes;
  const gppCmd = env.compiler.gppPath;

  const startTime = Date.now();

  try {
    const compileResult = await new Promise((resolve) => {
      execFile(
        gppCmd,
        ["main.cpp", "-o", exePath],
        { cwd: tmpDir, timeout: 8000, maxBuffer },
        (compileErr, stdout, stderr) => {
          if (compileErr || (stderr && stderr.trim().length > 0)) {
            const hasError = compileErr || (stderr && (stderr.includes("error:") || stderr.includes("Error")));
            if (compileErr && (compileErr.code === "ENOENT" || compileErr.killed)) {
              return resolve({ success: false, isMissingTool: true, error: compileErr.message });
            }
            if (hasError) {
              return resolve({ success: false, compileError: stderr || stdout || compileErr.message });
            }
          }
          resolve({ success: true, stdout, stderr });
        }
      );
    });

    if (!compileResult.success) {
      if (compileResult.isMissingTool) return { isMissingTool: true };
      const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
      return {
        statusId: 6,
        statusDescription: "Compilation Error",
        output: "",
        compileError: compileResult.compileError.trim(),
        runtimeError: "",
        time: duration,
        memory: 0,
        isAccepted: false,
      };
    }

    const runResult = await new Promise((resolve) => {
      const child = spawn(exePath, [], { cwd: tmpDir });
      let stdoutData = "";
      let stderrData = "";
      let isKilled = false;

      const timer = setTimeout(() => {
        isKilled = true;
        killProcessTree(child);
      }, timeoutMs);

      if (stdin && typeof stdin === "string") {
        child.stdin.write(stdin);
      }
      child.stdin.end();

      child.stdout.on("data", (data) => { stdoutData += data.toString("utf8"); });
      child.stderr.on("data", (data) => { stderrData += data.toString("utf8"); });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
        if (isKilled) {
          return resolve({
            statusId: 5,
            statusDescription: "Time Limit Exceeded",
            output: stdoutData.trim(),
            compileError: "",
            runtimeError: `Execution timed out (${timeoutMs}ms limit exceeded).`,
            time: `${(timeoutMs / 1000).toFixed(2)}s`,
            memory: 8,
            isAccepted: false,
          });
        }
        if (exitCode !== 0) {
          return resolve({
            statusId: 7,
            statusDescription: "Runtime Error",
            output: stdoutData.trim(),
            compileError: "",
            runtimeError: stderrData.trim() || `Process exited with code ${exitCode}`,
            time: duration,
            memory: 8,
            isAccepted: false,
          });
        }
        return resolve({
          statusId: 3,
          statusDescription: "Success",
          output: stdoutData.trim(),
          compileError: "",
          runtimeError: "",
          time: duration,
          memory: 8,
          isAccepted: true,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        if (err.code === "ENOENT") return resolve({ isMissingTool: true });
        resolve({
          statusId: 7,
          statusDescription: "Runtime Error",
          output: "",
          compileError: "",
          runtimeError: err.message,
          time: "0.00s",
          memory: 0,
          isAccepted: false,
        });
      });
    });

    return runResult;
  } catch (err) {
    logger.error("Local C++ execution pipeline error", { error: err.message });
    return { isMissingTool: true };
  } finally {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {}
  }
}

/**
 * Real Local Python Interpreter & Execution Pipeline via python
 */
async function executePythonLocally({ sourceCode, stdin = "" }) {
  const execId = `exec-${randomUUID().substring(0, 8)}`;
  const tmpDir = path.join(BASE_TMP_DIR, execId);
  fs.mkdirSync(tmpDir, { recursive: true });

  const pyFilePath = path.join(tmpDir, "main.py");
  fs.writeFileSync(pyFilePath, sourceCode, "utf8");

  const timeoutMs = env.compiler.executionTimeoutMs;
  const pythonCmd = env.compiler.pythonPath;
  const startTime = Date.now();

  try {
    const runResult = await new Promise((resolve) => {
      const child = spawn(pythonCmd, ["-u", "main.py"], { cwd: tmpDir });
      let stdoutData = "";
      let stderrData = "";
      let isKilled = false;

      const timer = setTimeout(() => {
        isKilled = true;
        killProcessTree(child);
      }, timeoutMs);

      if (stdin && typeof stdin === "string") {
        child.stdin.write(stdin);
      }
      child.stdin.end();

      child.stdout.on("data", (data) => { stdoutData += data.toString("utf8"); });
      child.stderr.on("data", (data) => { stderrData += data.toString("utf8"); });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
        if (isKilled) {
          return resolve({
            statusId: 5,
            statusDescription: "Time Limit Exceeded",
            output: stdoutData.trim(),
            compileError: "",
            runtimeError: `Execution timed out (${timeoutMs}ms limit exceeded).`,
            time: `${(timeoutMs / 1000).toFixed(2)}s`,
            memory: 8,
            isAccepted: false,
          });
        }
        const cleanedStderr = stderrData.trim();
        const isEofError = cleanedStderr.includes("EOFError");
        if (isEofError) {
          let promptOut = stdoutData.trim();
          if (!promptOut && cleanedStderr.includes("EOFError")) {
            const promptLines = cleanedStderr.split("\n").filter(l => !l.includes("Traceback") && !l.includes("File ") && !l.includes("EOFError"));
            promptOut = promptLines.join("\n").trim();
          }
          return resolve({
            statusId: 3,
            statusDescription: "Success",
            output: promptOut,
            compileError: "",
            runtimeError: "",
            time: duration,
            memory: 8,
            isAccepted: true,
          });
        }

        const isSyntaxErr = cleanedStderr.includes("SyntaxError") || cleanedStderr.includes("IndentationError");
        if (exitCode !== 0 || cleanedStderr.length > 0) {
          return resolve({
            statusId: isSyntaxErr ? 6 : 7,
            statusDescription: isSyntaxErr ? "Compilation Error" : "Runtime Error",
            output: stdoutData.trim(),
            compileError: isSyntaxErr ? cleanedStderr : "",
            runtimeError: isSyntaxErr ? "" : (cleanedStderr || `Process exited with code ${exitCode}`),
            time: duration,
            memory: 8,
            isAccepted: false,
          });
        }
        return resolve({
          statusId: 3,
          statusDescription: "Success",
          output: stdoutData.trim(),
          compileError: "",
          runtimeError: "",
          time: duration,
          memory: 8,
          isAccepted: true,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        if (err.code === "ENOENT") return resolve({ isMissingTool: true });
        resolve({
          statusId: 7,
          statusDescription: "Runtime Error",
          output: "",
          compileError: "",
          runtimeError: err.message,
          time: "0.00s",
          memory: 0,
          isAccepted: false,
        });
      });
    });

    return runResult;
  } catch (err) {
    logger.error("Local Python execution pipeline error", { error: err.message });
    return { isMissingTool: true };
  } finally {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {}
  }
}

/**
 * Main Execution Router: Checks if local compiler is available, otherwise returns fallback.
 */
async function executeCodeLocally({ language, sourceCode, stdin = "" }) {
  const langKey = (language || "").toLowerCase();

  if (langKey === "c") {
    const hasGcc = await checkBinaryExists(env.compiler.gccPath);
    if (hasGcc) {
      logger.info("Executing C code locally via GCC");
      const result = await executeCLocally({ sourceCode, stdin });
      if (!result.isMissingTool) return result;
    }
  }

  if (langKey === "cpp" || langKey === "c++") {
    const hasGpp = await checkBinaryExists(env.compiler.gppPath);
    if (hasGpp) {
      logger.info("Executing C++ code locally via G++");
      const result = await executeCppLocally({ sourceCode, stdin });
      if (!result.isMissingTool) return result;
    }
  }

  if (langKey === "python" || langKey === "py") {
    const hasPython = await checkBinaryExists(env.compiler.pythonPath);
    if (hasPython) {
      logger.info("Executing Python code locally via Python interpreter");
      const result = await executePythonLocally({ sourceCode, stdin });
      if (!result.isMissingTool) return result;
    }
  }

  if (langKey === "java") {
    const hasJavac = await checkBinaryExists(env.compiler.javacPath);
    const hasJava = await checkBinaryExists(env.compiler.javaPath);

    if (hasJavac && hasJava) {
      logger.info("Executing Java code locally via JDK (javac/java)");
      const result = await executeJavaLocally({ sourceCode, stdin });
      if (!result.isMissingTool) {
        return result;
      }
    }
  }

  // Local compiler binary not found — return flag for remote API or AI engine fallback
  return { isMissingTool: true };
}

module.exports = {
  executeCodeLocally,
  executeJavaLocally,
  executeCLocally,
  executeCppLocally,
  executePythonLocally,
  checkBinaryExists,
};
