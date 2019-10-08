
import * as cdk from "@aws-cdk/core";
import iam = require('@aws-cdk/aws-iam')
import { ServicePrincipal } from '@aws-cdk/aws-iam'

import apigw = require('@aws-cdk/aws-apigateway');
import { IntegrationOptions, IntegrationResponse, MethodOptions, MethodResponse, EmptyModel } from '@aws-cdk/aws-apigateway';
import sqs = require('@aws-cdk/aws-sqs');

/*
    Sourced from: https://msimpson.co.nz/APIGateway-SQS/ 

    In: https://github.com/msimpsonnz/cdk-ci-cd/blob/master/cdk/cdk.ts

    new MFC.ApiGatewaySQS(this, 'Service', {
        resourceName: "TWILIO-x234s3453sd1ASWXX", // unique end point
        gatewayName: "TwilioWebHook", // name for web hook
        queue: sqsQueue // destination queue
    });

    NOTE: remember to pass in --content-type="application/json"

*/

interface MfIGwSqsProps {
    queue: sqs.Queue,
    gatewayName: string,
    resourceName: string,
}

export class ApiGatewaySQS extends cdk.Construct {

    // public readonly function: lambda.Function;

    constructor(scope: cdk.Construct, id: string, props: MfIGwSqsProps) {
        super(scope, id);

        let queue = props.queue;

        // Create an IAM Role for API Gateway to assume
        const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
        });

        /*************  methodOptions setup       */

        // Create an empty response model for API Gateway
        var model: EmptyModel = {
            modelId: "Empty"
        };

        // Create a method response for API Gateway using the empty model
        var methodResponse: MethodResponse = {
            statusCode: '200',
            responseModels: { 'application/json': model }
        };

        // Add the method options with method response to use in API Method
        var methodOptions: MethodOptions = {
            methodResponses: [
                methodResponse
            ]
        };

        /*************  apiGatewayIntegration setup      */

        // Create intergration response for SQS
        var integrationResponse: IntegrationResponse = {
            statusCode: '200'
        };

        // Create integration options for API Method
        var integrationOptions: IntegrationOptions = {
            credentialsRole: apiGatewayRole,
            requestParameters: {
                'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
            },
            requestTemplates: {
                'application/json': 'Action=SendMessage&QueueUrl=$util.urlEncode("' + queue.queueUrl + '")&MessageBody=$util.urlEncode($input.body)'
            },
            integrationResponses: [
                integrationResponse
            ]
        };

        /************* main stuff */

        // Create the SQS Integration
        const apiGatewayIntegration = new apigw.AwsIntegration({
            service: "sqs",
            path: queue.queueName,
            integrationHttpMethod: "POST",
            options: integrationOptions,
        });

        // Create the API Gateway
        const apiGateway = new apigw.RestApi(this, props.gatewayName);

        // Create a API Gateway Resource
        const hook = apiGateway.root.addResource('hooks');
        const msg = hook.addResource(props.resourceName);

        // Create a Resource Method
        msg.addMethod('POST', apiGatewayIntegration, methodOptions);

        //Grant API GW IAM Role access to post to SQS
        queue.grantSendMessages(apiGatewayRole);

    }

}

