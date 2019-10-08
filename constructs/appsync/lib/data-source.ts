import { Construct, Resource, Stack } from '@aws-cdk/core';
import { ServicePrincipal, Role, ManagedPolicy } from '@aws-cdk/aws-iam';
import { CfnDataSource, CfnDataSourceProps } from '@aws-cdk/aws-appsync';

import dynamodb = require("@aws-cdk/aws-dynamodb");

import { GraphQLApi } from './graphql-api';

export interface DataSourceProps {

    /**
     *  GraphQLApi to attach to
     */

    readonly api: GraphQLApi;

    /**
     *  DynamoDBTable object - if not supplied will default to a datasource of 'NONE' type
     *
     * 
     */
    readonly table?: dynamodb.Table;


    /**
     *  Optional Name for datasource
     */

    readonly name?: string

}

export class DataSource extends Resource {

    public readonly id: string;
    public readonly name: string;
    public readonly api: GraphQLApi;

    private readonly resource: GraphQLDataSourceResource;

    constructor(scope: Construct, id: string, props: DataSourceProps) {
        super(scope, id);

        let dataSourceProps: any = {
            apiId: props.api.id,
            name: props.name ? props.name : id,
            type: Type.NONE,
        }

        if (props.table) {

            dataSourceProps.type = Type.AMAZON_DYNAMODB;

            dataSourceProps.dynamoDbConfig = {
                tableName: props.table.tableName,
                awsRegion: Stack.of(this).region
            };

            const tableRole = new Role(this, 'DynamoDBRole', {
                assumedBy: new ServicePrincipal('appsync.amazonaws.com')
            });
            tableRole.addManagedPolicy(
                ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
            );

            dataSourceProps.serviceRoleArn = tableRole.roleArn
        }

        this.resource = new GraphQLDataSourceResource(this, 'Resource', dataSourceProps);

        this.resource.node.addDependency(props.api);
        if (props.table) {
            this.resource.node.addDependency(props.table);
        }

        this.api = props.api;
        this.name = this.resource.attrName;
    }
}

class GraphQLDataSourceResource extends CfnDataSource {
    constructor(scope: Construct, id: string, props: CfnDataSourceProps) {
        super(scope, id, props);

    }
}

export enum Type {

    AMAZON_DYNAMODB = 'AMAZON_DYNAMODB', // The data source is an Amazon DynamoDB table.

    AMAZON_ELASTICSEARCH = 'AMAZON_ELASTICSEARCH', // The data source is an Amazon Elasticsearch Service domain.

    AWS_LAMBDA = 'AWS_LAMBDA', // The data source is an AWS Lambda function.

    NONE = 'NONE', //There is no data source. This type is used when you wish to invoke a GraphQL operation without connecting to a data source, such as performing data transformation with resolvers or triggering a subscription to be invoked from a mutation.

    HTTP = 'HTTP', // The data source is an HTTP endpoint.

    RELATIONAL_DATABASE = 'RELATIONAL_DATABASE', // The data source is a relational database.
}