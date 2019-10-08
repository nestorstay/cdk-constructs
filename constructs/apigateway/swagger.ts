
import * as SwaggerParser from "swagger-parser";

import * as cdk from "@aws-cdk/core";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as MFC from '../';

// SEE: https://gist.github.com/abbottdev/17379763ebc14a5ecbf2a111ffbcdd86

/* USAGE: */
// let pathMethodToLambda: any = {
//     '/{id}:get': readPropertyLambda,
//     '/{id}:post': writePropertyLambda,
// };

// let apiGateway = new apigateway.RestApi(this, "My API", {
//     restApiName: "MyAPI",
// });

// new MFC.SwaggerBasedResources(this, 'Swag', {
//     apiGateway: apiGateway,
//     serviceDir: __dirname,
//     pathMethodToLambda: pathMethodToLambda
// });


export interface ISwaggerProps {
    apiGateway: apigateway.RestApi
    serviceDir: string,
    cognitoUserPoolArns?: string[],
    swaggerFile?: string; // defaults to swagger.yaml'
    pathMethodToLambda: any
}

interface IaddMethodLambda {
    swaggerApi: any,
    authorizer?: apigateway.CfnAuthorizer,
    endpoint: any,
    resource: apigateway.IResource,
    methodName: string,
    lambda: lambda.IFunction
}

export class SwaggerBasedResources extends cdk.Construct {

    private readonly serviceDir: string;
    private readonly swaggerFile: string = 'swagger.yaml';

    constructor(scope: cdk.Construct, id: string, props: ISwaggerProps) {
        super(scope, id);

        this.serviceDir = props.serviceDir + '/'; // TODO: check not already a '/' on there
        if (props.swaggerFile) {
            this.swaggerFile = props.swaggerFile;
        }

        SwaggerParser
            .parse(this.serviceDir + this.swaggerFile)
            .then(swagger => {
                this.convertSwaggerToCdkRestApi(swagger, props);
            });
    }

    convertSwaggerToCdkRestApi(swaggerApi: any, props: ISwaggerProps) {

        let apiGateway = props.apiGateway;
        let pathMethodToLambda = props.pathMethodToLambda;

        // https://github.com/aws/aws-cdk/issues/723#issuecomment-505027173
        // + https://github.com/aws/aws-cdk/issues/723#issuecomment-506541270
        let authorizer: any;
        if (props.cognitoUserPoolArns) {

            const apiGatewayRole = new Role(this, 'RestApiRole', {
                assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
            });

            authorizer = new apigateway.CfnAuthorizer(this, 'authorizer', {
                authorizerCredentials: apiGatewayRole.roleArn,
                identitySource: 'method.request.header.Authorization',
                name: `rest-api-authorizer`,
                restApiId: apiGateway.restApiId,
                type: 'COGNITO_USER_POOLS',
                providerArns: props.cognitoUserPoolArns,
                authorizerResultTtlInSeconds: 0
            });

        }

        let paths = Object.keys(swaggerApi.paths);

        paths.forEach(pathName => {

            const resource = apiGateway.root.resourceForPath(pathName);
            const methods = Object.keys(swaggerApi.paths[pathName]);

            methods.forEach(methodName => {

                let pathMethod = pathName + ':' + methodName;
                let backingLambda;
                if (pathMethodToLambda[pathMethod]) {
                    backingLambda = pathMethodToLambda[pathMethod];
                }

                if (!backingLambda && methodName === 'options') {
                    // No lambda provided, 
                    MFC.AddCorsOption({
                        apiResource: resource
                    });
                } else {
                    let endpoint = swaggerApi.paths[pathName][methodName];
                    this.addMethodLambda({
                        swaggerApi: swaggerApi,
                        authorizer: authorizer,
                        endpoint: endpoint,
                        resource: resource,
                        methodName: methodName,
                        lambda: backingLambda
                    })
                }


            });

        });
    }
    addMethodLambda(props: IaddMethodLambda) {

        let endpoint = props.endpoint;

        let integrationParameters: any = undefined;
        let methodParameters: any = undefined;

        if (endpoint.parameters && endpoint.parameters.length) {
            let parameters: any[] = endpoint.parameters;
            integrationParameters = {};
            methodParameters = {};

            parameters.forEach(swaggerParameter => {
                integrationParameters[`integration.request.${swaggerParameter.in}.${swaggerParameter.name}`] = `method.request.${swaggerParameter.in}.${swaggerParameter.name}`;
                methodParameters[`method.request.${swaggerParameter.in}.${swaggerParameter.name}`] = true;
            });
        }

        let methodArgs: any = {
            requestParameters: methodParameters,
        }

        if (props.authorizer) {
            methodArgs.authorizationType = apigateway.AuthorizationType.COGNITO,
                methodArgs.authorizer = {
                    authorizerId: props.authorizer.ref
                }
        }

        props.resource.addMethod(props.methodName,
            new apigateway.LambdaIntegration(props.lambda, {
                requestParameters: integrationParameters,
            }), methodArgs
        );
    }
}

