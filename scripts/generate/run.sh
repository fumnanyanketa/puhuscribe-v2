#!/usr/bin/env bash
# ============================================================================
# Turnkey content generation: installs Voikko + Python deps, then generates
# validated Finnish content and emits the loadable Supabase SQL.
#
# THIS is "content generation". Do NOT reingest from CC corpora (that is the
# separate, deferred CC-reingest path under scripts/ingest/).
#
# Requirements: run from the repo root on branch claude/peaceful-carson-mEZVc,
# with ANTHROPIC_API_KEY set in the environment.
#
# Usage:  bash scripts/generate/run.sh
#   PER_TOPIC=8 LEVELS="A1 A2"  bash scripts/generate/run.sh   # override defaults
# ============================================================================
set -u

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set." >&2
  echo "Set it as an environment secret in this Claude Code environment, then start a NEW session." >&2
  exit 1
fi

if [ ! -f scripts/generate/run_batch.py ]; then
  echo "ERROR: scripts/generate/ not found. You are on the wrong branch." >&2
  echo "Run: git fetch origin && git checkout claude/peaceful-carson-mEZVc && git pull" >&2
  exit 1
fi

echo "== 1/3  Installing Voikko (Finnish morphology) + venv tooling =="
apt-get update -qq || true   # tolerate blocked 3rd-party PPAs; the main archive is enough
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libvoikko1 voikko-fi python3-venv

echo "== 2/3  Python virtualenv + dependencies =="
python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r scripts/requirements.txt

echo "== 3/3  Generating validated content (Sonnet 4.6) =="
.venv/bin/python scripts/generate/run_batch.py --per-topic "${PER_TOPIC:-8}" --levels ${LEVELS:-A1 A2}

echo
echo "Done. Review then load these in the Supabase SQL editor / human review:"
echo "  scripts/generate/out/generated_sentences.sql        <- load into Supabase"
echo "  scripts/generate/out/generated_puhekieli_REVIEW.tsv <- spoken forms, human-verify"
