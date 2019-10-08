import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');

import { CfnTable, CfnTableProps } from "@aws-cdk/aws-glue";

import { GlueDatabase } from './database';

type columnDescriptor = { name: string, type: string };

interface glueTableFromS3Props {
    sourceBucket: s3.IBucket,
    bucketPrefix: string,
    columnDescriptorList: columnDescriptor[],
    glueDatabase: GlueDatabase,
    tableName?: string; // allow someone to customise table name
}

export class GlueTableFromS3 extends cdk.Resource {

    public readonly table: CfnTable;

    constructor(scope: cdk.Construct, id: string, props: glueTableFromS3Props) {
        super(scope, id);

        let pathString: string = props.columnDescriptorList.map(
            descriptor => descriptor.name
        ).join(",");

        const bucketName = props.sourceBucket.bucketName;
        const bucketPrefix = props.bucketPrefix;
        const s3Location = "s3://" + bucketName + "/" + props.bucketPrefix;

        // Build config
        const storageDescriptor: CfnTable.StorageDescriptorProperty = {
            inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
            location: s3Location,
            outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            columns: props.columnDescriptorList,
            serdeInfo: {
                serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
                parameters: {
                    paths: pathString
                }
            }
        }

        const tableName = props.tableName || "table" + id;

        const tableInputProperty: CfnTable.TableInputProperty = {
            name: tableName,
            tableType: "EXTERNAL_TABLE",
            partitionKeys: [],
            parameters: {
                classification: "json"
            },
            storageDescriptor: storageDescriptor
        }

        const tableProps: CfnTableProps = {
            catalogId: props.glueDatabase.catalogId,
            databaseName: props.glueDatabase.dbName,
            tableInput: tableInputProperty,
        }

        // Create resource

        let table = new CfnTable(this, tableName, tableProps);
        // Make sure dependencies are set
        table.addDependsOn(props.glueDatabase.database);
        table.node.addDependency(props.sourceBucket);

        this.table = table;
    }



}

