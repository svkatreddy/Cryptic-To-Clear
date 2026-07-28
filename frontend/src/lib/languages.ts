export type LanguageId =
  | "c"
  | "cpp"
  | "java"
  | "python"
  | "javascript"
  | "go"
  | "rust"
  | "php"
  | "kotlin"
  | "csharp"
  | "ruby"
  | "swift"
  | "typescript";

export interface LanguageConfig {
  id: LanguageId;
  label: string;
  monacoId: string;
  extension: string;
  accent: string;
  template: string;
  /** Whether the Express/Judge0 backend can currently execute this language. */
  judge0Supported: boolean;
}

export const LANGUAGES: LanguageConfig[] = [
  {
    id: "c",
    judge0Supported: true,
    label: "C",
    monacoId: "c",
    extension: "c",
    accent: "var(--syn-function)",
    template: `#include <stdio.h>

int main(void) {
    printf("Hello, CodeMentor AI!\\n");
    return 0;
}
`,
  },
  {
    id: "cpp",
    judge0Supported: true,
    label: "C++",
    monacoId: "cpp",
    extension: "cpp",
    accent: "var(--syn-function)",
    template: `#include <iostream>

int main() {
    std::cout << "Hello, CodeMentor AI!" << std::endl;
    return 0;
}
`,
  },
  {
    id: "java",
    judge0Supported: true,
    label: "Java",
    monacoId: "java",
    extension: "java",
    accent: "var(--syn-const)",
    template: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeMentor AI!");
    }
}
`,
  },
  {
    id: "python",
    judge0Supported: true,
    label: "Python",
    monacoId: "python",
    extension: "py",
    accent: "var(--syn-string)",
    template: `def main():
    print("Hello, CodeMentor AI!")


if __name__ == "__main__":
    main()
`,
  },
  {
    id: "javascript",
    judge0Supported: true,
    label: "JavaScript",
    monacoId: "javascript",
    extension: "js",
    accent: "var(--syn-cursor)",
    template: `function main() {
  console.log("Hello, CodeMentor AI!");
}

main();
`,
  },
  {
    id: "go",
    judge0Supported: true,
    label: "Go",
    monacoId: "go",
    extension: "go",
    accent: "var(--syn-function)",
    template: `package main

import "fmt"

func main() {
    fmt.Println("Hello, CodeMentor AI!")
}
`,
  },
  {
    id: "rust",
    judge0Supported: true,
    label: "Rust",
    monacoId: "rust",
    extension: "rs",
    accent: "var(--syn-const)",
    template: `fn main() {
    println!("Hello, CodeMentor AI!");
}
`,
  },
  {
    id: "php",
    judge0Supported: true,
    label: "PHP",
    monacoId: "php",
    extension: "php",
    accent: "var(--syn-keyword)",
    template: `<?php

function main() {
    echo "Hello, CodeMentor AI!\\n";
}

main();
`,
  },
  {
    id: "kotlin",
    judge0Supported: true,
    label: "Kotlin",
    monacoId: "kotlin",
    extension: "kt",
    accent: "var(--syn-keyword)",
    template: `fun main() {
    println("Hello, CodeMentor AI!")
}
`,
  },
  {
    id: "csharp",
    judge0Supported: true,
    label: "C#",
    monacoId: "csharp",
    extension: "cs",
    accent: "var(--syn-string)",
    template: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, CodeMentor AI!");
    }
}
`,
  },
  {
    id: "ruby",
    judge0Supported: false,
    label: "Ruby",
    monacoId: "ruby",
    extension: "rb",
    accent: "var(--syn-const)",
    template: `def main
  puts "Hello, CodeMentor AI!"
end

main
`,
  },
  {
    id: "swift",
    judge0Supported: false,
    label: "Swift",
    monacoId: "swift",
    extension: "swift",
    accent: "var(--syn-function)",
    template: `import Foundation

print("Hello, CodeMentor AI!")
`,
  },
  {
    id: "typescript",
    judge0Supported: false,
    label: "TypeScript",
    monacoId: "typescript",
    extension: "ts",
    accent: "var(--syn-function)",
    template: `function main(): void {
  console.log("Hello, CodeMentor AI!");
}

main();
`,
  },
];

export const getLanguage = (id: string): LanguageConfig =>
  LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[4];
