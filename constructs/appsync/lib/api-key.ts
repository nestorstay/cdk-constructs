import { Construct, Resource, Duration } from '@aws-cdk/core';
import { CfnApiKey, CfnApiKeyProps } from '@aws-cdk/aws-appsync';

import { GraphQLApi } from './graphql-api';

export interface GraphQLApiKeyProps {

    /**
     *  GraphQLApi to attach to
     */
    readonly api: GraphQLApi;

    /**
     * Description of this ApiKey
     */
    description?: string,

    /**
     * cdk.Duration object
     * 
     * Min: 1 day
     * Max: 365 days
     * 
     * @default 7 days (cloudformation)
     */
    expires?: Duration // TODO validate min 1 day, max 365 days
}

export class GraphQLApiKey extends Resource {

    public readonly id: string;
    private readonly resource: GraphQLApiKeyResource;

    constructor(scope: Construct, id: string, props: GraphQLApiKeyProps) {
        super(scope, id);

        this.resource = new GraphQLApiKeyResource(this, 'Resource', {
            apiId: props.api.id,
            description: props.description,
            expires: props.expires ? props.expires.toSeconds() : undefined
        });

    }
}

class GraphQLApiKeyResource extends CfnApiKey {
    constructor(scope: Construct, id: string, props: CfnApiKeyProps) {
        super(scope, id, props);
    }
}
