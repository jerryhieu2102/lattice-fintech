"use client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  Plus,
  ShieldCheck,
  Globe2,
  Clock3,
  LockKeyhole,
  Check,
} from "lucide-react";
import { api, money, percent, label, demoEur } from "@/lib/api";
import { useData, useTask } from "@/lib/hooks";
import type { Actor, Notify, Plan, Funding, Obligation } from "@/lib/types";
import {
  Badge,
  Empty,
  Loading,
  PageHeader,
  Metric,
  CoverageTable,
  Notice,
} from "./ui";
type Props = { actor: Actor; notify: Notify };
export function Overview({ notify }: Props) {
  const plans = useData<Plan[]>("plans", "/plans");
  const funds = useData<Funding[]>("funding", "/funding-sources");
  const obligations = useData<Obligation[]>("obligations", "/obligations");
  const { busy, run } = useTask(notify);
  const [intent, setIntent] = useState(
    "Can my verified funds cover tuition and housing on time?",
  );
  const [steps, setSteps] = useState<string[]>([]);
  if (plans.isPending || funds.isPending || obligations.isPending)
    return <Loading />;
  if (plans.error || funds.error || obligations.error)
    return (
      <Notice danger>
        {(plans.error || funds.error || obligations.error)?.message}
      </Notice>
    );
  const plan = plans.data?.[0];
  const coverage = plan?.summary.coverage.filter((c) => c.in_horizon) || [];
  const amounts = coverage.reduce(
    (a, c) => a + demoEur(c.amount, c.currency),
    0,
  );
  const rate = (key: "nominal" | "verified" | "on_time_verified") =>
    amounts
      ? coverage.reduce(
          (a, c) => a + demoEur(c.amount, c.currency) * c[key],
          0,
        ) / amounts
      : 0;
  const safe = plan?.summary.verified_feasible && plan.status !== "STALE";
  const failed =
    !!plan &&
    !plan.summary.allocations.length &&
    coverage.some((c) => c.priority === "CRITICAL");
  return (
    <>
      <PageHeader
        eyebrow="FINANCIAL CLARITY, ACROSS BORDERS"
        title="Your next commitments, accounted for."
        description="A balance tells you what you have. LATTICE verifies what you can cover."
        action={
          <button
            className="button primary"
            disabled={busy || !obligations.data?.length}
            onClick={() =>
              run(
                () => api("/plans/generate", "POST"),
                "Optimized plan generated from current evidence.",
              )
            }
          >
            <Globe2 size={16} />
            {plan ? "Regenerate plan" : "Generate optimized plan"}
          </button>
        }
      />
      <section className="overview-hero">
        <div>
          <div className="eyebrow">FINANCIAL PLAN / NEXT 45 DAYS</div>
          <div className="hero-status">
            <span className={`large-dot ${safe ? "safe" : ""}`} />
            <h2>
              {!plan
                ? "Ready to verify"
                : safe
                  ? "Covered, with evidence."
                  : "Your plan needs attention."}
            </h2>
          </div>
          <p>
            {!plan
              ? "Start with your documents, then build a plan from verified facts."
              : `${coverage.filter((c) => c.priority === "CRITICAL" && c.on_time_verified < 1).length} critical commitments have a verified coverage gap. Expected scholarship income is kept separate.`}
          </p>
          <div className="hero-links">
            <Link href="/plan">
              Review plan <ArrowRight size={16} />
            </Link>
            <Link href="/rescue">
              Explore a repair <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-aside">
          <ShieldCheck size={29} />
          <span>PLAN STATUS</span>
          <strong>
            {!plan
              ? "NOT GENERATED"
              : safe
                ? "SAFE"
                : failed
                  ? "FAILED"
                  : "AT RISK"}
          </strong>
          <small>
            {plan
              ? `Version ${plan.version} · ${plan.summary.solver_status}`
              : "Evidence → allocation → approval"}
          </small>
        </div>
      </section>
      <div className="metrics">
        <Metric
          label="Nominal coverage"
          value={percent(rate("nominal"))}
          detail="Forecast allocations · demo EUR weights"
        />
        <Metric
          label="Verified coverage"
          value={percent(rate("verified"))}
          detail="Verified, authorized funding only"
        />
        <Metric
          label="On-time verified"
          value={percent(rate("on_time_verified"))}
          detail="Can arrive before the deadline"
        />
        <Metric
          label="Protected reserve"
          value={money(
            funds.data
              ?.filter((f) => f.restriction_type === "EMERGENCY")
              .reduce((a, f) => a + demoEur(f.amount, f.currency), 0) || 0,
          )}
          detail="Protected · demo EUR equivalent"
        />
      </div>
      <div className="columns">
        <section className="panel wide">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">UPCOMING</span>
              <h2>Commitments that matter</h2>
            </div>
            <Link href="/commitments">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {coverage.length ? (
            <CoverageTable coverage={coverage} />
          ) : (
            <Empty title="No plan generated yet">
              {obligations.data?.length
                ? "Your commitments are ready. Generate an optimized plan to calculate coverage."
                : "Sign in as Demo administrator and use Reset Maya to load the complete dataset."}
            </Empty>
          )}
        </section>
        <section className="panel">
          <span className="eyebrow">YOUR FINANCIAL PICTURE</span>
          <h2>Not all funds are equal.</h2>
          <div className="fund-summary">
            {["AVAILABLE", "PLANNED", "EXPECTED", "CONDITIONAL"].map(
              (status) => (
                <div key={status}>
                  <span>
                    <i className={`source-dot ${status}`} />
                    {label(status)}
                  </span>
                  <strong>
                    {funds.data
                      ?.filter(
                        (f) =>
                          f.availability_status === status &&
                          f.restriction_type !== "EMERGENCY",
                      )
                      .map((f) => money(f.amount, f.currency))
                      .join(" + ") || "—"}
                  </strong>
                </div>
              ),
            )}
          </div>
          <div className="safe-spend">
            <LockKeyhole size={17} />
            <div>
              <small>Secondary metric · safe to spend</small>
              <strong>
                {plan
                  ? Object.entries(plan.summary.safe_to_spend)
                      .map(([c, a]) => money(a, c))
                      .join(" + ") || "€0.00"
                  : "Generate plan first"}
              </strong>
            </div>
          </div>
          <p className="caption">
            Protected allocations and emergency reserves are deducted. Uncertain
            income is excluded.
          </p>
        </section>
      </div>
      <section className="panel intent-panel">
        <div>
          <span className="eyebrow">UNDERSTAND THE INTENT</span>
          <h2>What does your plan need to accomplish?</h2>
        </div>
        <div className="input-row">
          <input
            aria-label="Financial intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          />
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                z.string().min(8).max(2000).parse(intent);
                const r = await api<{ steps: string[] }>("/intent", "POST", {
                  text: intent,
                });
                setSteps(r.steps);
                return r;
              }, "Intent interpreted. No financial action was authorized.")
            }
          >
            Understand intent <ArrowRight size={15} />
          </button>
        </div>
        {steps.length > 0 && (
          <div className="steps">
            {steps.map((s, i) => (
              <span key={s}>
                <b>{i + 1}</b>
                {s}
              </span>
            ))}
          </div>
        )}
      </section>
      <div className="pillars">
        {[
          ["01", "Verify", "Facts with evidence"],
          ["02", "Orchestrate", "Funding matched to deadlines"],
          ["03", "Stress", "Test uncertainty"],
          ["04", "Repair", "Find the smallest feasible change"],
        ].map(([n, title, sub]) => (
          <Link
            href={
              n === "01"
                ? "/documents"
                : n === "02"
                  ? "/graph"
                  : n === "03"
                    ? "/scenarios"
                    : "/rescue"
            }
            key={n}
          >
            <span>{n}</span>
            <div>
              <strong>{title}</strong>
              <small>{sub}</small>
            </div>
            <ArrowRight size={17} />
          </Link>
        ))}
      </div>
    </>
  );
}
export function FundingPage({ actor, notify }: Props) {
  const data = useData<Funding[]>("funding", "/funding-sources");
  const { busy, run } = useTask(notify);
  const [form, setForm] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="CAPITAL, WITH CONTEXT"
        title="Funding sources"
        description="Ownership, restrictions, availability, and evidence stay attached to every source."
        action={
          <button className="button primary" onClick={() => setForm(!form)}>
            <Plus size={16} />
            Add funding
          </button>
        }
      />
      {actor.role === "PARENT" && (
        <Notice>
          You can see only your own contribution and explicitly shared financial
          resources. These limits are enforced by the API.
        </Notice>
      )}
      {form && (
        <form
          className="panel form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const raw = Object.fromEntries(new FormData(e.currentTarget));
            try {
              const parsed = z
                .object({
                  label: z.string().min(2),
                  amount: z.coerce.number().min(0).max(1e9),
                  currency: z.enum(["EUR", "USD", "VND", "GBP"]),
                  available_from: z.iso.date(),
                  availability_status: z.enum([
                    "AVAILABLE",
                    "PLANNED",
                    "EXPECTED",
                    "CONDITIONAL",
                  ]),
                  source_type: z.enum([
                    "STUDENT_BALANCE",
                    "PARENT_SUPPORT",
                    "SCHOLARSHIP",
                    "OTHER",
                  ]),
                  confirmation_note: z.string().min(8),
                })
                .parse(raw);
              const result = await run(
                () => api("/funding-sources", "POST", parsed),
                "Funding added with explicit confirmation.",
              );
              if (result) setForm(false);
            } catch {
              setError(
                "Check the amount, date, and confirmation note (at least 8 characters).",
              );
            }
          }}
        >
          <label>
            Source name
            <input name="label" required placeholder="Personal EUR savings" />
          </label>
          <label>
            Amount
            <input name="amount" type="number" min="0" step=".01" required />
          </label>
          <label>
            Currency
            <select name="currency">
              <option>EUR</option>
              <option>VND</option>
              <option>USD</option>
              <option>GBP</option>
            </select>
          </label>
          <label>
            Available from
            <input name="available_from" type="date" required />
          </label>
          <label>
            Type
            <select name="source_type">
              <option>STUDENT_BALANCE</option>
              <option>PARENT_SUPPORT</option>
              <option>SCHOLARSHIP</option>
              <option>OTHER</option>
            </select>
          </label>
          <label>
            Availability
            <select name="availability_status">
              <option>AVAILABLE</option>
              <option>PLANNED</option>
              <option>EXPECTED</option>
              <option>CONDITIONAL</option>
            </select>
          </label>
          <label className="span-2">
            Confirmation note
            <input
              name="confirmation_note"
              minLength={8}
              placeholder="How did you confirm these funds?"
              required
            />
          </label>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            Confirm funding
          </button>
        </form>
      )}
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <Notice danger>{data.error.message}</Notice>
      ) : !data.data?.length ? (
        <Empty title="No funding sources" />
      ) : (
        <div className="funding-grid">
          {data.data.map((f) => (
            <article className="panel funding-card" key={f.id}>
              <div className="card-top">
                <span className="fund-icon">
                  {f.restriction_type === "EMERGENCY" ? (
                    <LockKeyhole />
                  ) : (
                    <Globe2 />
                  )}
                </span>
                <Badge value={f.availability_status} />
              </div>
              <h2>{f.label}</h2>
              <div className="amount">{money(f.amount, f.currency)}</div>
              <dl>
                <div>
                  <dt>Owned by</dt>
                  <dd>
                    {f.owner_actor_id === "maya"
                      ? "Maya"
                      : f.owner_actor_id === "father"
                        ? "Father"
                        : f.owner_actor_id}
                  </dd>
                </div>
                <div>
                  <dt>Available from</dt>
                  <dd>{f.available_from}</dd>
                </div>
                <div>
                  <dt>Restriction</dt>
                  <dd>{label(f.restriction_type)}</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>
                    <Badge value={f.verification_status} />
                  </dd>
                </div>
              </dl>
              {f.availability_status === "EXPECTED" && (
                <Notice>Forecast only. Excluded from verified coverage.</Notice>
              )}
              {f.restriction_type === "EMERGENCY" && (
                <Notice>Protected from automatic allocation.</Notice>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export function CommitmentsPage({ actor, notify }: Props) {
  const data = useData<Obligation[]>("obligations", "/obligations");
  const { busy, run } = useTask(notify);
  const [form, setForm] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="DEADLINES BEFORE BALANCES"
        title="Financial commitments"
        description="Every obligation has an owner, a verified destination, and a deadline."
        action={
          ["STUDENT", "ADMIN_DEMO"].includes(actor.role) && (
            <button className="button primary" onClick={() => setForm(!form)}>
              <Plus size={16} />
              Add commitment
            </button>
          )
        }
      />
      {form && (
        <form
          className="panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const raw = Object.fromEntries(new FormData(e.currentTarget));
            run(async () => {
              const parsed = z
                .object({
                  label: z.string().min(2),
                  amount: z.coerce.number().positive(),
                  currency: z.enum(["EUR", "USD", "VND", "GBP"]),
                  due_date: z.iso.date(),
                  beneficiary: z.string().regex(/^[A-Z0-9_-]{3,80}$/),
                  confirmation_note: z.string().min(8),
                  type: z.string(),
                  priority: z.string(),
                })
                .parse(raw);
              await api("/obligations", "POST", parsed);
              setForm(false);
            }, "Commitment confirmed and financial state updated.");
          }}
        >
          <label>
            Commitment name
            <input name="label" required />
          </label>
          <label>
            Amount
            <input name="amount" type="number" min=".01" step=".01" required />
          </label>
          <label>
            Currency
            <select name="currency">
              <option>EUR</option>
              <option>USD</option>
              <option>VND</option>
              <option>GBP</option>
            </select>
          </label>
          <label>
            Deadline
            <input name="due_date" type="date" required />
          </label>
          <label>
            Type
            <select name="type">
              <option>TUITION</option>
              <option>RENT</option>
              <option>HOUSING_DEPOSIT</option>
              <option>INSURANCE</option>
              <option>OTHER</option>
            </select>
          </label>
          <label>
            Priority
            <select name="priority">
              <option>CRITICAL</option>
              <option>HIGH</option>
              <option>NORMAL</option>
              <option>OPTIONAL</option>
            </select>
          </label>
          <label>
            Verified account identifier
            <input name="beneficiary" pattern="[A-Z0-9_-]{3,80}" required />
          </label>
          <label>
            Explicit confirmation note
            <input name="confirmation_note" minLength={8} required />
          </label>
          <button className="button primary" disabled={busy}>
            Confirm commitment
          </button>
        </form>
      )}
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <Notice danger>{data.error.message}</Notice>
      ) : !data.data?.length ? (
        <Empty title="No commitments yet" />
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Commitment</th>
                  <th>Amount</th>
                  <th>Deadline</th>
                  <th>Beneficiary</th>
                  <th>Priority</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.label}</strong>
                      <small>
                        {label(o.type)} · {label(o.status)}
                      </small>
                      {o.installment_option && (
                        <span className="caption accent">
                          Installment alternative available
                        </span>
                      )}
                    </td>
                    <td>{money(o.amount, o.currency)}</td>
                    <td>
                      <Clock3 size={13} className="inline-icon" />
                      {o.due_date}
                    </td>
                    <td>
                      <code>{o.beneficiary}</code>
                      {o.security_hold ? (
                        <Badge value="BLOCKED" />
                      ) : (
                        <Check size={14} className="inline-icon accent" />
                      )}
                    </td>
                    <td>
                      <Badge value={o.priority} />
                    </td>
                    <td>
                      <Badge value={o.verification_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
