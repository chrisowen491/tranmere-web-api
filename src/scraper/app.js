const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamo.service);
const request = require('axios');
XLSX = require('xlsx');
const {extractSquadFromHTML} = require('./helpers');
const {extractMatchesFromHTML} = require('./helpers');
const {extractExtraFromHTML} = require('./helpers');
const theSeason = process.env.SCRAPE_SEASON;
const id = process.env.SCRAPE_ID;
const baseUrl = process.env.SCRAPE_URL;
var today = new Date();
today.setHours(0,0,0,0);

exports.handler = async function (event, context) {

  var season = await request.get(baseUrl + '/teams/team.sd?team_id=2598&season_id='+id+'&teamTabs=results');
  const matches = extractMatchesFromHTML(season.data);
  var gamesFromDb = await getResults(theSeason);

  for(var i=0; i < matches.length; i++) {
    var res = await request.get(baseUrl + '/matches/additional_information.sd?id_game=' + matches[i].scrape_id);
    var found = false;
    var gameDate = new Date(matches[i].date);

    if(today >= gameDate) {
        for(var x=0; x < gamesFromDb.length; x++) {
            if(gamesFromDb[x].date == matches[i].date ) {
                found = true
            }
        }
        if(!found) {
            var apps = extractSquadFromHTML(res.data, matches[i].date, matches[i].comp, theSeason);
            for(var y=0; y < apps.apps.length; y++) {
                //await insertUpdateItem(apps.apps[y], "TranmereWebAppsTable");
            }
            for(var y=0; y < apps.goals.length; y++) {
                //await insertUpdateItem(apps.goals[y], "TranmereWebGoalsTable");
            }
            delete matches[i].scrape_id;
            matches[i] = extractExtraFromHTML(res.data, matches[i].date, matches[i].comp, theSeason, matches[i]);
            await insertUpdateItem(matches[i], "TranmereWebGames");
        }
    }
  }

  return {
    "headers": { 'Content-Type': 'application/json'},
    "statusCode": 200,
    "body": JSON.stringify('ok')
  };
};

async function getResults(season, date) {

    var params = {
         TableName: "TranmereWebGames",
         KeyConditionExpression: "season = :season",
         ExpressionAttributeValues: {
            ":season": season
         }
    };
    var result = await dynamo.query(params).promise();
    return result.Items;

};

async function insertUpdateItem(item, type){
	const params = {
		TableName: type,
		Item: item
	};

	return await dynamo.put(params).promise();
}