#!/usr/bin/env python3
"""Enforce a minimum per-module line-coverage threshold for critical modules.

pytest-cov can only fail the build on a *global* threshold (`--cov-fail-under`).
The course requires each *critical* module to reach at least 30% line coverage,
so this script reads the Cobertura `coverage.xml` produced by

    pytest --cov=app --cov-report=xml

and exits non-zero if any critical module falls below the threshold.

Usage:
    python scripts/check_critical_coverage.py [coverage.xml] [--threshold 0.30]
"""
from __future__ import annotations

import argparse
import sys
import xml.etree.ElementTree as ET

# Core product logic whose correctness the project depends on. Keep in sync with
# the "Critical modules" table in docs/testing.md.
CRITICAL_MODULES = [
    "app/services/nutrition.py",
    "app/services/targets.py",
    "app/services/recommendation.py",
    "app/services/classifier.py",
    "app/services/receipt.py",
    "app/services/fridge.py",
]


def line_rates(coverage_xml: str) -> dict[str, float]:
    """Map source filename -> line-rate (0..1) from a Cobertura report.

    Cobertura `filename` attributes are relative to the configured <source>
    root (here `app/`), so a module is indexed both as reported (e.g.
    "services/nutrition.py") and with the package prefix ("app/services/...")
    to make lookups robust regardless of how the threshold list is written.
    """
    tree = ET.parse(coverage_xml)
    root = tree.getroot()
    source_roots = [s.text.strip().rstrip("/").rsplit("/", 1)[-1]
                    for s in root.iter("source") if s.text]

    rates: dict[str, float] = {}
    for cls in root.iter("class"):
        filename = cls.get("filename")
        if not filename:
            continue
        filename = filename.replace("\\", "/")
        rate = float(cls.get("line-rate", "0"))
        rates[filename] = rate
        for src in source_roots:
            rates[f"{src}/{filename}"] = rate
    return rates


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("coverage_xml", nargs="?", default="coverage.xml")
    parser.add_argument("--threshold", type=float, default=0.30,
                        help="minimum line coverage per critical module (default 0.30)")
    args = parser.parse_args()

    try:
        rates = line_rates(args.coverage_xml)
    except FileNotFoundError:
        print(f"ERROR: {args.coverage_xml} not found. "
              f"Run: pytest --cov=app --cov-report=xml", file=sys.stderr)
        return 2

    failures: list[str] = []
    print(f"Critical-module coverage gate (threshold {args.threshold:.0%}):")
    for module in CRITICAL_MODULES:
        rate = rates.get(module)
        if rate is None:
            failures.append(f"  {module}: MISSING from coverage report")
            print(f"  ✗ {module}: not found in report")
            continue
        status = "ok" if rate >= args.threshold else "FAIL"
        marker = "✓" if rate >= args.threshold else "✗"
        print(f"  {marker} {module}: {rate:.0%} [{status}]")
        if rate < args.threshold:
            failures.append(f"  {module}: {rate:.0%} < {args.threshold:.0%}")

    if failures:
        print("\nCritical-module coverage gate FAILED:", file=sys.stderr)
        print("\n".join(failures), file=sys.stderr)
        return 1

    print("\nAll critical modules meet the coverage threshold.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
