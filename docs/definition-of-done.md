# Definition of Done

This document defines the shared minimum completion standard for all product work in the FitFood repository. A PBI may be marked `Done` only when **all** applicable criteria below are satisfied, in addition to the issue-specific acceptance criteria.

**Updated for Assignment 4** with explicit quality-requirement-test, coverage, and testing-evidence criteria (see "Quality and testing requirements" below). These gates are maintained project assets: later Sprints must keep them passing or extend them, not bypass or disable them, per [`Assignment_04.md`](../Assignment_04.md#part-6-update-the-definition-of-done).

---

## Applicable to all PBIs (User Stories, Other PBIs, Bug Reports)

- [ ] All issue-specific acceptance criteria are satisfied and verified
- [ ] Verification evidence is recorded in the linked MR (screenshots, test output, or manual check description)
- [ ] The work is reviewed and approved by a team member other than the implementer
- [ ] The reviewer has left at least one meaningful review comment in the MR
- [ ] The MR description is fully filled in using the MR template (linked issue, AC verification table, DoD checklist, changelog entry)
- [ ] No known regressions introduced in existing functionality
- [ ] The issue Work Status is updated to `Done` in the issue tracker

---

## Applicable to implementation and supporting PBIs

- [ ] The issue-linked MR is merged into the protected default branch (`main`) using a merge commit (not squash, not rebase)
- [ ] The source branch is deleted after merge
- [ ] All CI checks required for the product stack pass on the latest commit of the MR and on the resulting merge commit: the [`tests`](../.github/workflows/tests.yml) workflow (pytest — unit, integration, and QRT-marked tests, with coverage) and the [`qa`](../.github/workflows/qa.yml) workflow (Bandit + pip-audit)

---

## Quality and testing requirements (Assignment 4)

These criteria apply to implementation and supporting PBIs. They are maintained gates: if the product stack, quality requirements, critical-module list, or CI configuration change in a later Sprint, update this section instead of letting it go stale.

- [ ] Relevant automated unit and/or integration tests are added or updated for the change and pass in the `tests` CI workflow. Test locations and what they cover are tracked in [`docs/testing.md`](testing.md).
- [ ] If the change touches an area covered by a Quality Requirement Test in [`docs/quality-requirement-tests.md`](quality-requirement-tests.md) (QRT-1 nutrition correctness, QRT-2 API latency, QRT-3 recommendation determinism — pytest marker `qrt`), the corresponding QRT(s) pass in CI.
- [ ] If the change touches a critical module, automated line coverage for that module stays at or above 30% (enforced by [`scripts/check_critical_coverage.py`](../scripts/check_critical_coverage.py) in the `tests` workflow), or a TA-approved exception is documented. The current critical modules and their measured coverage are tracked in [`docs/testing.md`](testing.md#critical-modules--coverage).
- [ ] The additional QA check (Bandit static security analysis + pip-audit dependency audit, `qa` workflow) passes for the change.
- [ ] Testing evidence (test output, the `coverage-xml` CI artifact, or a CI run link) is referenced in the MR description or in linked documentation, not only asserted.

---

## Changelog requirement

- [ ] If the change is user-visible: a corresponding entry has been added to [`CHANGELOG.md`](../CHANGELOG.md) under `[Unreleased]` using the appropriate category (`Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`, or `Security`)
- [ ] If the change is not user-visible (refactoring, CI config, internal docs): the MR changelog checklist explicitly marks it as not applicable

---

## Applicable to User Story issues

A User Story issue may be marked `Done` only when **all** of the following are true:

- [ ] All linked supporting PBIs required to satisfy the story's acceptance criteria are individually marked `Done`
- [ ] All supporting PBI MRs are merged into `main`
- [ ] The story's acceptance criteria are collectively satisfied by the merged work
- [ ] Verification evidence is traceable from the story issue through the linked supporting PBIs and their MRs

> A User Story issue does not require its own dedicated implementation MR. Traceability is maintained through the linked supporting PBIs.

---

## Applicable to Bug Report issues

- [ ] The root cause is identified and described in the MR or issue comments
- [ ] The fix has been verified against the acceptance criteria defined in the Bug Report
- [ ] The bug does not reappear under the documented reproduction steps

---

## Branch and workflow requirements

- [ ] The branch follows the naming convention `<issue-number>-short-description` (e.g. `12-user-account-creation`)
- [ ] The branch was created from the issue page or explicitly linked to the issue
- [ ] The MR is linked to the issue (`Closes #<n>` in the MR description)
- [ ] Direct commits to `main` were not used (except for the initial repository setup commit)

---