const { v4: uuidv4 } = require('uuid');
const csv=require('csvtojson');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();

exports.mediaHandler = (event, context) => {
   console.log("Incoming Event: ", event);
   const bucket = event.Records[0].s3.bucket.name;
   const filename = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
   const params = { Bucket: bucket, Key: filename };
   console.log(params);
   const s3Stream = s3.getObject(params).createReadStream();
   const tableName = filename.replace(".csv", "");

    csv().fromStream(s3Stream)
         .on('data', (row) => {
            let item = JSON.parse(row);
            console.log(JSON.stringify(item));
            if(item.attendance) {
                item.attendance = parseInt(item.attendance);
            }
            item.id = uuidv4();
            let paramsToPush = {
                TableName:tableName,
                Item: item
            };
            addData(paramsToPush);
    });

};

function addData(params) {
    console.log("Adding a new item based on: ");
    docClient.put(params, function(err, data) {
    if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Added item:", JSON.stringify(params.Item, null, 2));
        }
    });
}