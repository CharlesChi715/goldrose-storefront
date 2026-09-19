#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

export AWS_REGION=us-west-2
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="eldreve-backups-${ACCOUNT_ID}-us-west-2-an"

aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null || aws s3api create-bucket \
  --bucket "$BUCKET" \
  --bucket-namespace account-regional \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws s3api put-bucket-ownership-controls --bucket "$BUCKET" \
  --ownership-controls "Rules=[{ObjectOwnership=BucketOwnerEnforced}]"

aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" \
  --lifecycle-configuration file://lifecycle.json

aws s3api put-bucket-policy --bucket "$BUCKET" --policy file://bucket-policy.json

echo "$BUCKET"
