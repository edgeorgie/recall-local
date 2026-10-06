# Evaluation

A self-assessment against a reviewer's rubric. It states gaps plainly so a reviewer, a person or an agent, can verify or challenge each line.

| Criterion | Status | Notes |
|---|---|---|
| Onboarding | Pass | README has a one-command run, usage steps and configuration. |
| Reproducible build | Pass | Lockfile, Node 22 engine field, and one gate: `npm run verify`. |
| Automated tests | Partial | Unit tests cover the pure logic (3 of 5 requirements have tests). No browser end-to-end tests; UI behavior was verified manually and recorded in the traceability matrix. |
| Continuous integration | Gap | A workflow runs `npm run verify` but is not active until the repository token has the workflow permission. The gate runs locally. |
| Specification and traceability | Pass | Spec, plan, tasks, ADRs and a matrix enforced by `npm run spec:check`. |
| Documentation structure | Pass | Index, architecture with diagrams, glossary and design system. |
| Agent readiness | Pass | AGENTS.md, llms.txt, machine-readable requirements and a deterministic gate. There is no MCP server or OpenAPI document because the app is client-side. |
| LLM integration safety | Partial | No language model generates text here. The embedding model runs locally and its output is numbers only, so there is no prompt injection surface. |
| Privacy and data flow | Pass | Every data path and its storage is tabulated in the README. |
| Accessibility | Partial | The canvas map is not keyboard navigable; search results are a keyboard-reachable list that conveys the same information. Not audited with automated tooling. |
| Performance | Partial | A 23 MB model is downloaded on first use and cached. Not measured with Lighthouse. |
| Security | Partial | Nothing leaves the device after the model download. Baseline security headers are set (nosniff, frame denial, referrer and permissions policies). No Content Security Policy is configured. |
| Deployment | Pass | Live on Vercel at https://recall-local.vercel.app, with security headers served by the host. The main flow was exercised on the deployed site. |
| Licensing | Pass | MIT. Third-party: Transformers.js (Apache-2.0). |

## Verify it yourself

```bash
npm install
npm run verify
```

Requirements marked "Implemented, not verified end to end" in [spec.md](spec/spec.md) depend on a real external service or credential that was not exercised.
