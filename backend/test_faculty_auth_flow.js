const app = require("./src/server");
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testFacultyAuthFlow() {
  console.log("=== Testing Faculty Auth & Faculty Dashboard Backend Integration ===");
  try {
    // 1. Test Demo Faculty Login
    console.log("1. Testing POST /api/auth/faculty-demo...");
    const demoRes = await axios.post(`${BASE_URL}/auth/faculty-demo`);
    console.log("  ✅ Demo Faculty Login Success:", demoRes.data.success);
    console.log("  ✅ Role:", demoRes.data.user.role, "| Name:", demoRes.data.user.name);

    const token = demoRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Test Overview API
    console.log("\n2. Testing GET /api/faculty/overview...");
    const overviewRes = await axios.get(`${BASE_URL}/faculty/overview`, authHeaders);
    console.log("  ✅ Overview Total Students:", overviewRes.data.data.totalStudents);
    console.log("  ✅ Overview Insights Count:", overviewRes.data.data.insights.length);

    // 3. Test Students API
    console.log("\n3. Testing GET /api/faculty/students...");
    const studentsRes = await axios.get(`${BASE_URL}/faculty/students`, authHeaders);
    console.log("  ✅ Roster Total Count:", studentsRes.data.data.pagination.total);
    console.log("  ✅ Sample Student Name:", studentsRes.data.data.students[0].name);

    // 4. Test Student Detail API
    console.log("\n4. Testing GET /api/faculty/students/std_001...");
    const detailRes = await axios.get(`${BASE_URL}/faculty/students/std_001`, authHeaders);
    console.log("  ✅ Detail Student Score:", detailRes.data.data.codingScore);

    // 5. Test Error Analytics & Language Analytics
    console.log("\n5. Testing Error & Language Analytics...");
    const errorRes = await axios.get(`${BASE_URL}/faculty/error-analytics`, authHeaders);
    const langRes = await axios.get(`${BASE_URL}/faculty/language-analytics`, authHeaders);
    console.log("  ✅ Errors Total Count:", errorRes.data.data.totalErrors);
    console.log("  ✅ Most Used Language:", langRes.data.data.mostUsedLanguage);

    // 6. Test Classes API
    console.log("\n6. Testing GET & POST /api/faculty/classes...");
    const classRes = await axios.get(`${BASE_URL}/faculty/classes`, authHeaders);
    console.log("  ✅ Classes Count:", classRes.data.data.classes.length);

    const newClassRes = await axios.post(
      `${BASE_URL}/faculty/classes`,
      { name: "CS 405 - Advanced Systems", section: "CS-4A", year: 4 },
      authHeaders
    );
    console.log("  ✅ Created New Class Section:", newClassRes.data.data.section);

    // 7. Test Reports & Subscription API
    console.log("\n7. Testing Reports & Subscription Architecture...");
    const reportsRes = await axios.get(`${BASE_URL}/faculty/reports`, authHeaders);
    const subRes = await axios.get(`${BASE_URL}/faculty/subscription`, authHeaders);
    console.log("  ✅ Generated Report Summary Total Students:", reportsRes.data.data.summary.totalStudents);
    console.log("  ✅ Subscription Faculty Seats:", subRes.data.data.facultySeatsUsed, "/", subRes.data.data.facultySeatsMax);

    console.log("\n=======================================================");
    console.log(" ALL FACULTY AUTH & DASHBOARD BACKEND TESTS PASSED! ");
    console.log("=======================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ Faculty Auth Test Failed:", err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

testFacultyAuthFlow();
