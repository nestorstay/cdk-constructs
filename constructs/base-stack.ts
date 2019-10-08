import cdk = require('@aws-cdk/core');

export interface IBaseStack {
    env: any,
    stackName: string,
}

export class BaseStack extends cdk.Stack {

    constructor(scope: cdk.Construct, id: string, props: IBaseStack) {
        let p = {
            env: props.env, // env has region and account
            stackName: props.stackName
        }
        super(scope, id, p);

        // Tag everything in the stack with the stack name
        cdk.Tag.add(this, 'stack', props.stackName);
    }
}