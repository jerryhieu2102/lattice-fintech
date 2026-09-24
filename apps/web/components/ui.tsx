"use client";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  LoaderCircle,
} from "lucide-react";
import { percent, money, label } from "@/lib/api";
import type { Coverage } from "@/lib/types";
export function Badge({ value }: { value: string }) {
  const green = [
    "VERIFIED",
    "USER_CONFIRMED",
    "SOURCE_VERIFIED",
    "AVAILABLE",
    "ACTIVE",
    "SAFE",
    "EXECUTED",
    "APPROVED",
  ].includes(value);
  const red = [
    "BLOCKED",
    "STALE",
    "FAILED",
    "CONFLICTED",
    "SECURITY_REVIEW",
  ].includes(value);
  return (
    <span className={`badge ${green ? "green" : red ? "red" : "amber"}`}>
      {label(value)}
    </span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <ShieldCheck size={28} />
      <h3>{title}</h3>
      <p>
        {children ||
          "Load Maya from the demo controls to start a reproducible walkthrough."}
      </p>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" />
      Loading verified workspace…
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Metric({
  label: heading,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <span>{heading}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function CoverageTable({ coverage }: { coverage: Coverage[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Commitment</th>
            <th>Due</th>
            <th>Nominal</th>
            <th>Verified</th>
            <th>On-time verified</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {coverage.map((c) => (
            <tr key={c.obligation_id}>
              <td>
                <strong>{c.label}</strong>
                <small>{money(c.amount, c.currency)}</small>
              </td>
              <td>{c.due_date.slice(5)}</td>
              {[c.nominal, c.verified, c.on_time_verified].map((v, i) => (
                <td key={i}>
                  <div className="coverage-value">
                    {percent(v)}
                    <div className={`bar ${i === 2 ? "teal" : ""}`}>
                      <i style={{ width: percent(v) }} />
                    </div>
                  </div>
                </td>
              ))}
              <td>
                <Badge
                  value={
                    !c.in_horizon
                      ? "OUTSIDE_HORIZON"
                      : c.on_time_verified >= 1
                        ? "SAFE"
                        : "AT_RISK"
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Notice({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`notice ${danger ? "danger" : ""}`}>
      <AlertTriangle size={17} />
      <div>{children}</div>
    </div>
  );
}
export function Arrow() {
  return <ArrowUpRight size={16} />;
}
