export type LanguageId =
  | "c"
  | "cpp"
  | "java"
  | "python";

export interface LanguageConfig {
  id: LanguageId;
  label: string;
  monacoId: string;
  extension: string;
  accent: string;
  template: string;
  /** Whether the Express backend can execute this language via Groq AI. */
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
];

export const getLanguage = (id: string): LanguageConfig =>
  LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
