#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com

aws iam create-role --role-name eldreve-backup-writer \
  --max-session-duration 3600 \
  --assume-role-policy-document file://trust-policy.json

aws iam put-role-policy --role-name eldreve-backup-writer \
  --policy-name PutOnlyBackups \
  --policy-document file://permission-policy.json

aws iam get-role --role-name eldreve-backup-writer --query Role.Arn --output text
