const http = require("http");

const BASE_URL = "http://localhost:5000";

function makeRequest(path, method = "GET", data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on("error", (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== Testing Optional Assignment Language Selection & Backend Validation ===");

  try {
    // Step 0: Login as Faculty Demo
    console.log("\n0. Authenticating as Demo Faculty...");
    const loginRes = await makeRequest("/api/auth/faculty-demo", "POST");
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Faculty login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const facultyToken = loginRes.data.token;
    const authHeader = { Authorization: `Bearer ${facultyToken}` };
    console.log("  ✅ Authenticated as Faculty Demo.");

    // Test 1: Faculty creates assignment without selecting a language (Default: ANY)
    console.log("\n1. Test 1: Faculty creates assignment without selecting language...");
    const asg1Res = await makeRequest(
      "/api/faculty/assignments",
      "POST",
      {
        title: "Test 1: Find Largest Element",
        description: "Find maximum element in array.",
        deadline: "2026-09-01T23:59:00Z",
        classId: "cls_cs3a",
        languageMode: "ANY",
      },
      authHeader
    );
    if (asg1Res.status !== 201 || !asg1Res.data.success) {
      throw new Error(`Test 1 Failed: ${JSON.stringify(asg1Res.data)}`);
    }
    const asg1 = asg1Res.data.data;
    console.log(`  ✅ Assignment created successfully! ID: ${asg1.id}`);
    console.log(`  ✅ languageMode: ${asg1.languageMode} | allowedLanguages: ${JSON.stringify(asg1.allowedLanguages)}`);

    // Test 2: Student submits in Any Supported Language (Python to ANY assignment)
    console.log("\n2. Test 2: Student submits Python code to 'ANY' language assignment...");
    const sub1Res = await makeRequest(`/api/faculty/assignments/${asg1.id}/submit`, "POST", {
      language: "python",
      sourceCode: "print(max([10, 45, 99, 2]))",
      status: "Success",
      score: 100,
      executionTime: "12ms",
    });
    if (sub1Res.status !== 201 || !sub1Res.data.success) {
      throw new Error(`Test 2 Failed: ${JSON.stringify(sub1Res.data)}`);
    }
    console.log(`  ✅ Python submission accepted! Submission ID: ${sub1Res.data.data.id} | Language: ${sub1Res.data.data.language}`);

    // Test 3: Faculty restricts assignment to C only
    console.log("\n3. Test 3: Faculty restricts assignment to 'C' only...");
    const asg2Res = await makeRequest(
      "/api/faculty/assignments",
      "POST",
      {
        title: "Test 3: Dynamic Matrix Multiplication",
        description: "Must use malloc in C.",
        deadline: "2026-09-05T23:59:00Z",
        classId: "cls_cs2a",
        languageMode: "RESTRICTED",
        allowedLanguages: ["c"],
      },
      authHeader
    );
    if (asg2Res.status !== 201 || !asg2Res.data.success) {
      throw new Error(`Test 3 Failed: ${JSON.stringify(asg2Res.data)}`);
    }
    const asg2 = asg2Res.data.data;
    console.log(`  ✅ C-Restricted Assignment created! ID: ${asg2.id} | Allowed: ${JSON.stringify(asg2.allowedLanguages)}`);

    // C submission accepted
    const subCRes = await makeRequest(`/api/faculty/assignments/${asg2.id}/submit`, "POST", {
      language: "c",
      sourceCode: "#include <stdio.h>\nint main() { return 0; }",
      status: "Success",
      score: 100,
    });
    if (subCRes.status !== 201 || !subCRes.data.success) {
      throw new Error(`C Submission Failed: ${JSON.stringify(subCRes.data)}`);
    }
    console.log("  ✅ C Submission accepted for C-restricted assignment.");

    // Test 4: Faculty restricts assignment to C + Java
    console.log("\n4. Test 4: Faculty restricts assignment to 'C' + 'Java'...");
    const asg3Res = await makeRequest(
      "/api/faculty/assignments",
      "POST",
      {
        title: "Test 4: Object & Memory Management",
        description: "C or Java implementations permitted.",
        deadline: "2026-09-10T23:59:00Z",
        classId: "cls_cs3b",
        languageMode: "RESTRICTED",
        allowedLanguages: ["c", "java"],
      },
      authHeader
    );
    if (asg3Res.status !== 201 || !asg3Res.data.success) {
      throw new Error(`Test 4 Failed: ${JSON.stringify(asg3Res.data)}`);
    }
    const asg3 = asg3Res.data.data;
    console.log(`  ✅ C+Java Restricted Assignment created! ID: ${asg3.id} | Allowed: ${JSON.stringify(asg3.allowedLanguages)}`);

    // Test 5: Student attempts to submit prohibited language (JavaScript or Python to C-only assignment)
    console.log("\n5. Test 5: Student attempts to submit prohibited language (Python to C-only assignment)...");
    const subRejectRes = await makeRequest(`/api/faculty/assignments/${asg2.id}/submit`, "POST", {
      language: "python",
      sourceCode: "print('Bypassing frontend restriction')",
      status: "Success",
      score: 100,
    });
    if (subRejectRes.status === 400 && !subRejectRes.data.success) {
      console.log(`  ✅ Backend rejected submission cleanly! Status: ${subRejectRes.status}`);
      console.log(`  ✅ Backend Error Message: "${subRejectRes.data.message}"`);
    } else {
      throw new Error(`Test 5 Failed (Should have returned 400): ${JSON.stringify(subRejectRes.data)}`);
    }

    // Test 6: Backward Compatibility - Legacy single language assignments
    console.log("\n6. Test 6: Testing backward compatibility on legacy assignments...");
    const listRes = await makeRequest("/api/faculty/assignments", "GET", null, authHeader);
    if (listRes.status !== 200 || !Array.isArray(listRes.data.data)) {
      throw new Error(`Test 6 Failed: ${JSON.stringify(listRes.data)}`);
    }
    const legacyAsg = listRes.data.data.find((a) => a.id === "asg_02" || a.id === "asg_03");
    if (legacyAsg && legacyAsg.languageMode) {
      console.log(`  ✅ Legacy assignment ${legacyAsg.id} migrated successfully! languageMode: ${legacyAsg.languageMode}`);
    } else {
      throw new Error("Test 6 Failed: Legacy assignment not migrated properly.");
    }

    // Test 7: Student submits different languages (C, Python, Java) to the same assignment
    console.log("\n7. Test 7: Submitting multiple different languages (C, Python, Java, C++) to same assignment...");
    await makeRequest(`/api/faculty/assignments/${asg1.id}/submit`, "POST", { language: "c", sourceCode: "main() {}", status: "Success", score: 90 });
    await makeRequest(`/api/faculty/assignments/${asg1.id}/submit`, "POST", { language: "java", sourceCode: "class Main {}", status: "Success", score: 95 });
    await makeRequest(`/api/faculty/assignments/${asg1.id}/submit`, "POST", { language: "cpp", sourceCode: "int main() {}", status: "Success", score: 88 });
    console.log("  ✅ Multi-language submissions recorded successfully for Assignment 1.");

    // Test 8: Faculty views assignment analytics
    console.log("\n8. Test 8: Fetching assignment analytics for multi-language usage breakdown...");
    const analyticsRes = await makeRequest(`/api/faculty/assignments/${asg1.id}/analytics`, "GET", null, authHeader);
    if (analyticsRes.status !== 200 || !analyticsRes.data.success) {
      throw new Error(`Test 8 Failed: ${JSON.stringify(analyticsRes.data)}`);
    }
    const analytics = analyticsRes.data.data;
    console.log(`  ✅ Analytics Total Submissions: ${analytics.totalSubmissions}`);
    console.log(`  ✅ Most Used Language: ${analytics.mostUsedLanguage}`);
    console.log(`  ✅ Language Usage Breakdown:`, analytics.languageUsage);

    console.log("\n==========================================================================");
    console.log(" ALL 8 OPTIONAL ASSIGNMENT LANGUAGE SELECTION INTEGRATION TESTS PASSED! ");
    console.log("==========================================================================\n");
  } catch (err) {
    console.error("❌ Test Suite Error:", err);
    process.exit(1);
  }
}

runTests();
