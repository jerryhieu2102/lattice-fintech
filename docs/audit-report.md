# LATTICE v1.0 engineering audit

Final verification: **2026-09-21**. Authoritative scope: the supplied LATTICE v1.0 specification. Repository `/workspace/lattice`. The previously saved ZIP was a smaller, older prototype; this repository supersedes it with the actual OR-Tools/PostgreSQL implementation and verified browser loop.

## What was broken and repaired

1. An old source ZIP contained a 29-file prototype and did not represent the completed workspace. A complete source package is rebuilt from the current repository.
2. Parent funding create/patch could include a replacement plan containing private student snapshots. These responses now return only the owned funding and a change acknowledgement; regression covers both methods.
3. Unshared parent resources could enter student plans/graph indirectly. The state builder now applies per-resource visibility before optimization.
4. A proposal could cite the right text but supply a different normalized amount, deadline, currency or beneficiary. Provenance now independently validates both the evidence field and normalized value.
5. Unicode beneficiary proposals needed to set a security hold even when rejected during validation. The original beneficiary is preserved and unsafe preparation remains blocked.
6. API/document money precision could admit sub-cent or fractional-VND values. They now fail validation before financial state promotion. Scholarship patches cannot make an unreceived notice PLANNED.
7. Session validation discarded timezone offsets. It now compares actual UTC instants; fresh PostgreSQL and proxy login persistence are tested.
8. Binary float sums could mark EUR .10 + .70 as underfunding an .80 obligation. Coverage now sums Decimal values before serialization.
9. Planned student money could appear liquid in safe-to-spend. Only already available, verified student funds enter this metric.
10. Route fee/min/max rounding and cross-currency objective precision needed conservative integer treatment. Fees round up, principal bounds use currency minor units and independent validation checks trust and route status as well as budgets/timing.
11. Reported route cost omitted FX markup. It now includes the explicit markup component and uses the label Estimated route cost.
12. Solver timeout/error results were incomplete. Failed solves now return a complete non-feasible result with no allocations; downstream stress handling is tested.
13. Installment feasibility originally omitted its fee. Fee obligations and deferred principal are preserved during evaluation and execution. Rescue now evaluates the applicable disclosed intervention families and retains every affected actor's consent.
14. APPROVE_PLAN and APPROVE_ACTION permission records needed actual behavior. Plan approval is now effective with redacted parent output; action delegation adds required consent, preserves fund owners and clears prior approvals when changed.
15. Concurrent financial mutations needed serialization before reading state. PostgreSQL advisory transaction locking and the demo ASGI mutation guard provide that boundary.
16. The initial migration depended on current Python models. It is now frozen explicit DDL; clean database upgrade and Alembic drift checking pass.
17. Demo resets could retain custom route data and change reproducibility. Unreferenced demo routes are reset while routes used by other retained plans are protected.
18. Named scenario selection had no preset effect. Omitted parameters now receive named shocks, while explicit user values including zero are respected.
19. Tuition payment UI used a hard-coded seeded ID. It now works for any confirmed tuition obligation. API regression covers new document → new obligation → approved sandbox payment.
20. Administrator document list entries could fail to open. Read authorization now matches the listed fictional demo documents; non-owned evidence remains read-only for that workflow.
21. Graph overlays/unused controls, scenario chart animation, missing errors, currency aggregation and inconsistent build/browser configuration were corrected. The eleven routes are checked at desktop and 390×844 mobile dimensions.
22. Benchmark security setup initially could fail during payment preparation without actually testing unauthorized execution. It now supplies sufficient test funding first, then attempts the unapproved action against actual APIs. Metrics are computed and exported, not constants.
23. Source formatting, portable lockfile paths, runtime benchmark dependencies, process-group cleanup, startup commands and documentation were reconciled with the executed stack.

## Tests and commands actually executed

| Gate | Result |
| --- | --- |
| Backend dependency install: `uv pip install --python .venv/bin/python -r requirements.lock` | PASS |
| Frontend dependency install: `npm --prefix apps/web ci` | PASS |
| Portable PostgreSQL dependency install: `npm --prefix scripts/postgres ci` | PASS |
| `pytest -q tests` | **101 passed, 0 failed, 0 errors, 0 skipped** |
| Vitest / React Testing Library | **6 passed, 0 failed, 0 pending** |
| TypeScript `tsc --noEmit` | PASS |
| Ruff and ESLint | PASS |
| Next production build | PASS |
| Fresh PostgreSQL migration and `alembic check` | PASS, PostgreSQL 18.3 via PGlite |
| FastAPI, Next production and Next development startup | PASS |
| Direct API and Next-proxy login/me/logout | PASS on a fresh database |
| Playwright real HTTP/PostgreSQL | **5 passed, 0 failed, 0 skipped, 0 flaky** |
| FAST computed benchmark | **48 passed, 0 failed**, 5.597 seconds internal duration |
| FULL computed benchmark | **500 passed, 0 failed**, 50.904 seconds internal duration |
| Native Docker build/Compose runtime | **BLOCKED: Docker CLI/daemon unavailable** |

Exact commands, exit codes and timings are in `verification/final-results.json`; source reports are `pytest.xml`, `vitest.json` and `playwright.json`. This report does not add together benchmark cases and unit tests as independent evidence. Two upstream Python TestClient deprecation warnings remain; they are not failures. ESLint 9 emits an upstream support warning on install, while its configured lint check passes.

Five Playwright tests cover: (1) complete evidence-to-attack-block hero loop, (2) parent HTTP privacy, (3) every page and mobile width, (4) actual multi-actor rescue execution with deferred debt and replay rejection, (5) computed Benchmark UI plus JSON/CSV exports. Screenshots in `screenshots/` were visually inspected, including the scenario before/after plot, graph inspector and repaired plan.

## Competition evaluator view

| Required capability | Where it is actually demonstrated |
| --- | --- |
| Intent understanding and task planning | Overview intent parser and explicit task steps; labelled deterministic demo provider |
| Trustworthy facts | Documents evidence, confidence, page provenance and confirmation |
| Financial reasoning | OR-Tools plan, independent constraints and three coverage metrics |
| Cross-border relevance | VND parental funding, EUR commitments, route fees/FX/settlement |
| Permission control | Parent-filtered API, separate funding owners, required action approvals |
| Hallucination mitigation | Missing values stay unknown; normalized facts require valid citations |
| Prompt-injection defense | Malicious beneficiary fixture, blocked preparation, persisted security event |
| Measurable evaluation | Computed FAST/FULL runs, executable baselines and downloadable results |
| Usable product interface | Eleven connected routes, working forms, graph inspector and scenario controls |

**Judgment:** ready for the documented local competition sandbox demonstration. This judgment does not certify live financial use, production security, general-purpose AI extraction, real bank settlement or an unexecuted Docker deployment.

## Remaining known issues and security limits

- Native Docker/Compose was not available; PostgreSQL 16 in the Docker definition has not been runtime-tested here. The executed development engine is PostgreSQL 18.3 via PGlite.
- Local demo identity uses published passwords and no MFA/rate limiting. A public production deployment requires a separate security review and hardened identity/transport configuration.
- Text fixtures/PDFs are supported; no scanned OCR, real LLM, live FX, external bank verification or real-money action exists. T0 user attestation is not independent source attestation.
- Rescue is a finite conditional bundle search. Family receipt and institution acceptance are simulated. Future installment debt remains outside the displayed 45-day safety horizon.
- Synthetic benchmark variations do not establish real-world adversarial success rates or universal optimizer optimality. Timeout results are labelled conservatively.
- Audit immutability is application/database level; a privileged host/database operator remains trusted.
- Partial allocations explain gaps; sandbox payment execution requires a complete verified obligation. No generic partial settlement workflow is claimed.
- Dependency deprecation/support warnings require maintenance before long-term use; no production load or failover testing was performed.

## Exact local startup and Maya procedure

After the README dependency installation and build:

```bash
cd /workspace/lattice
.venv/bin/python scripts/dev.py --portable-postgres --production
```

Open http://localhost:3000. Sign in as Demo administrator → **Reset Maya** → switch to Maya Student. Follow Documents → confirm facts → Plan → Graph → Scenario Lab (14-day scholarship delay) → apply delay → Rescue Center → prepare → observe approval block → Documents malicious update → payment preparation block → Audit Security. For a successful repair, reset and approve the proposed action as each required actor before executing as Student. All accounts use `LatticeDemo2026!`; emails are documented in README.
