const request = require('axios');
XLSX = require('xlsx');
const {extractSquadFromHTML} = require('./helpers');
const {extractMatchesFromHTML} = require('./helpers');

exports.handler = async function (event, context) {

  var theSeason = event.pathParameters.season;
  var id = event.pathParameters.id;

  var season = await request.get('https://www.x.com/teams/team.sd?team_id=2598&season_id='+id+'&teamTabs=results');
  const matches = extractMatchesFromHTML(season.data);

  for(var i=0; i <matches.length; i++) {
    var res = await request.get('https://www.x.com/matches/additional_information.sd?id_game=' + matches[i].id);
    var apps = extractSquadFromHTML(res.data, matches[i].date, matches[i].comp, theSeason);
    matches[i].apps = apps;
  }

    return {
        "headers": { 'Content-Type': 'application/json'},
        "statusCode": 200,
        "body": JSON.stringify(matches)
    };
};