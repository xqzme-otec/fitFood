# Definition of Done

This document defines the shared minimum completion standard for all product work in the FitFood repository. A PBI may be marked `Done` only when **all** applicable criteria below are satisfied, in addition to the issue-specific acceptance criteria.

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
- [ ] All CI checks pass on the merge commit (when CI is configured)

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