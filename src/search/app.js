const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    cloud: {
        id: process.env.ES_CLUSTER,
      },
      auth: {
        username: process.env.ES_USER,
        password: process.env.ES_PASSWORD
      }
});
var utils = require('./libs/utils')(client);

exports.handler = async function (event, context) {
    console.log('Received event:', event);

    var season = event.queryStringParameters.season;
    var competition = event.queryStringParameters.competition;
    var opposition = event.queryStringParameters.opposition;
    var date = event.queryStringParameters.date;
    var manager = event.queryStringParameters.manager;

    var size = 250;

    var query = {
        index: "matches",
        body: {
           "sort": ["Date"],
           "size": size,
           "query": {
              "bool": {
                 "must": []
              }
           }
        }
      };

    if(competition)
        query.body.query.bool.must.push({"match": {"competition": competition}});
    if(opposition)
        query.body.query.bool.must.push({"match": {"teams": opposition}});
    if(season)
        query.body.query.bool.must.push({"match": {"Season": season}});
    if(date)
        query.body.query.bool.must.push({"match": {"Date": date}});
    if(manager) {
        var dates = manager.split(',');
        query.body.query.bool.must.push({"range": {"Date":{ "gte": dates[0], "lte": dates[1]} }});
    }


    console.log(JSON.stringify(query));

    var results = await utils.findTranmereMatchesByQuery(query);

    if(date)
        results = results[0];

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify(results)
     };
};