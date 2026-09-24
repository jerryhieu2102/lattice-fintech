"use client";
import { useState } from "react";
import {
  Play,
  Download,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";
import { api, label, percent, money } from "@/lib/api";
import { useData, useTask } from "@/lib/hooks";
import type {
  Actor,
  Notify,
  Permission,
  Audit,
  Funding,
  Obligation,
} from "@/lib/types";
import { Badge, Empty, Loading, PageHeader, Metric, Notice } from "./ui";
import { ActionsPanel } from "./actions";
type Props = { actor: Actor; notify: Notify };
export function PermissionsPage({ actor, notify }: Props) {
  const query = useData<Permission[]>("permissions", "/permissions");
  const funds = useData<Funding[]>("funding", "/funding-sources");
  const obligations = useData<Obligation[]>("obligations", "/obligations");
  const { busy, run } = useTask(notify);
  const [type, setType] = useState("FUNDING");
  const ownFunds =
    funds.data?.filter((f) => f.owner_actor_id === actor.id) || [];
  return (
    <>
      <PageHeader
        eyebrow="AUTHORITY IS EXPLICIT"
        title="Permissions & people"
        description="Seeing an obligation does not grant access to balances or permission to spend."
      />
      <div className="privacy-grid">
        <section className="panel">
          <div className="card-top">
            <ShieldCheck className="accent" />
            <span className="eyebrow">PARENT VIEW</span>
          </div>
          <h2>Only what is shared.</h2>
          <ul className="check-list">
            <li>
              <CheckCircle2 />
              Shared tuition obligation
            </li>
            <li>
              <CheckCircle2 />
              Own funding contribution
            </li>
            <li>
              <LockKeyhole />
              No private student balances
            </li>
            <li>
              <LockKeyhole />
              No unshared rent or spending
            </li>
            <li>
              <LockKeyhole />
              No student-only documents
            </li>
          </ul>
          <p className="caption">
            The same access rules protect direct API requests, graph responses,
            and action details.
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">GRANT A SPECIFIC CAPABILITY</span>
          <h2>Share with a purpose.</h2>
          <form
            className="form-grid compact"
            onSubmit={(e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget));
              run(
                () => api("/permissions", "POST", values),
                "Permission granted for this resource only.",
              );
            }}
          >
            <label>
              Resource type
              <select
                name="resource_type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>FUNDING</option>
                <option>OBLIGATION</option>
              </select>
            </label>
            <label>
              Resource
              <select name="resource_id" required>
                {type === "FUNDING"
                  ? ownFunds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))
                  : actor.role === "STUDENT"
                    ? obligations.data?.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))
                    : null}
              </select>
            </label>
            <label>
              Recipient
              <select name="target_actor_id">
                <option value={actor.role === "PARENT" ? "maya" : "father"}>
                  {actor.role === "PARENT" ? "Maya" : "Father"}
                </option>
              </select>
            </label>
            <label>
              Permission
              <select name="permission_type">
                {(type === "OBLIGATION"
                  ? ["VIEW_SHARED_OBLIGATION"]
                  : [
                      "VIEW_OWN_CONTRIBUTION",
                      "APPROVE_OWN_FUNDS",
                      "VIEW_PRIVATE_FINANCES",
                    ]
                ).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <button
              className="button primary"
              disabled={busy || actor.role === "ADMIN_DEMO"}
            >
              Grant permission
            </button>
          </form>
          <small className="muted">
            Only the resource owner can grant or revoke access. Administrators
            cannot approve someone else’s funds.
          </small>
        </section>
      </div>
      <section className="panel">
        <h2>Resource permissions</h2>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <Notice danger>{query.error.message}</Notice>
        ) : !query.data?.length ? (
          <Empty title="No permissions granted" />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Owner → recipient</th>
                  <th>Resource</th>
                  <th>Permission</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {query.data.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.owner_actor_id} → {p.target_actor_id}
                    </td>
                    <td>
                      <small>{p.resource_type}</small>
                      {p.resource_id}
                    </td>
                    <td>{label(p.permission_type)}</td>
                    <td>
                      <Badge value={p.revoked_at ? "REVOKED" : "ACTIVE"} />
                    </td>
                    <td>
                      {p.owner_actor_id === actor.id && !p.revoked_at && (
                        <button
                          className="button small"
                          disabled={busy}
                          onClick={() =>
                            run(
                              () => api("/permissions/" + p.id, "DELETE"),
                              "Permission revoked. Dependent plans and approvals invalidated.",
                            )
                          }
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ActionsPanel actor={actor} notify={notify} />
    </>
  );
}
export function AuditPage() {
  const [category, setCategory] = useState("");
  const query = useData<Audit[]>(
    "audit",
    "/audit" + (category ? "?category=" + category : ""),
  );
  return (
    <>
      <PageHeader
        eyebrow="A RECORD YOU CAN FOLLOW"
        title="Audit history"
        description="Evidence decisions, financial changes, blocked actions, and permissions leave a trace."
      />
      <div className="tabs" role="group" aria-label="Audit category">
        {["", "FINANCIAL", "AI", "SECURITY", "PERMISSION", "ACTION"].map(
          (c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c ? label(c) : "All events"}
            </button>
          ),
        )}
      </div>
      <section className="panel audit-panel">
        <Notice>
          Append-only application history with chained SHA-256 hashes. Reset
          preserves history. Database operators remain a trust boundary.
        </Notice>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <Notice danger>{query.error.message}</Notice>
        ) : !query.data?.length ? (
          <Empty title="No matching audit events" />
        ) : (
          <div className="timeline">
            {query.data.map((e) => (
              <article className="timeline-event" key={e.id}>
                <div
                  className={`event-point ${e.category === "SECURITY" ? "security" : ""}`}
                />
                <div className="event-time">
                  <strong>#{e.sequence}</strong>
                  <small>
                    {new Date(e.created_at).toLocaleTimeString("en-GB")}
                  </small>
                </div>
                <div className="event-content">
                  <div>
                    <h3>{label(e.event_type)}</h3>
                    <Badge value={e.category} />
                  </div>
                  <details>
                    <summary>Inspect event details</summary>
                    <pre>{JSON.stringify(e.payload, null, 2)}</pre>
                    <small>Hash: {e.event_hash}</small>
                    <small>Previous: {e.previous_hash}</small>
                  </details>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
interface Benchmark {
  id: string;
  mode: string;
  case_count: number;
  seed: number;
  duration_ms: number;
  passed: number;
  failed: number;
  generated_at: string;
  categories: Record<
    string,
    { passed: number; total: number; metrics: Record<string, number> }
  >;
  baselines: {
    name: string;
    critical_coverage: number;
    on_time_coverage: number;
    constraint_violations: number;
    total_cost: number;
  }[];
  cases: {
    id: string;
    category: string;
    passed: boolean;
    duration_ms: number;
  }[];
}
export function BenchmarkPage({ notify }: Props) {
  const query = useData<Benchmark | null>("benchmark", "/benchmark/latest");
  const { busy, run } = useTask(notify);
  const result = query.data;
  return (
    <>
      <PageHeader
        eyebrow="MEASURED, NEVER INVENTED"
        title="Evaluation workbench"
        description="Deterministic ground truth. Reproducible cases. Computed results."
        action={
          <div className="toolbar">
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                run(
                  () => api("/benchmark/run", "POST", { mode: "FAST" }),
                  "FAST benchmark computed and saved.",
                )
              }
            >
              <Play size={15} />
              Run FAST · 48
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                run(
                  () => api("/benchmark/run", "POST", { mode: "FULL" }),
                  "FULL benchmark computed and saved.",
                )
              }
            >
              <Play size={15} />
              Run FULL · 500
            </button>
          </div>
        }
      />
      {busy && (
        <Notice>
          Running real cases against extraction, planning, replanning, and
          policy modules. Results appear when computation finishes.
        </Notice>
      )}
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice danger>{query.error.message}</Notice>
      ) : !result ? (
        <Empty title="No benchmark has been computed">
          Run FAST to evaluate 48 deterministic cases. No evaluation numbers are
          displayed before execution.
        </Empty>
      ) : (
        <>
          <div className="plan-bar">
            <span>
              <Badge value={result.mode} /> Seed {result.seed} ·{" "}
              {result.generated_at}
            </span>
            <div className="toolbar">
              <a
                className="button small"
                download="lattice-benchmark.json"
                href="/api/v1/benchmark/export?format=json"
              >
                <Download size={14} />
                JSON
              </a>
              <a
                className="button small"
                download="lattice-benchmark.csv"
                href="/api/v1/benchmark/export?format=csv"
              >
                <Download size={14} />
                CSV
              </a>
            </div>
          </div>
          <div className="metrics">
            <Metric
              label="Cases computed"
              value={String(result.case_count)}
              detail={`${result.mode} deterministic suite`}
            />
            <Metric
              label="Passed"
              value={String(result.passed)}
              detail="Compared with generated ground truth"
            />
            <Metric
              label="Failed"
              value={String(result.failed)}
              detail="Failures remain visible"
            />
            <Metric
              label="Wall time"
              value={`${(result.duration_ms / 1000).toFixed(2)}s`}
              detail="Measured in this run"
            />
          </div>
          <div className="evaluation-grid">
            {Object.entries(result.categories).map(([name, category]) => (
              <section className="panel" key={name}>
                <div className="panel-heading">
                  <h2>{label(name)}</h2>
                  <span className="count">
                    {category.passed}/{category.total}
                  </span>
                </div>
                <dl>
                  {Object.entries(category.metrics).map(([k, v]) => (
                    <div key={k}>
                      <dt>{label(k)}</dt>
                      <dd>
                        {k.includes("rate") ||
                        k.includes("accuracy") ||
                        k.includes("precision") ||
                        k.includes("coverage")
                          ? percent(v)
                          : v.toFixed(3)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
          <section className="panel">
            <h2>Planning baselines</h2>
            <p className="caption">
              B0–B3 are deterministic approximations, not evaluations of
              external language models. Coverage is measured against the same
              scenarios.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Baseline</th>
                    <th>Critical coverage</th>
                    <th>On-time coverage</th>
                    <th>Violations</th>
                    <th>Mean cost</th>
                  </tr>
                </thead>
                <tbody>
                  {result.baselines.map((b) => (
                    <tr key={b.name}>
                      <td>
                        <strong>{b.name}</strong>
                      </td>
                      <td>{percent(b.critical_coverage)}</td>
                      <td>{percent(b.on_time_coverage)}</td>
                      <td>{b.constraint_violations}</td>
                      <td>{money(b.total_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel">
            <details>
              <summary>Inspect all {result.case_count} case outcomes</summary>
              <div className="table-scroll case-results">
                <table>
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Category</th>
                      <th>Result</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.cases.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{label(c.category)}</td>
                        <td>
                          <Badge value={c.passed ? "VERIFIED" : "FAILED"} />
                        </td>
                        <td>{c.duration_ms.toFixed(2)} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        </>
      )}
    </>
  );
}
