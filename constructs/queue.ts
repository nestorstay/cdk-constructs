
import * as cdk from "@aws-cdk/core";
import * as sqs from '@aws-cdk/aws-sqs';
import * as cw from '@aws-cdk/aws-cloudwatch';

interface MfIQueueProps {
    visibilityTimeout?: number,
    maxReceiveCount?: number,
}

export class Queue extends cdk.Construct {

    public readonly queue: sqs.Queue;

    constructor(scope: cdk.Construct, id: string, props: MfIQueueProps) {
        super(scope, id);

        let constructId = id + '+inner';

        const DLQ = new sqs.Queue(this, `${constructId}+DLQ`, {
            retentionPeriod: cdk.Duration.days(13),
        });

        const numVisMessages = DLQ.metricApproximateNumberOfMessagesVisible({
            label: `Visible messages in DLQ for ${id}` // does not work in CDK yet!
        });

        new cw.Alarm(this, 'DLQAlarm', {
            metric: numVisMessages,
            threshold: 1,
            evaluationPeriods: 2,
        });

        // use alarm.addAlarmAction() to do SNS -> email

        const queue = new sqs.Queue(this, constructId, {
            visibilityTimeout: cdk.Duration.seconds(props.visibilityTimeout || 60),
            retentionPeriod: cdk.Duration.days(13),
            deadLetterQueue: {
                maxReceiveCount: props.maxReceiveCount || 1,
                queue: DLQ
            }
        });

        // TODO: add monitoring and alerting here

        this.queue = queue;
    }

}

