## Changelog

All notable changes to this project will be documented in this file.

### [Released] - 2025-08-15
- Implement Filter logic node
  - Added `FilterNodeConfig` to `types/workflow.ts`.
  - Added Filter node definition (parameters + validation) and registered it in `NODE_DEFINITIONS` (`lib/node-definitions.ts`).
  - Implemented real execution for `LogicType.FILTER` in `server/services/workflow-executor.ts` returning `{ filtered, count }`.
- ESLint flat config updates
  - Updated `eslint.config.mjs` to include `nextPlugin.configs['core-web-vitals']` entry so Next.js detects the plugin and removes the warning during build.

### 0.1.0
- Initial project setup

