import { Construct, Resource, Stack } from '@aws-cdk/core';
import { CfnGraphQLSchema, CfnGraphQLSchemaProps } from '@aws-cdk/aws-appsync';
import { GraphQLApi } from './graphql-api';

export interface SchemaProps {

    /**
     *  GraphQLApi to attach to
     */
    readonly api: GraphQLApi;

    /**
     * Definition of the schema
     */
    readonly definition: string;

}

export class Schema extends Resource {

    public readonly id: string;
    public readonly api: GraphQLApi;
    private readonly resource: SchemaResource;

    constructor(scope: Construct, id: string, props: SchemaProps) {
        super(scope, id);

        if (props.definition.length < 1) {
            // Match cloud formation validation
            let stackName = Stack.of(this).stackName;
            throw Error(`Definition has to be greater than 1 character - in ${stackName}`);
        }

        this.resource = new SchemaResource(this, 'Resource', {
            apiId: props.api.id,
            definition: props.definition
        });

        this.resource.node.addDependency(props.api);

        this.api = props.api;
        this.id = this.resource.ref;
    }
}

class SchemaResource extends CfnGraphQLSchema {
    constructor(scope: Construct, id: string, props: CfnGraphQLSchemaProps) {
        super(scope, id, props);

    }
}