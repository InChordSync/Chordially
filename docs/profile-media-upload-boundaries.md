# Profile & media upload boundaries (S3-backed assets)

This documents the responsibility boundary between apps when a creator
uploads a profile photo, banner, or media asset backed by S3.

## Who does what

- **web / mobile** — collect the file client-side, validate type/size
  locally for fast feedback, and request a signed upload URL from the API.
  Clients never receive AWS credentials directly.
- **api** — issues short-lived, single-object presigned S3 URLs (via
  `@aws-sdk/s3-request-presigner`), validates the final object exists
  before persisting its URL, and owns all bucket/key naming.
- **packages/shared** — owns the size/type validation rules so web,
  mobile, and the API enforce identical limits.

## Current limits

- Allowed types: `image/jpeg`, `image/png`, `image/webp`.
- Max size: 5 MB per asset.

## Boundary rule

No app should construct S3 URLs, bucket names, or credentials directly —
only `apps/api` talks to S3. Clients only ever see a presigned URL to
upload to, and the final public URL to display.
