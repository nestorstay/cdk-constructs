import { Construct, Resource } from '@aws-cdk/core';
import { CfnResolver, CfnResolverProps } from '@aws-cdk/aws-appsync';

import { Schema } from './schema';
import { DataSource } from './data-source';
import { Function } from './function';


export interface ResolverProps {

    /**
     *  Schema we are attached to
     *
     */
    schema: Schema,

    /**
     *  Data source, not requried for pipelines (e.g. when there are functions)
     *
     */
    dataSource?: DataSource,

    /**
     *  Query type name, must be from TypeName ENUM
     *
     */
    typeName: ResolverTypeName

    /**
     * fieldName to attach resolver to
     */
    fieldName: string,

    /**
         * requestMappingTemplate
         * 
         */
    requestMappingTemplate: string,

    /**
     * responseMappingTemplate
     * 
     * @default "$util.toJson($ctx.result)"
     */
    responseMappingTemplate: string,

    /**
     * functions - if supplied will make resolver a pipeline resolver
     */
    functions?: Function[],

}

export class Resolver extends Resource {

    public readonly id: string;
    private readonly resource: GraphQLResolver;

    constructor(scope: Construct, id: string, props: ResolverProps) {
        super(scope, id);

        let resolverKind = Kind.UNIT; // default

        // See if this is should be a pipeline
        let pipelineConfig = undefined;
        if (props.functions && props.functions.length) {
            if (props.dataSource) {
                throw Error("The data source for " + id + " must be declared in the pipeline functions, not in the resolver properties")
            }
            resolverKind = Kind.PIPELINE;
            const funcs = props.functions.map(f => f.id);
            pipelineConfig = { "functions": funcs };
            /* requestMappingTemplate is required in props, but could be an empty string 
            Even though pipleline resolver doesn't require it, cdk deploy will fail if its empty,
            so give it a value
            */
            props.requestMappingTemplate = 'none';
        }

        this.resource = new GraphQLResolver(this, 'Resource', {
            apiId: props.schema.api.id,
            typeName: props.typeName,
            fieldName: props.fieldName,
            kind: resolverKind,
            dataSourceName: props.dataSource ? props.dataSource.name : undefined,
            pipelineConfig: pipelineConfig,
            requestMappingTemplate: props.requestMappingTemplate,
            responseMappingTemplate: props.responseMappingTemplate
        });

        this.resource.node.addDependency(props.schema);
        if (props.dataSource) {
            this.resource.node.addDependency(props.dataSource);
        }

        this.id = this.resource.ref;
    }
}

class GraphQLResolver extends CfnResolver {
    constructor(scope: Construct, id: string, props: CfnResolverProps) {
        super(scope, id, props);

    }
}

export enum ResolverTypeName {
    MUTATION = 'Mutation',
    QUERY = 'Query',
}

export enum Kind {
    /**
     * Single unit
     */
    UNIT = 'UNIT',
    /**
     * PIPELINE
     */
    PIPELINE = 'PIPELINE',

}

/**
 * NOTES
 * - renaming resolver causes Cloudformation issue (does not detach old one before creating new)
 */