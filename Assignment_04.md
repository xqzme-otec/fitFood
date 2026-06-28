# Assignment 4

## Focus

In Assignment 4, continue the Sprint-based product work with stronger emphasis on quality, automation, customer feedback, and evidence. The goal is not to maximize the number of issues closed. The goal is to deliver a useful Sprint increment, improve the product based on customer feedback, define measurable quality requirements, verify them through automated tests, and automate the quality gates in CI.

The sprint may include fewer product features than Assignment 3. That is acceptable when the team uses the Sprint to reduce risk, improve product quality, automate verification, and make the delivered increment more reliable. The Sprint must still produce a customer-accessible increment and a traceable response to customer feedback.

The quality requirements, automated quality requirement tests, CI checks, coverage expectations, Definition of Done updates, and workflow evidence created or updated in Assignment 4 are maintained project assets. They must continue to apply during later project work unless a later requirement explicitly supersedes them. Later PBIs must maintain or extend these gates instead of bypassing, disabling, or treating them as one-time submission evidence.

Use [Process Requirements](Process_Requirements.md) as the authoritative source for shared Scrum, Product Backlog, traceability, [Definition of Done](Process_Requirements.md#definition-of-done), [quality requirement and quality requirement test](Process_Requirements.md#architecture-quality-requirements-and-quality-requirement-tests), [UAT](Process_Requirements.md#user-acceptance-tests), and [customer feedback](Process_Requirements.md#customer-feedback-traceability) semantics. Use [Product Repository Requirements](Repository_Requirements.md) as the authoritative source for repository workflow, [release and changelog](Repository_Requirements.md#releases-and-changelog), [CI and automation](Repository_Requirements.md#quality-automation-and-ci), and [public/private artifact handling](Repository_Requirements.md#configuration-sensitive-information-and-public-artifacts) requirements.

Assignment 4 adds week-specific deliverables, evidence, and stricter minimums. Where this assignment repeats a shared rule as a checklist item, the shared requirement remains the definition of the term and this assignment states what evidence must be produced for Week 4.

For this assignment:

* Maintained project assets live in `docs/`.
* The Week 4 public report means `reports/week4/README.md`.
* The Moodle PDF is the private submission wrapper. It contains public permalinks plus private identity, recording, credential, and access details that must not be committed to the public repository.

Follow [Product Repository Requirements](Repository_Requirements.md#configuration-sensitive-information-and-public-artifacts) for reusable public/private evidence handling. The table below is Assignment 4 evidence routing; it does not weaken the shared repository privacy and sensitive-data rules. For Assignment 4, keep the following evidence separated:

| Evidence | Public repository or public report | Moodle or private submission |
|---|---|---|
| Public report, release, CI, test, coverage, and sanitized screenshot evidence | Yes | Link to the public evidence |
| Public sanitized demo video | Yes | Link allowed |
| Presentation slides | Optional sanitized copy as `reports/week4/presentation.pdf` | Required Moodle slide submission |
| Rehearsed presentation video link | No, unless intentionally public and sanitized | Yes |
| Public sanitized customer review summary | Yes | Link to the public evidence |
| Public sanitized customer review transcript or notes | Yes, when publication is permitted | Link to the public evidence |
| Private customer review recording, transcript, notes, and exact recording timecodes | No | Yes, when required or when public publication is refused |
| University emails | No | Yes |
| Private customer UAT recording and exact recording timecodes | No | Yes |
| Private credentials, private access instructions, private consent evidence, or customer-identifying evidence | No | Yes |

## Part 1: Refine the Product Backlog and Plan the Sprint

1. Refine the Product Backlog before Sprint Planning.

2. Review customer feedback, current product risks, quality gaps, and unfinished product work.

3. Create or update PBIs for the selected Sprint scope. The scope may include features, bug fixes, quality improvements, testing work, deployment work, documentation, infrastructure, and automation.

   Follow [Process Requirements](Process_Requirements.md#product-backlog-items-and-scope) for what counts as a PBI.

4. Create an explicit Sprint milestone for Assignment 4 with:

   * Sprint start and finish dates
   * Sprint Goal
   * Selected Sprint PBIs

5. Use the Assignment 4 Sprint milestone as the authoritative Sprint container. Issues assigned to that milestone are the selected Sprint Backlog items.

   Follow [Process Requirements](Process_Requirements.md#sprint-cadence-and-scrum-events) for reusable Sprint container and Sprint Goal semantics.

6. Keep the Sprint milestone separate from SemVer release evidence according to [Process Requirements](Process_Requirements.md#sprint-cadence-and-scrum-events) and [Product Repository Requirements](Repository_Requirements.md#releases-and-changelog).

   The Sprint milestone is planning and scope evidence. The SemVer release is packaged increment evidence created after the Sprint work is complete.

7. The Sprint Goal must be value-focused and must explain what product or quality outcome the team intends to deliver.

8. Assign every selected Sprint PBI to the Sprint milestone.

9. Ensure every selected Sprint PBI has:

   * Clear expected outcome
   * Acceptance criteria
   * Story Points
   * Implementer
   * Different reviewer
   * Current Work Status

   Follow [Process Requirements](Process_Requirements.md#sprint-planning-readiness-and-estimation) and [Process Requirements](Process_Requirements.md#sprint-roles-and-evidence) for reusable readiness, estimation, implementer, reviewer, and evidence expectations.

10. Keep the Product Backlog board/view and Sprint Backlog board/table inspectable.

11. The Sprint Backlog board/table must use GitHub or GitLab platform functionality, such as a Kanban board or GitHub Projects table. Do not use a Markdown table as the Sprint work-management board.

12. The Sprint Backlog board/table must include the items assigned to the Assignment 4 Sprint milestone and show useful work-management information where the platform supports it, such as priority, MVP or release version, estimate or Story Points, assignee, and status.

13. Update `docs/roadmap.md` to reflect the current product direction, current Sprint, expected next Sprint, and quality or automation work that must continue during later project work.

14. Do not count the number of issues as the main success measure. The selected scope should be justified by customer value, quality improvement, risk reduction, and evidence that the selected work is Done.

## Part 2: Respond to Customer Feedback on the MVP

1. Review the customer's feedback on the MVP v1 increment and any later feedback already received.

   Follow [Process Requirements](Process_Requirements.md#customer-feedback-traceability) for reusable feedback traceability and response semantics.

2. Create or update PBIs for feedback points that the team decides to address.

3. In the Week 4 public report, include a customer feedback response table:

   ```markdown
   | Feedback point | Resulting PBI or issue | Status | Response |
   |---|---|---|---|
   | The customer could not find saved items easily. | [#24](...) | Done | Added a saved-items shortcut and improved empty-state text. |
   | The customer requested export to PDF. | [#31](...) | Not planned for this Sprint | Deferred because quality and deployment risks were higher priority. |
   ```

4. Feedback that is not addressed must still have a clear explanation and, where useful, a linked backlog item.

## Part 3: Define Quality Requirements

1. Read the [reference on quality attributes and quality scenarios](https://github.com/Alexey-Popov/awesome-ai-architect/blob/main/solution-architecture/quality-attributes.md) before defining quality requirements.

2. Follow [Process Requirements](Process_Requirements.md#architecture-quality-requirements-and-quality-requirement-tests) for reusable quality requirement semantics, including stable IDs, ISO/IEC 25010 sub-characteristics, measurable scenario format, rationale, traceability, examples, and QRT linkage.

3. Create or update:

   ```text
   docs/quality-requirements.md
   ```

4. Define at least three quality requirements.

5. For Assignment 4, each required quality requirement must use a different ISO/IEC 25010 sub-characteristic.

## Part 4: Define and Automate Quality Requirement Tests

1. Follow [Process Requirements](Process_Requirements.md#architecture-quality-requirements-and-quality-requirement-tests) for reusable QRT semantics, including what counts as an automated QRT, required fields, evidence type distinctions, and when CI checks, unit tests, coverage, type checking, or static analysis may count as QRT evidence.

   Process Requirements define what counts as a QRT. Product Repository Requirements define where the automated QRT must run and how CI evidence must be preserved.

2. Create or update:

   ```text
   docs/quality-requirement-tests.md
   ```

3. Define at least one automated quality requirement test for each quality requirement.

4. Store automated quality requirement tests in normal repository test locations where possible, link them from `docs/quality-requirement-tests.md`, and include them in CI according to [Product Repository Requirements](Repository_Requirements.md#quality-automation-and-ci).

5. If a team cannot automate a quality requirement test for a selected quality requirement during Assignment 4, the team must either choose a different measurable quality requirement or obtain a TA-approved exception.

## Part 5: Implement Product and Quality Improvements

1. Implement the selected Sprint scope.

2. The Sprint increment must include:

   * Product changes selected for the Sprint
   * Customer feedback improvements selected for the Sprint
   * Quality and automation improvements selected for the Sprint
   * Documentation updates needed to make the increment understandable, usable, and verifiable

3. Product and quality improvements must be implemented as maintained project work. Do not implement tests, CI jobs, documentation, or quality gates as temporary artifacts that are removed or ignored after submission.

4. Keep PRs/MRs issue-linked and reviewed according to [Product Repository Requirements](Repository_Requirements.md#issue-linked-workflow-requirements).

5. Verify acceptance criteria before merge according to [Process Requirements](Process_Requirements.md#acceptance-criteria).

6. Update `CHANGELOG.md` for user-visible changes according to [Product Repository Requirements](Repository_Requirements.md#releases-and-changelog).

7. Update the root `README.md` with current run or deployment instructions when they changed.

## Part 6: Update the Definition of Done

1. Follow [Process Requirements](Process_Requirements.md#definition-of-done) for reusable Definition of Done semantics and [Product Repository Requirements](Repository_Requirements.md#quality-automation-and-ci) for Assignment 4 quality-gate and CI evidence requirements.

   Process Requirements define what `Done` means. Product Repository Requirements define the CI, test, coverage, and quality-gate evidence that the Week 4 Definition of Done must require.

2. Update:
    

3. The Definition of Done must include:

   * Acceptance criteria verification
   * Review by another team member
   * Passing CI checks required for the product stack
   * Relevant automated tests
   * Relevant automated quality requirement tests
   * Coverage expectations for critical modules
   * Testing evidence preserved in PRs/MRs, CI, or linked documentation
   * Changelog update for user-visible changes

4. A PBI may be marked `Done` only when the updated Definition of Done is satisfied.

5. If later project work changes the product stack, quality requirements, critical modules, or CI configuration, update the Definition of Done and testing evidence according to the shared requirements instead of leaving Assignment 4 gates stale.

## Part 7: Add Automated Testing and QA Checks

1. Complete the testing, critical-module coverage, `docs/testing.md`, and additional QA check requirements in [Product Repository Requirements](Repository_Requirements.md#quality-automation-and-ci). Follow [Process Requirements](Process_Requirements.md#architecture-quality-requirements-and-quality-requirement-tests) for evidence type distinctions and what can count as QRT evidence.

2. Explore additional automated QA checks relevant to the product technology stack and repository evidence.

   Link checking of any kind, including baseline Lychee, cannot satisfy the Assignment 4 additional QA check. The additional QA check must be distinct from required linting, formatting or type checking, build, unit tests, integration tests, coverage, automated QRTs, and any link-checking job.

3. In the Week 4 public report, summarize:

   * Available additional QA check options considered
   * Additional QA check selected by the team
   * QA objective or risk addressed
   * Why that risk matters for the project
   * Where the check runs in CI
   * Important limitations or deferred QA work

4. Create or update:

   ```text
   docs/testing.md
   ```

5. Implement automated unit tests for critical product logic.

6. Implement automated integration tests for important interactions between product components.

7. Critical modules must each have at least 30% automated line coverage unless a TA explicitly approves another threshold. Global repository coverage may be lower if the team explains why.

8. Store tests in normal repository locations for the selected stack and link to them from `docs/testing.md` and the Week 4 public report.

9. Tests added for Assignment 4 are maintained product assets. Later project work must keep them passing or replace them with documented equivalent or stronger coverage when the product changes.

10. If a product has little traditional source code, for example a no-code or configuration-heavy product, the team must still automate meaningful checks where possible and explain the adapted testing strategy in `docs/testing.md`.

## Part 8: Configure CI

1. Configure or update CI according to [Product Repository Requirements](Repository_Requirements.md#quality-automation-and-ci).

2. Include CI links, branch protection or rules evidence, and testing-report screenshots in the Week 4 public report.

3. The latest protected-default-branch CI run must pass before submission unless the team documents a TA-approved exception or temporary external outage.

## Part 9: Deploy and Release the Sprint Increment

1. Follow [Product Repository Requirements](Repository_Requirements.md#releases-and-changelog) for reusable SemVer release, changelog, artifact, and public demo video requirements.

2. Deploy the latest Sprint increment so the customer and TA can access it.

3. Make the application available to the customer before user acceptance testing. If local access is not enough, deploy it over the internet or provide another agreed remote access method.

4. Keep the deployment, hosted artifact, package, or runnable product accessible until grading is complete.

5. Create a new SemVer release for the Assignment 4 Sprint increment.

6. The release must:

   * Use a SemVer tag prefixed with `v`, for example `v0.2.0`
   * Point to a commit on the protected default branch
   * Identify that it maps to the Assignment 4 Sprint increment
   * Link to the Assignment 4 Sprint milestone
   * Link to deployment or run instructions
   * Link to the public sanitized demo video
   * Include or link relevant built artifacts where applicable

7. Update `CHANGELOG.md` by moving released entries from `[Unreleased]` into a dated SemVer section.

8. Preserve the release, tag, deployment or runnable artifact, and linked quality evidence as later project work continues.

## Part 10: Conduct User Acceptance Testing with the Customer

User acceptance tests are maintained product assets. Week 4 execution results are assignment evidence.

1. Follow [Process Requirements](Process_Requirements.md#user-acceptance-tests) for reusable UAT scenario structure, stable ID, status, execution-history, and traceability rules. Follow [Product Repository Requirements](Repository_Requirements.md#configuration-sensitive-information-and-public-artifacts) for public/private evidence handling.

2. Maintain at least three active end-user-facing user acceptance test scenarios.

3. Create or update:

   ```text
   docs/user-acceptance-tests.md
   ```

4. Week 4 records execution results for at least three active UAT scenarios.

5. The customer must execute at least three active UAT scenarios during a recorded session.

6. UAT may happen during the Sprint Review if the customer executes the scenarios and the recording/evidence requirements are satisfied. One recorded meeting may satisfy both UAT and Sprint Review if it includes customer-executed UAT scenarios and the Sprint Review discussion.

7. Ask for permission before recording starts.

8. Do not commit the private customer UAT recording or recording link to the public repository.

9. Submit the private customer UAT recording link privately through Moodle. The link must be accessible to instructors.

10. If one recording includes both UAT and Sprint Review, include Moodle-only timecodes showing where the customer-executed UAT and Sprint Review discussion occur.

11. In the Week 4 public report, summarize the results without exposing private customer information:

    * Which UAT scenarios passed
    * Which UAT scenarios failed or need product changes
    * Most important feedback points received
    * Resulting PBIs or issues

## Part 11: Conduct the Sprint Review

1. Conduct a Sprint Review with the customer or relevant stakeholder according to [Process Requirements](Process_Requirements.md#sprint-cadence-and-scrum-events). Follow [Product Repository Requirements](Repository_Requirements.md#configuration-sensitive-information-and-public-artifacts) for public/private recording, transcript, notes, and customer-identifying evidence handling.

2. Discuss:

   * Planned Sprint Goal
   * Delivered product increment
   * Addressed customer feedback
   * UAT results
   * Quality requirements and automated quality test evidence
   * Which quality gates, CI checks, or tests must continue into later project work
   * Remaining gaps, risks, and follow-up PBIs

3. Adapt the Product Backlog based on the Sprint Review discussion where appropriate.

4. Before the meeting, ask whether the customer permits publishing a redacted or sanitized English transcript in the public repository. If that permission was already obtained earlier in the project, you may reuse it and do not need to ask again for repository publication.

5. **Always ask for permission before recording starts.** Recording permission is separate and must be obtained before each recorded meeting.

6. Before recording, ask whether the customer permits sharing a sanitized English transcript privately with instructors for assessment if public repository publication is refused.

7. Write the English customer review transcript in:

   ```text
   reports/week4/customer-review-transcript.md
   ```

   Clean it for readability without changing meaning. Place each timestamp on a separate line. Remove PII and confidential business information while preserving enough context for evaluation. Use `[inaudible]` and `[redacted]` where appropriate.

8. Publish the transcript only if repository publication permission has been obtained. If public publication was refused but private instructor sharing was permitted, do not commit the transcript. State this in `reports/week4/README.md` and include the sanitized transcript only in the Moodle PDF or equivalent private instructor-sharing channel.

9. If recording or private instructor sharing is refused, write detailed English notes in:

   ```text
   reports/week4/customer-review-notes.md
   ```

   The notes replace the transcript as evidence. Record the discussion chronologically and include the Sprint Goal reviewed, delivered increment shown, addressed feedback, UAT results, quality requirement evidence, customer feedback, questions, decisions, requested changes, remaining risks, and resulting Product Backlog updates. Sanitize the notes before sharing them with instructors or publishing them.

10. Write the customer review summary in:

    ```text
    reports/week4/customer-review-summary.md
    ```

    Include the date, participants or roles, Sprint Goal reviewed, delivered increment discussed, UAT results, quality evidence discussed, feedback, approvals or requested changes, risks, action points, and resulting Product Backlog or scope changes.

11. If the same recorded meeting includes both customer-executed UAT and the Sprint Review discussion, one recording, transcript or notes file, and summary may cover both events. Include Moodle-only timecodes showing where the customer-executed UAT and Sprint Review discussion occur.

## Part 12: Conduct the Sprint Retrospective

1. Conduct a Sprint Retrospective after the Sprint Review.

2. Write:

   ```text
   reports/week4/retrospective.md
   ```

3. Include:

   * What went well
   * What did not go well
   * What you changed compared to the previous Sprint based on the previous Sprint Retrospective
   * One or two concrete process improvements for the next Sprint

4. Keep the retrospective public and sanitized. Do not include sensitive personal information or private conflict details.

## Part 13: Reflect on the Week

Write:

```text
reports/week4/reflection.md
```

Include:

1. `## Learning points`: what the team learned from responding to customer feedback, defining quality requirements, automating quality requirement tests, configuring CI, running UAT, releasing the Sprint increment, and reviewing the increment with the customer.

2. `## Validated assumptions`: assumptions or decisions confirmed or rejected through implementation, automated testing, CI, deployment, UAT, Sprint Review, or customer feedback.

3. `## Friction and gaps`: unresolved requirements, technical risks, quality gaps, missing test coverage, blocked work, review/process friction, follow-up questions, and uncertainties discovered during the Assignment 4 Sprint.

4. `## Planned response`: how the team will respond in the next Sprint or assignment, with links to affected PBIs, quality requirements, UAT scenarios, CI checks, milestones, releases, or documentation where relevant.

## Part 14: Prepare and Rehearse the Project Presentation

1. Prepare a slide deck for the Assignment 4 project presentation.

2. Submit the presentation slides through the dedicated Moodle slide submission. The slides must be accessible to the TA.

3. Submit a link to a rehearsed presentation video in the Moodle report. The video may be a screencast or a recording of team members presenting. The link must be accessible to instructors.

4. Teams will present during the Week 5 lab.

5. Timing:

   * Each team has 5 minutes for the presentation.
   * The presentation will be stopped when the time runs out.
   * The presentation is followed by 2 minutes for Q&A.

6. Suggested presentation structure:

   * Project context: the problem and the solution (concise and to the point), stakeholders (end-users, customer, etc.)
   * Well-rehearsed demo (under 2 minutes): show the product. This is the most important part of the presentation.
   * Team: roles and contribution of each team member.
   * Requirements: functionality with priorities, main quality requirements (brief).
   * Roadmap: current state and plan for the upcoming weeks.
   * Client collaboration: which part of the solution is already in use by the client, useful feedback received, and current challenges.
   * Links to the deployed project and GitHub repository + QR codes for these links.

7. The whole team must come out when presenting. Having 2 or 3 team members do the actual speaking is acceptable.

8. Rehearse beforehand so the demo and timing fit within the limit.

9. During Q&A, the person who worked on the relevant part should answer where possible. One person should not answer all questions for the team.

## Part 15: Record a Public Sanitized Demo Video

1. Record a public sanitized demo video shorter than two minutes according to [Product Repository Requirements](Repository_Requirements.md#releases-and-changelog) and [Product Repository Requirements](Repository_Requirements.md#configuration-sensitive-information-and-public-artifacts). The public sanitized demo video is a product demonstration for everyone, not a private customer UAT recording.

2. The public sanitized demo video must explain the product features.

3. Use only sanitized demo data.

4. Link the public sanitized demo video from `reports/week4/README.md` and from the SemVer release mapped to the Assignment 4 Sprint increment.

## Part 16: Report on LLM Usage

Write:

```text
reports/week4/llm-report.md
```

Describe how AI/LLM tools were used. If no AI tools were used, state that explicitly.

## Assignment Report in the Repository

Create the following public Week 4 report structure:

```text
reports/
`-- week4/
    |-- README.md
    |-- customer-review-summary.md
    |-- customer-review-transcript.md # if publication is permitted
    |-- customer-review-notes.md      # if recording or private sharing is refused
    |-- reflection.md
    |-- retrospective.md
    |-- llm-report.md
    |-- presentation.pdf              # optional sanitized public copy of the presentation slides
    `-- images/
```

Use `reports/week4/README.md` as the canonical Week 4 public report and submission index. It must contain direct links to every applicable required repository file and external public artifact.

Include:

1. Project name and short description.
2. Link to the Product Backlog board/view.
3. Link to the Sprint Backlog board/table.
4. Link to the Assignment 4 Sprint milestone.
5. Sprint Goal, Sprint dates, and short scope summary.
6. Total Sprint size in Story Points.
7. Summary of delivered product changes.
8. Link to the deployed product, hosted artifact, package, or runnable product.
9. Link to current access or run instructions.
10. Customer feedback response table with feedback points and resulting PBIs or issues.
11. Explanation of feedback not addressed.
12. Link to `docs/roadmap.md`.
13. Link to `docs/definition-of-done.md`.
14. Link to `docs/quality-requirements.md`.
15. Link to `docs/quality-requirement-tests.md`.
16. Link to `docs/testing.md`.
17. Link to `docs/user-acceptance-tests.md`.
18. Summary of the quality model used and selected ISO/IEC 25010 sub-characteristics.
19. Testing status summary, including critical modules and per-module line coverage status.
20. Links to unit tests.
21. Links to integration tests.
22. Links to automated quality requirement tests.
23. Link to the CI pipeline.
24. Link to the latest protected-default-branch CI run.
25. Branch protection or rules evidence for the protected default branch.
26. Screenshots or report links for linting, coverage, tests, and the additional QA check.
27. Short explanation of how the Assignment 4 tests, CI checks, quality requirement tests, and Definition of Done will continue to govern later project work.
28. Link to the SemVer release mapped to the Assignment 4 Sprint increment.
29. Link to `CHANGELOG.md`.
30. Public sanitized demo video shorter than two minutes.
31. Optional link to `reports/week4/presentation.pdf` if the team publishes a sanitized public copy of the presentation slides.
32. Public sanitized UAT results summary.
33. Link to the published customer review transcript; state that the transcript is shared only through Moodle or an equivalent private instructor-sharing channel if public publication was refused but private sharing was permitted; or link to the customer review notes if recording or private sharing was refused.
34. Link to `reports/week4/customer-review-summary.md`.
35. Link to `reports/week4/reflection.md`.
36. Link to `reports/week4/retrospective.md`.
37. Link to `reports/week4/llm-report.md`.
38. Summary of the current product status.
39. Summary of the next steps.
40. Contribution traceability table mapping each team member to issues, PRs/MRs, review activity, testing, quality, automation, or documentation work.
41. Embedded screenshots from `reports/week4/images/` for:

    * Sprint milestone
    * Latest protected-default-branch CI run
    * Branch protection or rules evidence
    * Coverage or test report
    * Additional QA check result
    * SemVer release
    * Example reviewed issue-linked PR/MR

42. Include Product Backlog, Sprint Backlog, deployed product, or runnable artifact screenshots where relevant or where public links may not be inspectable by graders.

## Assignment Report on Moodle

Create one PDF containing:

1. Project name and team number.
2. Table with team members, university emails, GitHub/GitLab usernames, assigned Scrum roles, and assigned technical responsibilities.
3. Who did what during the Sprint.
4. Who did not participate in any of the activities.
5. Commit-hash permalink to `reports/week4/README.md`.
6. Commit-hash permalink to the product repository tree at the submission commit. The commit must be on the protected default branch.
7. Link to the recording of the Sprint Review with the customer.
8. Link to the customer UAT recording. This link must be accessible to instructors and must not be committed to the public repository.

   You may provide a link to the Sprint Review recording with a timecode for UAT if it was a part of the Sprint Review meeting.
9. Sanitized English customer review transcript if it could not be published but private instructor sharing was permitted, or detailed English notes if recording or private instructor sharing was refused.
10. Link to the public sanitized customer review summary.
11. Link to the rehearsed presentation video. This link must be accessible to instructors and must not be committed to the public repository unless the team intentionally makes it public and has removed sensitive information.
12. Exact private access instructions for the deployed product, including limited-permission test credentials if needed.
13. Any instructor-only evidence that must not be committed publicly, such as private consent, access, credential, or customer-identifying evidence.

All public evidence must be indexed in `reports/week4/README.md`.

> [!IMPORTANT]
> Verify all public and private links before submission. Public links must be publicly viewable but not publicly editable. Private Moodle links must be accessible to instructors. Required artifacts and links must remain accessible until the assignment has been graded.

### Submission Procedure

* Submit the PDF through Moodle.
* Submit the presentation slides through the dedicated Moodle slide submission.
* Only one PDF submission and one slide submission per team are required.

### AI and LLM Usage

You may use AI tools, LLMs, or other productivity tools. However:

1. Explicitly report which tools were used and how.
2. The submission must contain meaningful analysis and original team effort.
3. Do not submit filler text, generic AI-generated content, or unnecessary explanations.

Failure to disclose AI usage or submitting low-value AI-generated content may result in a failing grade.
