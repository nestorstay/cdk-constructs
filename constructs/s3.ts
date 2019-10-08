
import * as cdk from "@aws-cdk/core";
import * as s3 from '@aws-cdk/aws-s3';

interface MfIS3Props {
}

export class S3 extends cdk.Construct {

    public readonly bucket: s3.Bucket;

    constructor(scope: cdk.Construct, id: string, props: MfIS3Props) {
        super(scope, id);

        // https://docs.aws.amazon.com/AmazonS3/latest/dev/access-control-block-public-access.html#access-control-block-public-access-options
        const blockPublicAccess = new s3.BlockPublicAccess({
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        });

        const constructId = id + '+inner';

        const bucket = new s3.Bucket(this, constructId, {
            blockPublicAccess: blockPublicAccess
        });

        this.bucket = bucket;
    }

}

