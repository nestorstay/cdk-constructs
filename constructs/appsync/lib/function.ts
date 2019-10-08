import { Construct, Resource } from '@aws-cdk/core';
import { CfnFunctionConfiguration, CfnFunctionConfigurationProps } from '@aws-cdk/aws-appsync';

import { DataSource } from './data-source';

export interface FunctionProps {

    /**
     *  Name of this function
     *
     */
    name: string,

    /**
     *  A data source (required, even if of type 'NONE')
     *
     */
    dataSource: DataSource,

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
     * Description label
     */
    description?: string,

    /**
     * version of function spec
     * 
     * @default 2018-05-29
     */
    functionVersion?: string,
}

export class Function extends Resource {

    public readonly id: string;
    public readonly resource: GraphQLFunction;

    constructor(scope: Construct, id: string, props: FunctionProps) {
        super(scope, id);

        // docs suggest `_` is valid, but Cloudformation throws errors, so being safe!
        const validName = /^[A-Za-z][0-9A-Za-z]+$/.test(props.name);
        if (!validName) {
            throw Error(`Function name '${props.name}' not valid, Must start with a letter and contains only numbers, letters and "_"`);
        }

        this.resource = new GraphQLFunction(this, 'Resource', {
            name: props.name,
            apiId: props.dataSource.api.id,
            description: props.description,
            functionVersion: props.functionVersion ? props.functionVersion : "2018-05-29",
            dataSourceName: props.dataSource.name,
            requestMappingTemplate: props.requestMappingTemplate,
            responseMappingTemplate: props.responseMappingTemplate ? props.responseMappingTemplate : "$util.toJson($ctx.result)"
        });

        this.resource.node.addDependency(props.dataSource);

        this.id = this.resource.attrFunctionId;
    }
}

class GraphQLFunction extends CfnFunctionConfiguration {
    constructor(scope: Construct, id: string, props: CfnFunctionConfigurationProps) {
        super(scope, id, props);

    }
}
