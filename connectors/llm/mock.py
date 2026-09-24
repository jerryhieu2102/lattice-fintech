"""Deterministic labelled-fixture parser; never presented as general-purpose OCR or a live LLM."""

import re
from decimal import Decimal, InvalidOperation
from datetime import date
from connectors.llm.provider import FactProposal
from lattice_ai.adversarial.detection import security_flags


class MockLLMProvider:
    def classify_document(self, text):
        text = text.upper()
        for token, type_ in [
            ("TUITION", "TUITION_INVOICE"),
            ("SCHOLARSHIP", "SCHOLARSHIP_NOTICE"),
            ("HOUSING", "HOUSING_CONTRACT"),
            ("INSURANCE", "INSURANCE_INVOICE"),
            ("SPONSOR", "SPONSOR_DECLARATION"),
        ]:
            if token in text:
                return type_
        return "UNKNOWN"

    def extract_financial_facts(self, blocks):
        facts = []
        names = {"amount", "currency", "due date", "beneficiary", "available from", "type", "status"}
        for index, block in enumerate(blocks):
            line = block["text"].strip()
            if ":" not in line:
                continue
            key, raw = line.split(":", 1)
            key, raw = key.strip().lower(), raw.strip()
            if key not in names or not raw:
                continue
            normalized = raw
            try:
                if key == "amount":
                    if not re.fullmatch(r"\d{1,12}(?:\.\d{1,2})?", raw) or Decimal(raw) <= 0:
                        continue
                    normalized = str(Decimal(raw).quantize(Decimal(".01")))
                if key == "currency" and raw not in {"EUR", "VND", "USD", "GBP"}:
                    continue
                if key in {"due date", "available from"}:
                    normalized = date.fromisoformat(raw).isoformat()
            except (ValueError, InvalidOperation):
                continue
            facts.append(
                FactProposal(
                    field=key.replace(" ", "_"),
                    raw_value=raw,
                    normalized_value=normalized,
                    confidence=0.98,
                    evidence_text=line,
                    page=block.get("page", 1),
                    block_index=index,
                )
            )
        return facts

    def parse_financial_intent(self, text):
        flags = security_flags(text)
        if flags:
            return {
                "intent": "REVIEW_REQUIRED",
                "flags": flags,
                "steps": ["Review untrusted instructions"],
                "action_authorized": False,
            }
        lowered = text.lower()
        intent = (
            "STRESS_PLAN"
            if any(w in lowered for w in ["delay", "stress", "shock"])
            else "REPAIR_PLAN"
            if any(w in lowered for w in ["repair", "rescue", "shortfall"])
            else "PLAN_COMMITMENTS"
        )
        return {
            "intent": intent,
            "flags": [],
            "steps": [
                "Verify evidence",
                "Read authorized financial state",
                "Run deterministic optimizer",
                "Review coverage and approvals",
            ],
            "action_authorized": False,
        }

    def explain_plan(self, summary):
        n = sum(
            c["priority"] == "CRITICAL" and c["on_time_verified"] < 1 and c["in_horizon"]
            for c in summary.get("coverage", [])
        )
        return f"{n} critical commitments have a verified funding gap within the planning horizon. Expected income is excluded from verified coverage. Allocations were computed by OR-Tools; this explanation cannot authorize an action."

    def generate_benchmark_document(self, truth):
        return "\n".join(f"{k.replace('_', ' ').title()}: {v}" for k, v in truth.items())


provider = MockLLMProvider()
