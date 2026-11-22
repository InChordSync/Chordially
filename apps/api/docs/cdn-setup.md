# CDN / CloudFront Setup for Avatar Delivery

1. Create a CloudFront Distribution pointing to the S3 Bucket configured in `AWS_S3_BUCKET`.
2. Configure Origin Access Identity (OAI) to restrict direct S3 bucket access.
3. Use signed URLs for private media (if applicable) through the CloudFront key pair.
