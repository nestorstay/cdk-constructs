import { Construct, Resource } from '@aws-cdk/core';
import { CfnGraphQLApi, CfnGraphQLApiProps } from '@aws-cdk/aws-appsync';

export interface GraphQLApiProps {

    /**
     *  Name of this GraphQLApi
     *
     * @default - construct id.
     */
    readonly name?: string;

    /**
     * The GraphQLApi to attach GraphQLApi to.
     */
    readonly authenticationType: AuthenticationType;

}

export class GraphQLApi extends Resource {

    public readonly id: string;
    private readonly resource: GraphQLApiResource;

    constructor(scope: Construct, id: string, props: GraphQLApiProps) {
        super(scope, id);

        const name = props.name ? props.name : id;

        this.resource = new GraphQLApiResource(this, 'Resource', {
            name: name,
            authenticationType: props.authenticationType,
            // AdditionalAuthenticationProviders - if we need more than just API_key
        });

        this.id = this.resource.attrApiId;
    }
}

class GraphQLApiResource extends CfnGraphQLApi {
    constructor(scope: Construct, id: string, props: CfnGraphQLApiProps) {
        super(scope, id, props);

    }
}


export enum AuthenticationType {
    API_KEY = 'API_KEY',
    AWS_IAM = 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS = 'AMAZON_COGNITO_USER_POOLS',
    OPENID_CONNECT = 'OPENID_CONNECT',
}