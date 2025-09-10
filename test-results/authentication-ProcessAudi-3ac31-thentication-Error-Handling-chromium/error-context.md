# Page snapshot

```yaml
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
- alert
- dialog:
  - heading "Build Error" [level=1]
  - paragraph: Failed to compile
  - text: Next.js (14.2.31) is outdated
  - link "(learn more)":
    - /url: https://nextjs.org/docs/messages/version-staleness
  - link "./pages/api/pdf-preview.js:8:22":
    - text: ./pages/api/pdf-preview.js:8:22
    - img
  - text: "Module not found: Can't resolve '../../services/pdf/PDFGenerator' 6 | */ 7 | > 8 | const PDFGenerator = require('../../services/pdf/PDFGenerator') | ^ 9 | 10 | export const config = { 11 | api: {"
  - link "https://nextjs.org/docs/messages/module-not-found":
    - /url: https://nextjs.org/docs/messages/module-not-found
  - contentinfo:
    - paragraph: This error occurred during the build process and can only be dismissed by fixing the error.
```