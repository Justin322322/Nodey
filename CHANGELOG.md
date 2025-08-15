## Changelog

All notable changes to this project will be documented in this file.

### [Released] - 2025-08-15
- Implemented Filter logic node
  - Added `FilterNodeConfig` to `types/workflow.ts`.
  - Added Filter node definition (parameters + validation) and registered it in `NODE_DEFINITIONS` (`lib/node-definitions.ts`).
  - Implemented execution for `LogicType.FILTER` in `server/services/workflow-executor.ts`, returning `{ filtered, count }`.
- ESLint configuration updates
  - Updated `.eslintrc.json` to include `next/core-web-vitals` in `extends` so Next.js detects the plugin and removes the build warning.

### 0.1.0
- Initial project setup

