
export * from './lib/schema';
export * from './lib/data-source';
export * from './lib/graphql-api';
export * from './lib/resolver';
export * from './lib/function';
export * from './lib/api-key';
export * from './lib/utils';

/**
 * EXAMPLE code:
 */

// import cdk = require('@aws-cdk/core');
// import dynamodb = require("@aws-cdk/aws-dynamodb");

// import * as appsync from './';

// const definition = `type Foo {
//   FooId: ID!
//   name: String
// }
// type PaginatedFoo {
//   items: [Foo!]!
//   nextToken: String
// }
// type Query {
//   all(limit: Int, nextToken: String): PaginatedFoo!
//   getOne(FooId: ID!): Foo
// }
// type Mutation {
//   save(name: String!): Foo
//   delete(FooId: ID!): Foo
// }
// type Schema {
//   query: Query
//   mutation: Mutation
// }`;

// const requestMapEg = `{
//   "version": "2017-02-28",
//   "operation": "GetItem",
//   "key": {
//     "FooId": $util.dynamodb.toDynamoDBJson($ctx.args.FooId)
//   }
// }`;

//     // table
//     const testTable = new dynamodb.Table(this, 'testTable', {
//       partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
//       billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
//     });

//     // GraphQL
//     const api = new appsync.GraphQLApi(this, 'TestAPI', {
//       authenticationType: 'API_KEY'
//     });

//     // An API Key if you want to generate one
//     const key = new appsync.GraphQLApiKey(this, 'AKey', {
//         api: api
//     });

//     const schema = new appsync.Schema(this, 'schema', {
//       api: api,
//       definition: definition
//     });

//     const dataSource = new appsync.DataSource(this, 'ds', {
//       api: api,
//       table: testTable
//     })

//     // Simple single resolver
//     new appsync.Resolver(this, 'simpleResolver', {
//       schema: schema,
//       dataSource: dataSource,
//       typeName: appsync.ResolverTypeName.MUTATION,
//       fieldName: 'save',
//       requestMappingTemplate: requestMapEg
//     });

//     // Functions for a pipeline resolver
//     const function1 = new appsync.Function(this, 'function1', {
//       name: "functionTest1",
//       dataSource: dataSource,
//       requestMappingTemplate: requestMapEg,
//     })

//     const function2 = new appsync.Function(this, 'function2', {
//       name: "functionTest2",
//       dataSource: dataSource,
//       requestMappingTemplate: requestMapEg,
//     })

//     new appsync.Resolver(this, 'pipelineResolver', {
//       schema: schema,
//       typeName: appsync.ResolverTypeName.MUTATION,
//       fieldName: 'delete',
//       functions: [function1, function2],
//       requestMappingTemplate: requestMapEg
//     });

