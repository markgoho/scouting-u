# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (markgoho/scouting-u), using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Commands

Scripts are in `package.json`. Notably: `sync:ranks` is manual/annual, not part of the build (ADR 0003) — re-run it only when refreshing source data. No test suite exists in this repo.

## Architecture

Read `CONTEXT.md` for domain vocabulary and `docs/adr/` for the decisions behind the data model, search, and theme split before making structural changes.
