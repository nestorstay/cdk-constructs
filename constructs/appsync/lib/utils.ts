const fs = require('fs');

/* read request mapping
If its a batch resolver then we have to include the table name in the resolver string.
We put a placeholder in the vm file and replace with a token which cdk will resolve when we deploy
 */
export function fromFile(filename: string, tables?: any): string {
    if (!fs.existsSync(filename)) {
        throw Error("Attempting to read resolver mapping from missing file! - " + filename);
    }
    if (tables === undefined) {
        return fs.readFileSync(filename, 'utf8')
    }
    else {
        let fread = fs.readFileSync(filename, 'utf8');

        tables.forEach(function (item: any) {
            fread = fread.replace(item.placeholder, item.value)
        })
        return fread;
    }

}

export enum snippet {
    JSON_OF_RESULT = "$util.toJson($ctx.result)",
}