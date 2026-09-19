#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")"

export AWS_REGION=us-west-2
export AWS_PAGER=""
ROLE=eldreve-backup-writer
FAIL=0
LOCKS=""

row() { printf '%-12s %s\n' "$1" "$2"; }
bad() { row "$1" "✗ $2"; FAIL=1; }
lock() { if [ "$2" = "$3" ]; then LOCKS="$LOCKS  $1 ✓"; else LOCKS="$LOCKS  $1 ✗"; FAIL=1; fi; }

ARN=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null) || {
  bad identity "not signed in — run: aws login"
  exit 1
}
ACCOUNT=$(printf '%s' "$ARN" | cut -d: -f5)
BUCKET="eldreve-backups-${ACCOUNT}-us-west-2-an"
row identity "${ARN##*/} @ $ACCOUNT"

if REGION=$(aws s3api get-bucket-location --bucket "$BUCKET" --query LocationConstraint --output text 2>/dev/null); then
  row bucket "$BUCKET  $REGION"
  WANT_DAYS=$(python3 -c "import json; print(json.load(open('lifecycle.json'))['Rules'][0]['Expiration']['Days'])")
  DAYS=$(aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET" --query 'Rules[0].Expiration.Days' --output text 2>/dev/null)
  lock public-block "$(aws s3api get-public-access-block --bucket "$BUCKET" --query 'PublicAccessBlockConfiguration.[BlockPublicAcls,IgnorePublicAcls,BlockPublicPolicy,RestrictPublicBuckets]' --output text 2>/dev/null | tr -s '\t' ' ')" "True True True True"
  lock versioning "$(aws s3api get-bucket-versioning --bucket "$BUCKET" --query Status --output text 2>/dev/null)" Enabled
  lock encryption "$(aws s3api get-bucket-encryption --bucket "$BUCKET" --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text 2>/dev/null)" AES256
  lock "lifecycle ${DAYS}d" "$DAYS" "$WANT_DAYS"
  lock https-only "$(aws s3api get-bucket-policy --bucket "$BUCKET" --query Policy --output text 2>/dev/null | grep -c 'aws:SecureTransport')" 1
  row "  locks" "${LOCKS#  }"
else
  bad bucket "$BUCKET not found"
fi

ACTIONS=$(aws iam get-role-policy --role-name "$ROLE" --policy-name PutOnlyBackups --query 'PolicyDocument.Statement[].Action' --output text 2>/dev/null)
INLINE=$(aws iam list-role-policies --role-name "$ROLE" --query 'length(PolicyNames)' --output text 2>/dev/null)
ATTACHED=$(aws iam list-attached-role-policies --role-name "$ROLE" --query 'length(AttachedPolicies)' --output text 2>/dev/null)
if [ "$ACTIONS" = "s3:PutObject" ] && [ "$INLINE" = "1" ] && [ "$ATTACHED" = "0" ]; then
  row role "$ROLE  s3:PutObject only ✓"
else
  bad role "$ROLE  actions='$ACTIONS' inline=$INLINE attached=$ATTACHED"
fi

HAVE=" $(gh variable list --json name --jq '[.[].name] | join(" ")' 2>/dev/null) $(gh secret list --json name --jq '[.[].name] | join(" ")' 2>/dev/null) "
MISSING=""
for name in AWS_ROLE_ARN S3_BUCKET BACKUP_PGHOST BACKUP_PGUSER BACKUP_PGPASSWORD; do
  case "$HAVE" in *" $name "*) ;; *) MISSING="$MISSING $name" ;; esac
done
if [ -z "$MISSING" ]; then row github "4 variables + 1 secret set ✓"; else bad github "missing:$MISSING"; fi

LAST=$(gh run list --workflow db-backup.yml --status success --limit 1 --json createdAt --jq '.[0].createdAt // empty' 2>/dev/null)
NEWEST=$(aws s3api list-objects-v2 --bucket "$BUCKET" --prefix db/ --query 'sort_by(Contents,&LastModified)[-1].Key' --output text 2>/dev/null)
if [ -n "$LAST" ] && [ -n "$NEWEST" ] && [ "$NEWEST" != "None" ]; then
  HOURS=$(python3 -c "import sys, datetime as d; t = d.datetime.fromisoformat(sys.argv[1].replace('Z', '+00:00')); print(int((d.datetime.now(d.timezone.utc) - t).total_seconds() // 3600))" "$LAST")
  COUNT=$(aws s3api list-objects-v2 --bucket "$BUCKET" --prefix "${NEWEST%/*}/" --query 'length(Contents)' --output text 2>/dev/null)
  if [ "$HOURS" -lt 25 ]; then
    row "last backup" "$LAST  ${HOURS} h ago  $COUNT objects in ${NEWEST%/*}/ ✓"
  else
    bad "last backup" "$LAST  ${HOURS} h ago — older than 25 h"
  fi
else
  bad "last backup" "no successful run, or the bucket is empty"
fi

BUDGET=$(aws budgets describe-budgets --account-id "$ACCOUNT" --query 'Budgets[0].[BudgetName,CalculatedSpend.ActualSpend.Amount,BudgetLimit.Amount]' --output text 2>/dev/null | tr -s '\t' ' ')
if [ -n "$BUDGET" ] && [ "$BUDGET" != "None" ]; then
  set -- $BUDGET
  row budget "$1  \$$2 of \$$3"
else
  bad budget "no budget found"
fi

exit "$FAIL"
