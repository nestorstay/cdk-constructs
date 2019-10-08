import apigw = require('@aws-cdk/aws-apigateway');

// TODO: Add smarts to validate the calling origin headers
// and then match to localhost / test-stay.com and nestorstay.com
// to prevent CSSR - but Mark requests we JFDI for now

export interface IAddCors {
    apiResource: apigw.IResource,
    extraHeaders?: string[],
    methods?: string[],
}

const DEFAULT_HEADERS = [
    'Content-Type', 'X-Amz-Date',
    'Authorization', 'X-Api-Key', 'X-Amz-Security-Token',
    'X-MF-Token' // our own special one
];

const ALL_METHODS = [
    'OPTIONS', 'GET', 'PUT', 'POST', 'DELETE'
]

export function AddCorsOption(props: IAddCors) {

    // add extra headers if needed and create header string
    let extraHeaders = props.extraHeaders || [];
    let headerList = DEFAULT_HEADERS.concat(extraHeaders)
    let headers = headerList.join(',');

    // use limited methods, or default to all
    let methodList = props.methods ? props.methods : ALL_METHODS;
    let methods = methodList.join(',');

    // https://github.com/aws/aws-cdk/issues/906#issuecomment-526194819
    props.apiResource.addMethod('OPTIONS', new apigw.MockIntegration({
        integrationResponses: [{
            statusCode: '200',
            // contentHandling: apigw.ContentHandling.CONVERT_TO_TEXT,
            responseParameters: {
                'method.response.header.Access-Control-Allow-Headers': `'${headers}'`,
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'false'",
                'method.response.header.Access-Control-Allow-Methods': `'${methods}'`, // modify this based on methods
            }
        }],
        passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_MATCH,
        requestTemplates: {
            "application/json": "{\"statusCode\": 200}"
        }
    }), {
            methodResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true, // COGNITO
                    'method.response.header.Access-Control-Allow-Origin': true,
                }

            }]
        })


}

