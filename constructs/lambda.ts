
import * as cdk from "@aws-cdk/core";
// For... lambda!
import * as lambda from '@aws-cdk/aws-lambda';
// For cron
import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets');
// For Secrets permissions
import iam = require('@aws-cdk/aws-iam');
import logs = require('@aws-cdk/aws-logs');
const ssm = require('@aws-cdk/aws-ssm');

interface MfILamdaProps {
    assetPath: string, // what are we deploying
    environment?: object, // { TABLE: ..., FOO: 'bar'}
    handler?: string,
    description?: string,
    timeout?: number, // seconds
    memorySize?: number,
    secretAccess?: string, // e.g. 'foo/read'
    role?: iam.IRole, // if we need to assume a specific role
    cron?: events.CronOptions,
    initialPolicy?: iam.PolicyStatement[],
    events?: lambda.IEventSource[],
    layers?: lambda.ILayerVersion[],
    reservedConcurrentExecutions?: number
}

export class Lambda extends cdk.Construct {

    public readonly function: lambda.Function;

    constructor(scope: cdk.Construct, id: string, props: MfILamdaProps) {
        super(scope, id);

        let env: any = props.environment ? props.environment : {};
        env.DEPLOY_ENV = process.env.DEPLOY_ENV; // required

        let constructId = id + '+' + env.DEPLOY_ENV;

        // We don't want for ever as logs take space and cost money
        let logRetention = logs.RetentionDays.THREE_MONTHS;

        let role: any = props.role ? props.role : undefined;

        // Always add our base layer
        const layers = props.layers ? props.layers : [];
        layers.push(this.baseLayer());

        let lam = new lambda.Function(scope, constructId, {
            code: lambda.Code.asset(props.assetPath),
            handler: props.handler ? props.handler : "index.handler",
            runtime: lambda.Runtime.NODEJS_10_X,
            environment: env,
            description: props.description,
            role: role,
            memorySize: props.memorySize || 128,
            timeout: cdk.Duration.seconds(props.timeout ? props.timeout : 60),
            logRetention: logRetention,
            initialPolicy: props.initialPolicy,
            events: props.events,
            layers: layers,
            reservedConcurrentExecutions: props.reservedConcurrentExecutions
        });

        if (props.secretAccess) {
            // Access secrets
            lam.addToRolePolicy(new iam.PolicyStatement({
                resources: ['*'], // TODO: lock down the supplied string
                actions: ['secretsmanager:getSecretValue']
            }));
        }

        if (props.cron && process.env.DEPLOY_ENV === 'production') {
            // Add cloud watch cron job, but NOT on dev!
            const rule = new events.Rule(this, constructId + '+Rule', {
                schedule: events.Schedule.cron(props.cron)
            });
            rule.addTarget(
                new targets.LambdaFunction(lam)
            );
        }

        this.function = lam;
    }

    baseLayer() {
        const baseLayerArn = ssm.StringParameter.valueForStringParameter(
            this,
            '/layers/BaseLayer'
        );
        return lambda.LayerVersion.fromLayerVersionArn(
            this,
            'BaseLayer',
            baseLayerArn
        );

        // Somewhere else a  new lambda.LayerVersion
        // ise created and the param saved to ssm
        // new ssm.StringParameter(this, 'VersionArn', {
        //     parameterName: '/layers/BaseLayer',
        //     stringValue: baseLayer.layerVersionArn,
        // });

    }

}
