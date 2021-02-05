const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamo.service);
const request = require('axios');
XLSX = require('xlsx');
const {extractSquadFromHTML} = require('./helpers');
const {extractMatchesFromHTML} = require('./helpers');
const theSeason = process.env.SCRAPE_SEASON;
const id = process.env.SCRAPE_ID;
const baseUrl = process.env.SCRAPE_URL;

exports.handler = async function (event, context) {

  var season = await request.get(baseUrl + '/teams/team.sd?team_id=2598&season_id='+id+'&teamTabs=results');
  const matches = extractMatchesFromHTML(season.data);

  var matches2 = [];
  for(var i=0; i <matches.length; i++) {
    var res = await request.get(baseUrl + '/matches/additional_information.sd?id_game=' + matches[i].id);
    if(!getResults(theSeason,matches[i].date )) {
        matches2.push(matches[i]);
    }

    //var apps = extractSquadFromHTML(res.data, matches[i].date, matches[i].comp, theSeason);
    //matches[i].apps = apps;
  }

  return {
    "headers": { 'Content-Type': 'application/json'},
    "statusCode": 200,
    "body": JSON.stringify(matches2)
  };
};

async function getResults(season, date) {

    var params = {
         TableName: "TranmereWebGames",
         KeyConditionExpression: "season = :season",
         FilterExpression : "#date = :date",
         ExpressionAttributeNames: {
            "#date": "date"
         },
         ExpressionAttributeValues: {
            ":season": season,
            ":date": date
         },
         Limit: 1
    };
    var result = await dynamo.query(params).promise();
    return result.Items;

};