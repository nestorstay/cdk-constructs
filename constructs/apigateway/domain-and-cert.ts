
import * as cdk from "@aws-cdk/core";
import route53 = require('@aws-cdk/aws-route53');
import route53_targets = require('@aws-cdk/aws-route53-targets');
import certmgr = require('@aws-cdk/aws-certificatemanager');
import apigw = require('@aws-cdk/aws-apigateway');

import * as MFC from '../';

interface baseMapping {
    api: apigw.RestApi,
    basePath: string,
}

export interface IApiGwDomCertMapper extends MFC.IBaseStack {
    hostedZone: route53.PublicHostedZone, // which zone
    domainName: string, // actual FQN
    apiMap: baseMapping[], // array of mapping path to
}

export class ApiGatewayDomain extends cdk.Construct {

    // public readonly function: lambda.Function;

    constructor(scope: cdk.Construct, id: string, props: IApiGwDomCertMapper) {
        super(scope, id);

        // create a certificate
        const certificate = new certmgr.DnsValidatedCertificate(this, 'TestCertificate', {
            domainName: props.domainName,
            hostedZone: props.hostedZone,
            region: 'us-east-1', // so can do edge 
        });

        // Create the domain
        const domain = new apigw.DomainName(this, 'custom-domain', {
            domainName: props.domainName,
            certificate: certificate,
            endpointType: apigw.EndpointType.EDGE // default is REGIONAL
        });

        // Map the apis and their paths
        props.apiMap.forEach((path: any) => {
            domain.addBasePathMapping(path.api, {
                basePath: path.basePath
            })
        });

        // add an alias to the DNS record
        new route53.ARecord(this, 'DomainAliasRecordForApiDomain', {
            zone: props.hostedZone,
            recordName: props.domainName,
            target: route53.AddressRecordTarget.fromAlias(new route53_targets.ApiGatewayDomain(domain))
        });

    }

}

