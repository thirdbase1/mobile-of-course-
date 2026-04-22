Fix options (choose one)
✅ Option 1 (Best): Force jsPDF to run only on the client
Wrap your import with dynamic loading:
TypeScript
Copy code
'use client'

import dynamic from 'next/dynamic'

const jsPDF = dynamic(() => import('jspdf'), { ssr: false })
OR even better (cleaner):
TypeScript
Copy code
'use client'

const generatePDF = async () => {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF()
  doc.text("Hello world", 10, 10)
  doc.save("file.pdf")
}
👉 This prevents SSR (where the error happens).
✅ Option 2: Use browser version explicitly
Sometimes forcing the browser build helps:
TypeScript
Copy code
import { jsPDF } from "jspdf/dist/jspdf.umd.min.js"
✅ Option 3: Disable Turbopack (quick fix)
In vercel.json or build settings:
JSON
Copy code
{
  "buildCommand": "next build --no-turbo"
}
👉 This switches back to Webpack (more stable for now).
✅ Option 4: Downgrade Next.js (if you want stability)
Bash
Copy code
pnpm add next@15
👉 Turbopack in v16 is still evolving and has issues like this.
⚠️ Also fix this warning
You have:
Copy code

⚠ The "middleware" file convention is deprecated.
👉 Rename:
Copy code

middleware.ts → proxy.ts
💡 Recommended approach (what I’d do)
If this is your project:
Use dynamic import (Option 1) ✅
Keep Next.js 16
Only disable SSR for PDF generation
