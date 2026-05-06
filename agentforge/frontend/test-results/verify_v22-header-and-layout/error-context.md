# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verify_v22.spec.ts >> header and layout
- Location: verify_v22.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('header')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('header')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - main [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e5]
        - text: v2.0 is now live
      - heading "Your AI Senior Software Engineer" [level=1] [ref=e8]
      - paragraph [ref=e9]: AgentForge clones your repository into an isolated workspace, solves complex issues, writes tests, and pushes PRs—all from a single prompt.
      - generic [ref=e10]:
        - button "Continue with GitHub" [ref=e11]:
          - img [ref=e12]
          - text: Continue with GitHub
        - button "See it in action" [ref=e16]
      - generic [ref=e17]:
        - generic [ref=e18]:
          - img [ref=e20]
          - heading "Isolated Workspace" [level=3] [ref=e22]
          - paragraph [ref=e23]: Clones your repo to a secure /tmp workspace for execution.
        - generic [ref=e24]:
          - img [ref=e26]
          - heading "Act First, Ask Later" [level=3] [ref=e29]
          - paragraph [ref=e30]: Autonomous agent loop that verifies changes before committing.
        - generic [ref=e31]:
          - img [ref=e33]
          - heading "Any Stack" [level=3] [ref=e37]
          - paragraph [ref=e38]: Works with Python, JS, Go, Rust, and more via Wandbox.
      - generic [ref=e39]:
        - generic [ref=e41]: agentforge@v2.0 — isolated-workspace
        - generic [ref=e42]:
          - generic [ref=e43]: ➜ Cloning repository...
          - generic [ref=e44]: ✓ Workspace initialized at /tmp/af-92k1
          - generic [ref=e45]: ➜ Analyzing structure & imports...
          - generic [ref=e46]: ℹ Found Python/FastAPI stack. Starting logic redesign.
          - generic [ref=e47]: _
    - contentinfo [ref=e48]: © 2026 AgentForge. Securely powered by Groq & GitHub.
  - alert [ref=e49]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('header and layout', async ({ page }) => {
  4  |   await page.goto('http://localhost:3001');
> 5  |   await expect(page.locator('header')).toBeVisible();
     |                                        ^ Error: expect(locator).toBeVisible() failed
  6  |   await page.screenshot({ path: 'header_layout.png' });
  7  | });
  8  |
  9  | test('mobile dual tab', async ({ page }) => {
  10 |   await page.setViewportSize({ width: 375, height: 667 });
  11 |   await page.goto('http://localhost:3001');
  12 |   // Just verify it loads on mobile
  13 |   await page.screenshot({ path: 'mobile_v22.png' });
  14 | });
  15 |
```