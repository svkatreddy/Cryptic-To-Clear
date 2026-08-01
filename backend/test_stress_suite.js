const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:5000/api";
const BASE_TMP_DIR = path.join(__dirname, "tmp");

async function runStressTest(totalRequests = 100, concurrency = 10) {
  console.log(`\n==================================================`);
  console.log(` STRESS TEST: ${totalRequests} EXECUTIONS (Concurrency: ${concurrency})`);
  console.log(`==================================================`);

  const startTime = Date.now();
  let completed = 0;
  let successCount = 0;
  let errorCount = 0;

  const payloads = [
    { language: "c", sourceCode: '#include <stdio.h>\nint main() { printf("Stress Test C"); return 0; }' },
    { language: "cpp", sourceCode: '#include <iostream>\nint main() { std::cout << "Stress Test C++"; return 0; }' },
    { language: "java", sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("Stress Test Java"); } }' },
    { language: "python", sourceCode: 'print("Stress Test Python")' },
  ];

  async function worker(id) {
    while (completed < totalRequests) {
      const index = completed++;
      const payload = payloads[index % payloads.length];

      try {
        const res = await axios.post(`${BASE_URL}/execute`, payload, { timeout: 15000 });
        if (res.status === 200 && res.data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }).map((_, i) => worker(i));
  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const rps = (totalRequests / durationSec).toFixed(2);

  let remainingTempDirs = 0;
  if (fs.existsSync(BASE_TMP_DIR)) {
    remainingTempDirs = fs.readdirSync(BASE_TMP_DIR).length;
  }

  const mem = process.memoryUsage();
  console.log(`✓ Completed ${totalRequests} executions in ${durationSec}s (${rps} req/sec)`);
  console.log(`✓ Success: ${successCount} | Failures: ${errorCount}`);
  console.log(`✓ Residual Temp Directories in backend/tmp: ${remainingTempDirs}`);
  console.log(`✓ Node Memory Usage: RSS ${(mem.rss / 1024 / 1024).toFixed(1)}MB, Heap ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB`);

  return { successCount, errorCount, remainingTempDirs };
}

async function main() {
  console.log("Starting Phase 9 Stress Testing Suite...");
  await runStressTest(100, 10);
  await runStressTest(250, 15);
  console.log("\nStress Testing Suite Completed Successfully.");
}

main().catch(console.error);
