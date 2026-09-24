"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Play,
  ShieldCheck,
  RefreshCw,
  Clock3,
  LifeBuoy,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { api, money, percent } from "@/lib/api";
import { useData, useTask } from "@/lib/hooks";
import type {
  Actor,
  Notify,
  Plan,
  Funding,
  Scenario,
  Candidate,
  Route,
} from "@/lib/types";
import {
  Badge,
  Empty,
  Loading,
  PageHeader,
  Metric,
  CoverageTable,
  Notice,
} from "./ui";
import { ActionsPanel } from "./actions";
type Props = { actor: Actor; notify: Notify };
export function PlanPage({ actor, notify }: Props) {
  const query = useData<Plan[]>("plans", "/plans");
  const funds = useData<Funding[]>("funding", "/funding-sources");
  const routes = useData<Route[]>("routes", "/transfer-routes");
  const { busy, run } = useTask(notify);
  const [version, setVersion] = useState("");
  const plan = query.data?.find((p) => p.id === version) || query.data?.[0];
  return (
    <>
      <PageHeader
        eyebrow="02 / DETERMINISTIC PLANNING"
        title="A plan you can trace."
        description="Every allocation follows funding, timing, reserve, and permission constraints."
        action={
          <button
            className="button primary"
            disabled={busy}
            onClick={() =>
              run(
                () => api("/plans/generate", "POST"),
                "A new optimized plan is ready.",
              )
            }
          >
            <RefreshCw size={16} />
            Generate optimized plan
          </button>
        }
      />
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice danger>{query.error.message}</Notice>
      ) : !plan ? (
        <Empty title="Generate your first plan">
          Start with confirmed commitments and funding sources.
        </Empty>
      ) : (
        <>
          <div className="plan-bar">
            <div>
              <Badge value={plan.status} />
              <span>
                Version {plan.version} · {plan.summary.solver_status} · through{" "}
                {plan.summary.horizon_end}
              </span>
            </div>
            <div className="toolbar">
              <select
                aria-label="Plan version"
                value={plan.id}
                onChange={(e) => setVersion(e.target.value)}
              >
                {query.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    Version {p.version} · {p.status}
                  </option>
                ))}
              </select>
              <button
                className="button small"
                disabled={busy || plan.status === "STALE"}
                onClick={() =>
                  run(
                    () => api("/plans/" + plan.id + "/activate", "POST"),
                    "Working plan activated. Payment approval remains separate.",
                  )
                }
              >
                <Check size={14} />
                Activate plan
              </button>
            </div>
          </div>
          {plan.status === "STALE" && (
            <Notice danger>
              This plan was invalidated by a financial or permission change.
              Review the newest version.
            </Notice>
          )}
          <div className="metrics three">
            <Metric
              label="Estimated route cost"
              value={money(plan.summary.total_estimated_cost)}
              detail="Deterministic demo quotes"
            />
            <Metric
              label="Hard constraint violations"
              value={String(plan.summary.constraint_violations)}
              detail="Checked independently after solving"
            />
            <Metric
              label="Scenario failure rate"
              value={
                plan.stress_failure_rate === null
                  ? "Not run"
                  : percent(plan.stress_failure_rate)
              }
              detail="Sensitivity result, not real-world probability"
            />
          </div>
          <section className="panel">
            <h2>Coverage by commitment</h2>
            <CoverageTable coverage={plan.summary.coverage} />
          </section>
          <div className="allocation-grid">
            {plan.summary.coverage
              .filter((c) => c.in_horizon)
              .map((c) => (
                <section className="panel" key={c.obligation_id}>
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">{c.due_date}</span>
                      <h2>{c.label}</h2>
                    </div>
                    <strong>{money(c.amount, c.currency)}</strong>
                  </div>
                  <div className="allocation-tree">
                    {plan.summary.allocations
                      .filter((a) => a.obligation_id === c.obligation_id)
                      .map((a, i) => (
                        <div className="allocation" key={i}>
                          <div className="allocation-point" />
                          <div>
                            <strong>
                              {funds.data?.find(
                                (f) => f.id === a.funding_source_id,
                              )?.label || a.funding_source_id}
                            </strong>
                            <small>
                              {routes.data?.find(
                                (r) => r.id === a.transfer_route_id,
                              )?.provider_name || a.transfer_route_id}
                            </small>
                            <small>
                              Send {a.scheduled_date} → arrive{" "}
                              {a.expected_arrival_date}
                            </small>
                          </div>
                          <div>
                            <strong>
                              {money(a.destination_amount, a.currency)}
                            </strong>
                            <Badge value={a.status} />
                          </div>
                        </div>
                      ))}
                    {c.shortfall > 0 && (
                      <div className="gap-row">
                        Verified gap{" "}
                        <strong>{money(c.shortfall, c.currency)}</strong>
                      </div>
                    )}
                  </div>
                  {c.type === "TUITION" && (
                    <button
                      className="button full"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            api("/actions/prepare", "POST", {
                              type: "TUITION_PAYMENT",
                              plan_id: plan.id,
                              obligation_id: c.obligation_id,
                            }),
                          "Tuition payment prepared in the sandbox.",
                        )
                      }
                    >
                      <ShieldCheck size={15} />
                      Prepare tuition payment
                    </button>
                  )}
                </section>
              ))}
          </div>
          <Notice>{plan.explanation}</Notice>
        </>
      )}
      <ActionsPanel actor={actor} notify={notify} />
    </>
  );
}
export function ScenarioPage({ notify }: Props) {
  const query = useData<Plan[]>("plans", "/plans");
  const funding = useData<Funding[]>("funding", "/funding-sources");
  const { busy, run } = useTask(notify);
  const [controls, setControls] = useState({
    scholarship_delay: 7,
    transfer_delay: 2,
    fx_shock: 3,
    unexpected_expense: 0,
  });
  const [result, setResult] = useState<Scenario | null>(null);
  const plan = query.data?.[0];
  const fields = [
    ["scholarship_delay", "Scholarship delay", 21, "days"],
    ["transfer_delay", "Transfer delay", 7, "days"],
    ["fx_shock", "FX shock", 10, "%"],
    ["unexpected_expense", "Unexpected expense", 2000, "EUR"],
  ] as const;
  async function test() {
    if (!plan) return;
    const r = await run(
      () =>
        api<Scenario>("/plans/" + plan.id + "/simulate", "POST", {
          ...controls,
          scenario: "COMBINED_STRESS",
          iterations: 1000,
          seed: 17,
        }),
      "1,000 deterministic scenario iterations computed.",
    );
    if (r) setResult(r);
  }
  async function delay() {
    const f = funding.data?.find((f) => f.id === "scholarship");
    if (!f) return;
    const d = new Date(f.available_from + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + controls.scholarship_delay);
    await run(
      () =>
        api("/funding-sources/scholarship", "PATCH", {
          available_from: d.toISOString().slice(0, 10),
          confirmation_note: "Explicit sandbox scholarship delay event",
        }),
      "Plan invalidated. A new version and scenario comparison were generated.",
    );
  }
  const chart =
    result?.baseline_coverage
      .filter((c) => c.in_horizon)
      .map((c) => ({
        name: c.label,
        before: Math.round(c.nominal * 100),
        after: Math.round(
          (result.after_coverage.find(
            (a) => a.obligation_id === c.obligation_id,
          )?.on_time_nominal || 0) * 100,
        ),
      })) || [];
  return (
    <>
      <PageHeader
        eyebrow="03 / STRESS"
        title="What if the timing changes?"
        description="Test a plan against delays, FX movement, and unexpected expenses before they happen."
        action={
          <button
            className="button primary"
            onClick={test}
            disabled={busy || !plan}
          >
            <Play size={16} />
            Run stress test
          </button>
        }
      />
      {!plan && (
        <Notice>
          Generate a plan first.{" "}
          <Link href="/plan">
            Open Plan <ArrowRight size={14} />
          </Link>
        </Notice>
      )}
      <div className="scenario-layout">
        <section className="panel scenario-controls">
          <span className="eyebrow">SCENARIO PARAMETERS</span>
          <h2>
            A little uncertainty.
            <br />A different outcome.
          </h2>
          {fields.map(([key, title, max, unit]) => (
            <label className="slider" key={key}>
              <span>
                {title}
                <strong>
                  {controls[key]} {unit}
                </strong>
              </span>
              <input
                aria-label={title}
                type="range"
                min="0"
                max={max}
                step={key === "unexpected_expense" ? 50 : 1}
                value={controls[key]}
                onChange={(e) =>
                  setControls({ ...controls, [key]: Number(e.target.value) })
                }
              />
              <small>
                <span>0 {unit}</span>
                <span>
                  {max} {unit}
                </span>
              </small>
            </label>
          ))}
          <div className="scenario-method">
            <ShieldCheck size={17} />
            <p>
              1,000 seeded iterations. Results measure failure under the
              selected assumptions, not actuarial probability.
            </p>
          </div>
        </section>
        <div>
          <section className="panel scenario-chart">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">BEFORE / AFTER</span>
                <h2>Can the forecast arrive on time?</h2>
              </div>
              <span className="count">% covered</span>
            </div>
            {result ? (
              <>
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Legend />
                      <Bar
                        isAnimationActive={false}
                        dataKey="before"
                        name="Baseline nominal"
                        fill="#bbd8cf"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        isAnimationActive={false}
                        dataKey="after"
                        name="Stressed on-time forecast"
                        fill="#267d67"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="caption">
                  Forecast includes expected income; it does not certify
                  verified coverage. The after bars apply the maximum selected
                  shocks.
                </p>
              </>
            ) : (
              <Empty title="Run your first stress test">
                Change the assumptions on the left, then compare the computed
                results here.
              </Empty>
            )}
          </section>
          {result && (
            <div className="metrics three">
              <Metric
                label="Verified scenario failure"
                value={percent(result.scenario_failure_rate)}
                detail="Includes existing verified shortfalls"
              />
              <Metric
                label="Forecast failure"
                value={percent(result.forecast_failure_rate)}
                detail="Assumes expected funds are received"
              />
              <Metric
                label="95th percentile shortfall"
                value={money(result.p95_shortfall_eur)}
                detail={`${result.iterations.toLocaleString()} computed iterations`}
              />
            </div>
          )}
          <section className="apply-event">
            <div className="event-icon">
              <Clock3 />
            </div>
            <div>
              <span className="eyebrow">TURN A SCENARIO INTO AN EVENT</span>
              <h2>The scholarship is delayed.</h2>
              <p>
                Apply a {controls.scholarship_delay}-day delay to Maya’s
                financial state. The current plan will become stale and be
                recalculated.
              </p>
            </div>
            <button
              className="button"
              disabled={busy || !plan || !controls.scholarship_delay}
              onClick={delay}
            >
              Apply scholarship delay <ArrowRight size={16} />
            </button>
          </section>
          <Link href="/rescue" className="text-link">
            Find a minimal repair in Rescue Center <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}
export function RescuePage({ actor, notify }: Props) {
  const { busy, run } = useTask(notify);
  const [result, setResult] = useState<{
    shortfall_eur: number;
    candidates: Candidate[];
    best_index: number | null;
  } | null>(null);
  async function generate() {
    const r = await run(
      () => api<typeof result>("/rescue/generate", "POST"),
      "Rescue alternatives evaluated using the optimizer.",
    );
    if (r) setResult(r);
  }
  return (
    <>
      <PageHeader
        eyebrow="04 / REPAIR"
        title="The smallest change that helps."
        description="Compare conditional repairs by financial cost, family contribution, reserve impact, and friction."
        action={
          <button className="button primary" disabled={busy} onClick={generate}>
            <LifeBuoy size={16} />
            Generate rescue plan
          </button>
        }
      />
      <Notice>
        Repairs are proposals until all affected actors approve. The best option
        is the lowest score among the evaluated bundles; it is not a promise of
        institutional acceptance.
      </Notice>
      {!result ? (
        <Empty title="Explore a repair">
          Generate alternatives from the current plan. Installments are
          evaluated alongside additional funding and explicit reserve release.
        </Empty>
      ) : (
        <>
          <div className="rescue-summary">
            <span>Current verified critical gap</span>
            <strong>{money(result.shortfall_eur)}</strong>
            <small>
              Expected income cannot close this verified gap until received.
            </small>
          </div>
          <div className="rescue-grid">
            {result.candidates.map((c, index) => (
              <article
                key={c.id}
                className={`panel rescue-card ${index === result.best_index ? "recommended" : ""}`}
              >
                <div className="card-top">
                  <span className="rank">0{index + 1}</span>
                  <Badge
                    value={c.feasible ? "CONDITIONAL_REPAIR" : "INFEASIBLE"}
                  />
                </div>
                {index === result.best_index && (
                  <div className="best-label">
                    <Check size={13} />
                    MINIMUM EVALUATED SCORE
                  </div>
                )}
                <h2>{c.title}</h2>
                <div className="rescue-cost">
                  {money(c.direct_cost_eur)}
                  <span>direct fees</span>
                </div>
                <dl>
                  <div>
                    <dt>Additional family funds</dt>
                    <dd>{money(c.family_contribution_eur)}</dd>
                  </div>
                  <div>
                    <dt>Reserve released</dt>
                    <dd>{money(c.reserve_impact_eur)}</dd>
                  </div>
                  <div>
                    <dt>People involved</dt>
                    <dd>{c.people_involved}</dd>
                  </div>
                  <div>
                    <dt>Scenario failure rate</dt>
                    <dd>{percent(c.scenario_failure_rate)}</dd>
                  </div>
                  <div>
                    <dt>Evaluation score</dt>
                    <dd>{c.score}</dd>
                  </div>
                </dl>
                <div className="assumptions">
                  {c.assumptions.map((a) => (
                    <p key={a}>
                      <ShieldCheck size={14} />
                      {a}
                    </p>
                  ))}
                </div>
                <button
                  className="button full primary"
                  disabled={busy || !c.feasible}
                  onClick={() =>
                    run(
                      () =>
                        api("/actions/prepare", "POST", {
                          type: "APPLY_RESCUE",
                          plan_id: c.plan_id,
                          candidate_id: c.id,
                        }),
                      "Intervention prepared. Required approvals are listed below.",
                    )
                  }
                >
                  Prepare intervention <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      <ActionsPanel actor={actor} notify={notify} />
    </>
  );
}
