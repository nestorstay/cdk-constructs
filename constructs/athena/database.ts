import cdk = require('@aws-cdk/core');

import { CfnDatabase, CfnDatabaseProps } from "@aws-cdk/aws-glue";


interface GlueDatabaseProps {
    name: string,
    catalogId: string
}

export class GlueDatabase extends cdk.Resource {
    readonly database: CfnDatabase;
    readonly catalogId: string;
    readonly dbName: string;

    constructor(scope: cdk.Construct, id: string, props: GlueDatabaseProps) {
        super(scope, id);

        const db_props: CfnDatabaseProps = {
            catalogId: props.catalogId,
            databaseInput: {
                name: props.name
            }
        }

        this.catalogId = props.catalogId;
        this.dbName = props.name;
        this.database = new CfnDatabase(this, "cfndatabase_" + props.name, db_props);
    }
}
