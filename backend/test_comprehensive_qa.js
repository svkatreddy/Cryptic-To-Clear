const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

const pause = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// ============================================================================
// SECTION 1: FEATURE MATRIX (C, C++, JAVA, PYTHON)
// ============================================================================
const FEATURE_TESTS = [
  // --- C LANGUAGE (15 TESTS) ---
  {
    category: "Hello World",
    lang: "c",
    code: `#include <stdio.h>\nint main() { printf("Hello World C\\n"); return 0; }`,
    stdin: "",
    expectOut: "Hello World C",
  },
  {
    category: "User Input",
    lang: "c",
    code: `#include <stdio.h>\nint main() { int age; scanf("%d", &age); printf("Age: %d", age); return 0; }`,
    stdin: "25",
    expectOut: "Age: 25",
  },
  {
    category: "Variables & Data Types",
    lang: "c",
    code: `#include <stdio.h>\nint main() { int a = 10; float b = 3.14; char c = 'Z'; printf("%d %.2f %c", a, b, c); return 0; }`,
    stdin: "",
    expectOut: "3.14 Z",
  },
  {
    category: "Operators",
    lang: "c",
    code: `#include <stdio.h>\nint main() { int sum = 15 + 5; int mul = 4 * 5; printf("sum=%d mul=%d", sum, mul); return 0; }`,
    stdin: "",
    expectOut: "sum=20 mul=20",
  },
  {
    category: "If-Else Statements",
    lang: "c",
    code: `#include <stdio.h>\nint main() { int num = 7; if(num % 2 == 0) printf("Even"); else printf("Odd"); return 0; }`,
    stdin: "",
    expectOut: "Odd",
  },
  {
    category: "Loops (for, while)",
    lang: "c",
    code: `#include <stdio.h>\nint main() { for(int i=1;i<=3;i++) printf("%d ", i); int j=1; while(j<=2){ printf("W%d ", j); j++; } return 0; }`,
    stdin: "",
    expectOut: "1 2 3 W1 W2",
  },
  {
    category: "Arrays",
    lang: "c",
    code: `#include <stdio.h>\nint main() { int arr[3] = {10, 20, 30}; printf("arr[1]=%d", arr[1]); return 0; }`,
    stdin: "",
    expectOut: "arr[1]=20",
  },
  {
    category: "Functions",
    lang: "c",
    code: `#include <stdio.h>\nint add(int a, int b){ return a + b; }\nint main() { printf("res=%d", add(4, 6)); return 0; }`,
    stdin: "",
    expectOut: "res=10",
  },
  {
    category: "Recursion",
    lang: "c",
    code: `#include <stdio.h>\nint fact(int n){ if(n<=1) return 1; return n * fact(n-1); }\nint main() { printf("fact5=%d", fact(5)); return 0; }`,
    stdin: "",
    expectOut: "fact5=120",
  },
  {
    category: "Structs & Objects",
    lang: "c",
    code: `#include <stdio.h>\ntypedef struct { int id; } User;\nint main() { User u = {101}; printf("User id=%d", u.id); return 0; }`,
    stdin: "",
    expectOut: "User id=101",
  },
  {
    category: "File Handling Simulation",
    lang: "c",
    code: `#include <stdio.h>\nint main() { printf("File Stream Mock: Success"); return 0; }`,
    stdin: "",
    expectOut: "File Stream Mock: Success",
  },
  {
    category: "Exception / Guard Logic",
    lang: "c",
    code: `#include <stdio.h>\nint main() { int denom = 0; if(denom == 0) printf("Error: Division by zero avoided"); return 0; }`,
    stdin: "",
    expectOut: "Error: Division by zero avoided",
  },
  {
    category: "Sorting Algorithms (Bubble Sort)",
    lang: "c",
    code: `#include <stdio.h>\nint main() { int a[3]={3,1,2}; for(int i=0;i<3;i++) for(int j=0;j<2;j++) if(a[j]>a[j+1]){ int t=a[j]; a[j]=a[j+1]; a[j+1]=t; } printf("%d %d %d", a[0], a[1], a[2]); return 0; }`,
    stdin: "",
    expectOut: "1 2 3",
  },
  {
    category: "Searching Algorithms (Binary Search)",
    lang: "c",
    code: `#include <stdio.h>\nint main() { int arr[5]={1,3,5,7,9}; int target=7, l=0, r=4, ans=-1; while(l<=r){ int m=l+(r-l)/2; if(arr[m]==target){ ans=m; break; } if(arr[m]<target) l=m+1; else r=m-1; } printf("Found at index %d", ans); return 0; }`,
    stdin: "",
    expectOut: "Found at index 3",
  },
  {
    category: "Large Loops (Performance)",
    lang: "c",
    code: `#include <stdio.h>\nint main() { long long sum=0; for(int i=1;i<=10000;i++) sum+=i; printf("Sum 10k: %lld", sum); return 0; }`,
    stdin: "",
    expectOut: "Sum 10k: 50005000",
  },

  // --- C++ LANGUAGE (15 TESTS) ---
  {
    category: "Hello World",
    lang: "cpp",
    code: `#include <iostream>\nint main() { std::cout << "Hello World C++" << std::endl; return 0; }`,
    stdin: "",
    expectOut: "Hello World C++",
  },
  {
    category: "User Input",
    lang: "cpp",
    code: `#include <iostream>\nint main() { int num; std::cin >> num; std::cout << "Num: " << num; return 0; }`,
    stdin: "99",
    expectOut: "Num: 99",
  },
  {
    category: "Variables & Data Types",
    lang: "cpp",
    code: `#include <iostream>\n#include <string>\nint main() { std::string s = "CPP"; double d = 2.718; std::cout << s << " " << d; return 0; }`,
    stdin: "",
    expectOut: "CPP 2.718",
  },
  {
    category: "Operators",
    lang: "cpp",
    code: `#include <iostream>\nint main() { std::cout << (10 % 3) << " " << (5 > 2); return 0; }`,
    stdin: "",
    expectOut: "1 1",
  },
  {
    category: "If-Else Statements",
    lang: "cpp",
    code: `#include <iostream>\nint main() { int val = 15; if(val > 10) std::cout << "Greater"; else std::cout << "Smaller"; return 0; }`,
    stdin: "",
    expectOut: "Greater",
  },
  {
    category: "Loops (for, while)",
    lang: "cpp",
    code: `#include <iostream>\nint main() { for(int i=0;i<3;i++) std::cout << i << " "; return 0; }`,
    stdin: "",
    expectOut: "0 1 2",
  },
  {
    category: "Arrays & Vectors",
    lang: "cpp",
    code: `#include <iostream>\n#include <vector>\nint main() { std::vector<int> v = {4, 5, 6}; std::cout << "v.size=" << v.size(); return 0; }`,
    stdin: "",
    expectOut: "v.size=3",
  },
  {
    category: "Functions",
    lang: "cpp",
    code: `#include <iostream>\nint multiply(int a, int b) { return a * b; }\nint main() { std::cout << multiply(3, 7); return 0; }`,
    stdin: "",
    expectOut: "21",
  },
  {
    category: "Recursion",
    lang: "cpp",
    code: `#include <iostream>\nint fib(int n) { if(n<=1) return n; return fib(n-1) + fib(n-2); }\nint main() { std::cout << "fib6=" << fib(6); return 0; }`,
    stdin: "",
    expectOut: "fib6=8",
  },
  {
    category: "Classes & Objects",
    lang: "cpp",
    code: `#include <iostream>\nclass Box { public: int w; Box(int width): w(width){} };\nint main() { Box b(12); std::cout << "Box w=" << b.w; return 0; }`,
    stdin: "",
    expectOut: "Box w=12",
  },
  {
    category: "File Handling Simulation",
    lang: "cpp",
    code: `#include <iostream>\nint main() { std::cout << "CPP File Stream Ready"; return 0; }`,
    stdin: "",
    expectOut: "CPP File Stream Ready",
  },
  {
    category: "Exception Handling",
    lang: "cpp",
    code: `#include <iostream>\nint main() { try { throw 404; } catch(int e) { std::cout << "Caught exception " << e; } return 0; }`,
    stdin: "",
    expectOut: "Caught exception 404",
  },
  {
    category: "Sorting Algorithms (std::sort)",
    lang: "cpp",
    code: `#include <iostream>\n#include <algorithm>\n#include <vector>\nint main() { std::vector<int> v={3,1,2}; std::sort(v.begin(), v.end()); for(int x: v) std::cout<<x<<" "; return 0; }`,
    stdin: "",
    expectOut: "1 2 3",
  },
  {
    category: "Searching Algorithms (std::binary_search)",
    lang: "cpp",
    code: `#include <iostream>\n#include <algorithm>\n#include <vector>\nint main() { std::vector<int> v={10,20,30}; std::cout << std::binary_search(v.begin(), v.end(), 20); return 0; }`,
    stdin: "",
    expectOut: "1",
  },
  {
    category: "Large Loops (Performance)",
    lang: "cpp",
    code: `#include <iostream>\nint main() { long long count=0; for(int i=0;i<5000;i++) count++; std::cout << "Count=" << count; return 0; }`,
    stdin: "",
    expectOut: "Count=5000",
  },

  // --- JAVA LANGUAGE (15 TESTS) ---
  {
    category: "Hello World",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { System.out.println("Hello World Java"); } }`,
    stdin: "",
    expectOut: "Hello World Java",
  },
  {
    category: "User Input",
    lang: "java",
    code: `import java.util.Scanner;\npublic class Main { public static void main(String[] args) { Scanner sc = new Scanner(System.in); int val = sc.nextInt(); System.out.println("Read: " + val); } }`,
    stdin: "77",
    expectOut: "Read: 77",
  },
  {
    category: "Variables & Data Types",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { String name = "CodeMentor"; boolean active = true; System.out.println(name + " " + active); } }`,
    stdin: "",
    expectOut: "CodeMentor true",
  },
  {
    category: "Operators",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { int res = 100 / 4; System.out.println("res=" + res); } }`,
    stdin: "",
    expectOut: "res=25",
  },
  {
    category: "If-Else Statements",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { int score = 85; if(score >= 80) System.out.println("Grade A"); else System.out.println("Grade B"); } }`,
    stdin: "",
    expectOut: "Grade A",
  },
  {
    category: "Loops (for, while)",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { for(int i=1;i<=3;i++) System.out.print(i + " "); } }`,
    stdin: "",
    expectOut: "1 2 3",
  },
  {
    category: "Arrays",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { int[] arr = {5, 10, 15}; System.out.println("len=" + arr.length + " first=" + arr[0]); } }`,
    stdin: "",
    expectOut: "len=3 first=5",
  },
  {
    category: "Functions / Methods",
    lang: "java",
    code: `public class Main { static int square(int x) { return x * x; } public static void main(String[] args) { System.out.println("sq=" + square(6)); } }`,
    stdin: "",
    expectOut: "sq=36",
  },
  {
    category: "Recursion",
    lang: "java",
    code: `public class Main { static int power(int base, int exp) { if(exp==0) return 1; return base * power(base, exp-1); } public static void main(String[] args) { System.out.println("2^5=" + power(2, 5)); } }`,
    stdin: "",
    expectOut: "2^5=32",
  },
  {
    category: "Classes & Objects",
    lang: "java",
    code: `class Car { String brand; Car(String b){ this.brand = b; } }\npublic class Main { public static void main(String[] args) { Car c = new Car("Tesla"); System.out.println("Car=" + c.brand); } }`,
    stdin: "",
    expectOut: "Car=Tesla",
  },
  {
    category: "File Handling Simulation",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { System.out.println("Java File IO Ready"); } }`,
    stdin: "",
    expectOut: "Java File IO Ready",
  },
  {
    category: "Exception Handling",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { try { int x = 10 / 0; } catch (ArithmeticException e) { System.out.println("Caught / by zero"); } } }`,
    stdin: "",
    expectOut: "Caught / by zero",
  },
  {
    category: "Sorting Algorithms (Arrays.sort)",
    lang: "java",
    code: `import java.util.Arrays;\npublic class Main { public static void main(String[] args) { int[] nums = {4, 1, 3}; Arrays.sort(nums); System.out.println(Arrays.toString(nums)); } }`,
    stdin: "",
    expectOut: "[1, 3, 4]",
  },
  {
    category: "Searching Algorithms (Binary Search)",
    lang: "java",
    code: `import java.util.Arrays;\npublic class Main { public static void main(String[] args) { int[] nums = {10, 20, 30, 40}; int idx = Arrays.binarySearch(nums, 30); System.out.println("idx=" + idx); } }`,
    stdin: "",
    expectOut: "idx=2",
  },
  {
    category: "Large Loops (Performance)",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { long total = 0; for(int i=1; i<=5000; i++) total += i; System.out.println("total=" + total); } }`,
    stdin: "",
    expectOut: "total=12502500",
  },

  // --- PYTHON LANGUAGE (15 TESTS) ---
  {
    category: "Hello World",
    lang: "python",
    code: `print("Hello World Python")`,
    stdin: "",
    expectOut: "Hello World Python",
  },
  {
    category: "User Input",
    lang: "python",
    code: `val = input("Enter: ")\nprint(f"Read {val}")`,
    stdin: "Python3",
    expectOut: "Read Python3",
  },
  {
    category: "Variables & Data Types",
    lang: "python",
    code: `x = 42\ny = 3.14\nz = "AI"\nprint(type(x).__name__, type(y).__name__, type(z).__name__)`,
    stdin: "",
    expectOut: "int float str",
  },
  {
    category: "Operators",
    lang: "python",
    code: `print(2 ** 5, 17 // 5)`,
    stdin: "",
    expectOut: "32 3",
  },
  {
    category: "If-Else Statements",
    lang: "python",
    code: `status = "active"\nif status == "active":\n    print("System Online")\nelse:\n    print("Offline")`,
    stdin: "",
    expectOut: "System Online",
  },
  {
    category: "Loops (for, while)",
    lang: "python",
    code: `for i in range(1, 4):\n    print(i, end=" ")\nprint()`,
    stdin: "",
    expectOut: "1 2 3",
  },
  {
    category: "Arrays & Lists",
    lang: "python",
    code: `lst = [10, 20, 30]\nlst.append(40)\nprint("len=", len(lst), "last=", lst[-1])`,
    stdin: "",
    expectOut: "len= 4 last= 40",
  },
  {
    category: "Functions",
    lang: "python",
    code: `def greet(name):\n    return f"Hello {name}"\nprint(greet("Alice"))`,
    stdin: "",
    expectOut: "Hello Alice",
  },
  {
    category: "Recursion",
    lang: "python",
    code: `def gcd(a, b):\n    return a if b == 0 else gcd(b, a % b)\nprint("gcd=", gcd(48, 18))`,
    stdin: "",
    expectOut: "gcd= 6",
  },
  {
    category: "Classes & Objects",
    lang: "python",
    code: `class Student:\n    def __init__(self, name):\n        self.name = name\ns = Student("Bob")\nprint(f"Student: {s.name}")`,
    stdin: "",
    expectOut: "Student: Bob",
  },
  {
    category: "File Handling Simulation",
    lang: "python",
    code: `print("Python File API Ready")`,
    stdin: "",
    expectOut: "Python File API Ready",
  },
  {
    category: "Exception Handling",
    lang: "python",
    code: `try:\n    res = 10 / 0\nexcept ZeroDivisionError:\n    print("Caught division by zero")`,
    stdin: "",
    expectOut: "Caught division by zero",
  },
  {
    category: "Sorting Algorithms (sorted)",
    lang: "python",
    code: `nums = [5, 2, 8, 1]\nprint(sorted(nums))`,
    stdin: "",
    expectOut: "[1, 2, 5, 8]",
  },
  {
    category: "Searching Algorithms (bisect)",
    lang: "python",
    code: `import bisect\nnums = [10, 20, 30, 40]\nidx = bisect.bisect_left(nums, 30)\nprint("idx=", idx)`,
    stdin: "",
    expectOut: "idx= 2",
  },
  {
    category: "Large Loops (Performance)",
    lang: "python",
    code: `total = sum(range(1, 5001))\nprint("total=", total)`,
    stdin: "",
    expectOut: "total= 12502500",
  },
];

// ============================================================================
// SECTION 2: COMPILER & SYNTAX ERROR TESTING
// ============================================================================
const COMPILER_ERROR_TESTS = [
  {
    name: "Missing Semicolon (C)",
    lang: "c",
    code: `#include <stdio.h>\nint main() { printf("Hello") return 0; }`,
  },
  {
    name: "Missing Closing Brace (C)",
    lang: "c",
    code: `#include <stdio.h>\nint main() { printf("Hello"); `,
  },
  {
    name: "Missing Parenthesis (C++)",
    lang: "cpp",
    code: `#include <iostream>\nint main() { if(true std::cout << "Hi"; return 0; }`,
  },
  {
    name: "Undefined Variable (C++)",
    lang: "cpp",
    code: `#include <iostream>\nint main() { std::cout << undefined_var; return 0; }`,
  },
  {
    name: "Missing Class Name / Invalid Class (Java)",
    lang: "java",
    code: `public class { public static void main(String[] args){} }`,
  },
  {
    name: "Missing Import for Scanner (Java)",
    lang: "java",
    code: `public class Main { public static void main(String[] args){ Scanner sc = new Scanner(System.in); } }`,
  },
  {
    name: "Missing Header stdio.h (C)",
    lang: "c",
    code: `int main() { printf("Missing stdio header"); return 0; }`,
  },
  {
    name: "Python Syntax Error (Missing Colon)",
    lang: "python",
    code: `if True\n    print("Missing colon")`,
  },
];

// ============================================================================
// SECTION 3: RUNTIME ERROR TESTING
// ============================================================================
const RUNTIME_ERROR_TESTS = [
  {
    name: "Division by Zero (Java)",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { int x = 10 / 0; } }`,
  },
  {
    name: "Array Index Out of Bounds (Java)",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { int[] arr = new int[2]; System.out.println(arr[5]); } }`,
  },
  {
    name: "Null Pointer Reference (Java)",
    lang: "java",
    code: `public class Main { public static void main(String[] args) { String s = null; System.out.println(s.length()); } }`,
  },
  {
    name: "Zero Division Error (Python)",
    lang: "python",
    code: `val = 10 / 0`,
  },
  {
    name: "IndexError (Python)",
    lang: "python",
    code: `lst = [1, 2]\nprint(lst[99])`,
  },
];

// ============================================================================
// RUNNER FUNCTION
// ============================================================================
async function runComprehensiveQA() {
  console.log("==========================================================");
  console.log("  Cryptic to Clear COMPILER: COMPLETE END-TO-END QA SUITE ");
  console.log("==========================================================\n");

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  // --- SECTION 1: FEATURE MATRIX ---
  console.log("\n=========================================");
  console.log(" 1. FEATURE MATRIX VERIFICATION (C, C++, Java, Python)");
  console.log("=========================================");

  for (const t of FEATURE_TESTS) {
    totalTests++;
    try {
      const res = await axios.post(`${BASE_URL}/execute`, {
        language: t.lang,
        sourceCode: t.code,
        stdin: t.stdin,
      });

      const data = res.data;
      const cleanOut = (data.output || "").trim();
      const pass = data.success && data.statusId === 3 && (t.expectOut ? cleanOut.includes(t.expectOut) : true);

      if (pass) {
        console.log(`  ✅ [PASS] [${t.lang.toUpperCase()}] ${t.category}: "${cleanOut.split("\n")[0]}"`);
        totalPassed++;
      } else {
        console.log(`  ❌ [FAIL] [${t.lang.toUpperCase()}] ${t.category}`);
        console.log(`     Got: "${cleanOut}" | Status: ${data.statusDescription}`);
        totalFailed++;
      }
    } catch (err) {
      console.log(`  ❌ [FAIL] [${t.lang.toUpperCase()}] ${t.category}:`, err.message);
      totalFailed++;
    }
    await pause();
  }

  // --- SECTION 2: COMPILER ERRORS & AI EXPLANATIONS ---
  console.log("\n=========================================");
  console.log(" 2. COMPILER ERROR & AI EXPLANATION TESTING");
  console.log("=========================================");

  for (const t of COMPILER_ERROR_TESTS) {
    totalTests++;
    try {
      const execRes = await axios.post(`${BASE_URL}/execute`, {
        language: t.lang,
        sourceCode: t.code,
      });

      const execData = execRes.data;
      const hasError = execData.compileError || execData.statusId === 6 || !execData.isAccepted;

      if (hasError) {
        // Trigger AI Explanation
        const errText = execData.compileError || execData.runtimeError || "Compilation Error";
        const expRes = await axios.post(`${BASE_URL}/explain`, {
          language: t.lang,
          error: errText,
          sourceCode: t.code,
        });

        if (expRes.data.success && expRes.data.explanation.errorSummary) {
          console.log(`  ✅ [PASS] ${t.name}: Detected Error & AI Explained -> "${expRes.data.explanation.errorSummary}"`);
          totalPassed++;
        } else {
          console.log(`  ❌ [FAIL] ${t.name}: Error detected but AI Explanation failed`);
          totalFailed++;
        }
      } else {
        console.log(`  ❌ [FAIL] ${t.name}: Expected compilation error but execution succeeded`);
        totalFailed++;
      }
    } catch (err) {
      console.log(`  ❌ [FAIL] ${t.name}:`, err.message);
      totalFailed++;
    }
    await pause();
  }

  // --- SECTION 3: RUNTIME ERRORS & DIAGNOSTICS ---
  console.log("\n=========================================");
  console.log(" 3. RUNTIME ERROR & DIAGNOSTICS TESTING");
  console.log("=========================================");

  for (const t of RUNTIME_ERROR_TESTS) {
    totalTests++;
    try {
      const execRes = await axios.post(`${BASE_URL}/execute`, {
        language: t.lang,
        sourceCode: t.code,
      });

      const execData = execRes.data;
      const isRuntimeErr = execData.runtimeError || execData.statusId === 7 || execData.statusId === 13 || !execData.isAccepted;

      if (isRuntimeErr) {
        console.log(`  ✅ [PASS] ${t.name}: Runtime Error Caught -> "${(execData.runtimeError || execData.statusDescription).trim().split("\n")[0]}"`);
        totalPassed++;
      } else {
        console.log(`  ❌ [FAIL] ${t.name}: Expected runtime error but code succeeded`);
        totalFailed++;
      }
    } catch (err) {
      console.log(`  ❌ [FAIL] ${t.name}:`, err.message);
      totalFailed++;
    }
    await pause();
  }

  // --- SECTION 4: SECURITY & BOUNDARY TESTING ---
  console.log("\n=========================================");
  console.log(" 4. SECURITY & BOUNDARY TESTING");
  console.log("=========================================");

  // Test 4.1: Empty Code Validation
  totalTests++;
  try {
    const res = await axios.post(`${BASE_URL}/execute`, { language: "python", sourceCode: "   " });
    if (!res.data.success) {
      console.log(`  ✅ [PASS] Empty Code Validation: Rejected with message "${res.data.message}"`);
      totalPassed++;
    } else {
      console.log(`  ❌ [FAIL] Empty Code Validation: Accepted empty string`);
      totalFailed++;
    }
  } catch (err) {
    if (err.response?.status === 400) {
      console.log(`  ✅ [PASS] Empty Code Validation: Correctly returned 400 Bad Request`);
      totalPassed++;
    } else {
      console.log(`  ❌ [FAIL] Empty Code Validation:`, err.message);
      totalFailed++;
    }
  }

  // Test 4.2: Missing Language Parameter
  totalTests++;
  try {
    const res = await axios.post(`${BASE_URL}/execute`, { sourceCode: "print('hello')" });
    console.log(`  ❌ [FAIL] Missing Language Validation: Accepted missing language`);
    totalFailed++;
  } catch (err) {
    if (err.response?.status === 400) {
      console.log(`  ✅ [PASS] Missing Language Validation: Correctly returned 400 Bad Request`);
      totalPassed++;
    } else {
      console.log(`  ❌ [FAIL] Missing Language Validation:`, err.message);
      totalFailed++;
    }
  }

  // --- FINAL SUMMARY ---
  console.log("\n=========================================");
  console.log(` FINAL QA RESULTS: ${totalPassed} / ${totalTests} TESTS PASSED (${Math.round((totalPassed / totalTests) * 100)}%)`);
  console.log("=========================================\n");
}

runComprehensiveQA();
