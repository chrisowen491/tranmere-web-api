module.exports = function (client) {
    return {

         buildImagePath: function (image, width, height) {
            var body = {
             "bucket": "trfc-programmes",
             "key": image,
               "edits": {
                 "resize": {
                   "width": width,
                   "height": height,
                   "fit": "fill",
                 }
               }
             };
            return "https://images.tranmere-web.com/" + Buffer.from(JSON.stringify(body)).toString('base64');
         },

         calculateWinsDrawsLossesFromMatchesSearch : function(results) {
             var obj = {
                wins: 0,
                draws: 0,
                losses: 0
             }
             for(var m=0; m<results.length; m++) {
                 var r = results[m];
                 if(r.home == "Tranmere Rovers" && r.hgoal > r.vgoal) {
                     obj.wins = obj.wins + 1;
                 } else if(r.visitor == "Tranmere Rovers" && r.vgoal > r.hgoal) {
                     obj.wins = obj.wins + 1;
                 } else if(r.vgoal == r.hgoal) {
                     obj.draws = obj.draws +1;
                 } else {
                     obj.losses = obj.losses+1;
                 }
             }
             return obj;
         },

         calculateStats : function(apps, goals) {

            var seasons = [];
            var total = {
                apps: 0,
                starts: 0,
                subs: 0,
                goals: 0,
                assists: 0,
                headers: 0,
                fk: 0,
                penalties: 0,
                yellow: 0,
                red: 0,
            };
            currentObj = {Season:0};
            for(var i=0; i < apps.length; i++) {
                if(apps[i].Season > currentObj.Season) {
                    if(currentObj.Season > 0) {
                        currentObj = this.calculateGoalsforSeason(currentObj, goals);
                        seasons.push(currentObj);
                        total = this.incrementPlayerTotals(total, currentObj);
                    }
                    currentObj = {
                        Season: apps[i].Season,
                        apps: 1,
                        starts: apps[i].isSub ? 0 : 1,
                        subs: apps[i].isSub ? 1 : 0,
                        yellow: apps[i].yellow ? 1: 0,
                        red: apps[i].red ? 1: 0,
                        goals: 0,
                        assists: 0,
                        headers: 0,
                        fk: 0,
                        penalties: 0
                    };
                } else {
                    currentObj.apps = currentObj.apps + 1;
                    currentObj.starts = apps[i].isSub ? currentObj.starts : currentObj.starts +1;
                    currentObj.subs = apps[i].isSub ? currentObj.subs + 1 : currentObj.subs;
                    currentObj.yellow = apps[i].yellow ? currentObj.yellow + 1 : currentObj.yellow;
                    currentObj.red = apps[i].red ? currentObj.red + 1 : currentObj.red;
                }
            }
            if(currentObj.Season > 0) {
                currentObj = this.calculateGoalsforSeason(currentObj, goals);
                seasons.push(currentObj);
                total = this.incrementPlayerTotals(total, currentObj);
            }

            return {seasons:seasons, total: total};
         },

         incrementPlayerTotals: function (total, currentObj) {
             total.apps = total.apps + 1;
             total.starts = total.starts + currentObj.starts;
             total.subs = total.subs + currentObj.subs;
             total.yellow = total.yellow + currentObj.yellow;
             total.red = total.red + currentObj.red;
             total.goals = total.goals + currentObj.goals;
             total.assists = total.assists + currentObj.assists;
             total.fk = total.fk + currentObj.fk;
             total.headers = total.headers + currentObj.headers;
             total.penalties = total.penalties + currentObj.penalties;
             return total;
         },

         calculateGoalsforSeason : function(currentObj, goals) {
             for(var x=0; x < goals.length; x++) {
                 if(currentObj.Season == goals[x].Season) {
                     currentObj.goals = goals[x].isGoal ? currentObj.goals + 1 : currentObj.goals;
                     currentObj.assists = goals[x].isAssist ? currentObj.assists + 1 : currentObj.assists;
                     if(goals[x].isGoal) {
                         currentObj.headers = goals[x].isHeader ? currentObj.headers + 1 : currentObj.headers;
                         currentObj.fk = goals[x].isFreeKick ? currentObj.fk + 1 : currentObj.fk;
                         currentObj.penalties = goals[x].isPenalty ? currentObj.penalties + 1 : currentObj.penalties;
                     }
                 }
             }
             return currentObj;
         },

         formatGoals: function(goals) {
            var output = "";
            var scorers = {};
            for(var i=0; i < goals.length; i++) {
                if(scorers[goals[i].Scorer]) {
                   scorers[goals[i].Scorer] =  scorers[goals[i].Scorer] + 1;
                } else {
                   scorers[goals[i].Scorer] = 1;
                }
            }
            const keys = Object.keys(scorers);
            for( var x=0; x < keys.length; x++) {
                if(scorers[keys[x]] > 1) {
                    output = output + keys[x] + " " + scorers[keys[x]];
                } else {
                    output = output + keys[x]
                }
                if( x != keys.length-1) {
                    output = output + ", "
                }
            }
            return output;
         },

         buildMatch : async function(match) {
             match.Opposition = match.home == "Tranmere Rovers" ? match.visitor : match.home;
             var apps = await this.getAppsByDate(match.Date);
             match.apps = apps;
             if(match.venue == "Wembley Stadium") {
                 match.location = "N";
             } else if(match.home == "Tranmere Rovers") {
                 match.location = "H";
             } else {
                 match.location = "A";
             }

             if(match.Programme && match.Programme != "#N/A") {

                 var smallBody = {
                      "bucket": 'trfc-programmes',
                      "key": match.Programme,
                      "edits": {
                        "resize": {
                          "width": 100,
                          "fit": "contain"
                        }
                      }
                    };
                     var largeBody = {
                          "bucket": 'trfc-programmes',
                          "key": match.Programme,
                        };
                 delete match.Programme;
                 match.programme = Buffer.from(JSON.stringify(smallBody)).toString('base64');
                 match.largeProgramme = Buffer.from(JSON.stringify(largeBody)).toString('base64');
             }
             var goals = await this.getGoalsByDate(match.Date);
             match.goals = goals;
             match.formattedGoals = this.formatGoals(goals);
             if((match.apps && match.apps.length > 0)) {
                match.report = true;
             }
             if(match.competition != "League")
                match.isCup = true;
             return match;
         },

         //Todo
         findGoalsTotalBySeasonAndPlayer : async function(size) {
             var query = {
                index: "goals",
                body: {
                    "size": 0,
                    "aggs": {
                      "Scorer": {
                        "terms": {
                          "field": "Scorer",
                        "size": size
                        },
                        "aggs": {
                          "Season": {
                            "terms": {
                              "field": "Season"
                            }
                          }
                        }
                      }
                    }
                }
             }

             var results = await client.search(query);
             var seasons = [];
             return obj.sort

         },

         comparePlayerSeasons : function ( a, b ) {
              if ( a.last_nom < b.last_nom ){
                return -1;
              }
              if ( a.last_nom > b.last_nom ){
                return 1;
              }
              return 0;
         },

         findTranmereMatchesWithPenalties : async function(size) {
            var query = {
                index: "matches",
                body: {
                   "sort": ["Date"],
                   "size": size,
                   "query": {
                        "exists": {
                            "field": "pens"
                        }
                   }
                }
            };
            return this.findTranmereMatchesByQuery(query);
         },

         findTranmereMatchesWithStars : async function(size) {
            var query = {
                index: "stars",
                body: {
                   "sort": ["Date"],
                   "size": size,
                }
            };
            var results = await client.search(query);
            var matches = [];
            for(var i=0; i < results.body.hits.hits.length; i++) {
                var star = results.body.hits.hits[i]["_source"];
                var matchQuery = {
                    index: "matches",
                    body: {
                       "size": 1,
                       "query": {
                          "match": {
                            "Date": star.Date
                          }
                       }
                    }
                };
                var d = await this.findTranmereMatchesByQuery(matchQuery);
                var match = d[0];

                match.Player = star.Player;
                match.Notes = star.Notes;
                matches.push(match);
            }
            return matches;
         },

         findTranmereMatchesSortedByTopAttendanceAtHome : async function(size) {
            var query = {
                index: "matches",
                body: {
                   "sort": [{"attendance" : {"order" : "desc"}}],
                   "size": size,
                   "query": {
                    "match": {
                        "Venue": "Prenton Park"
                    }
                   }
                }
            };
            return this.findTranmereMatchesByQuery(query);
         },

         findTranmereMatchesSortedByTopAttendance : async function(size) {
            var query = {
                index: "matches",
                body: {
                   "sort": [{"attendance" : {"order" : "desc"}}],
                   "size": size,
                }
            };
            return this.findTranmereMatchesByQuery(query);
         },

         findTranmereMatchesByQuery: async function(query) {
             var results = await client.search(query);
             var matches = [];
             for(var i=0; i < results.body.hits.hits.length; i++) {
                 matches.push(await this.buildMatch(results.body.hits.hits[i]["_source"]));
             }
             return matches;
         },

         findAllTranmereMatchesByVenue : async function(venue, size) {
            var query = {
                index: "matches",
                body: {
                   "sort": ["Date"],
                   "size": size,
                   "query": {
                    "match": {
                     "Venue": venue
                    }
                   }
                }
              };
            return this.findTranmereMatchesByQuery(query);
         },

         findAllTranmereMatchesByCompetition : async function(competition, size) {
            var query = {
                index: "matches",
                body: {
                   "sort": ["Date"],
                   "size": size,
                   "query": {
                    "match": {
                     "competition": competition
                    }
                   }
                }
              };
            return this.findTranmereMatchesByQuery(query);
         },

         findAllTranmereMatchesByOpposition : async function(opposition, size) {
            var query = {
                index: "matches",
                body: {
                   "sort": ["Date"],
                   "size": size,
                   "query": {
                     "bool": {
                        "must": [
                          {
                            "match": {
                             "teams": opposition
                            }
                          },
                          {
                              "match": {
                                "teams": "Tranmere Rovers"
                              }
                          }
                        ]
                      }
                   }
                }
              };
            return this.findTranmereMatchesByQuery(query);
         },

         findAllTranmereMatchesBySeason : async function(season, size) {
            var query = {
                index: "matches",
                body: {
                   "sort": ["Date"],
                   "size": size,
                   "query": {
                     "bool": {
                        "must": [
                          {
                            "match": {
                             "Season" : season
                            }
                          },
                          {
                              "match": {
                                "teams": "Tranmere Rovers"
                              }
                          }
                        ]
                      }
                   }
                }
              };
            return this.findTranmereMatchesByQuery(query);
         },

         findAllTranmereMatchesWithinTimePeriod : async function(from, to, size) {
            var query = {
                index: "matches",
                body: {
                   "sort": ["Date"],
                   "size": size,
                   "query": {
                     "bool": {
                        "must": [
                          {
                             "range": {
                               "Date": {
                                 "gte": from,
                                 "lte": to
                               }
                             }
                          },
                          {
                              "match": {
                                "teams": "Tranmere Rovers"
                              }
                          }
                        ]
                      }
                   }
                }
              };
            return this.findTranmereMatchesByQuery(query);
         },

         getAppsByDate : async function(date) {
              var query = {
                index: "apps",
                body: {
                   "sort": ["Number"],
                   "size": 20,
                   "query": {
                     "bool": {
                        "must": [
                          {
                            "match": {
                             "Date" : date
                            }
                          }
                        ]
                      }
                   }
                }
              };

             var results = await client.search(query);
             var apps = [];
             for(var i=0; i < results.body.hits.hits.length; i++) {
                var app = results.body.hits.hits[i]["_source"];
                apps.push(app)
             }
             return apps;
         },

         getGoalsByDate : async function(date) {
               var query = {
                 index: "goals",
                 body: {
                    "size": 20,
                    "query": {
                      "bool": {
                         "must": [
                           {
                             "match": {
                              "Date" : date
                             }
                           }
                         ]
                       }
                    }
                 }
               };

              var results = await client.search(query);
              var goals = [];
              for(var i=0; i < results.body.hits.hits.length; i++) {
                 var goal = results.body.hits.hits[i]["_source"];
                 goals.push(goal)
              }
              return goals;
          },

         getTransfersByPlayer : async function(name, size) {
              var query = {
                index: "transfers",
                body: {
                   "size": size,
                   "sort": [{"Date" : {"order" : "asc"}}],
                   "query": {
                        "match": {
                         "Player" : name
                        }
                   }
                }
              };

             var results = await client.search(query);
             var transfers = [];
             for(var i=0; i < results.body.hits.hits.length; i++) {
               var transfer = results.body.hits.hits[i]["_source"];
               if(transfer.Direction == "In")
                transfer.incoming = true;
               if(transfer.Type == "Loan" || transfer.Type == "Youth" || transfer.Type == "FreeTransfer" || transfer.Type == "Retired" || transfer.Type == "Released")
                transfer.noFee = true;
               if(transfer.Type == "Loan" || transfer.Type == "Youth" || transfer.Type == "FreeTransfer" || transfer.Type == "Tribunal" || transfer.Type == "Retired" || transfer.Type == "Released")
                transfer.Other = true;
               if(transfer.Type == "Youth" )
                 transfer.Type = "Tranmere Youth Team"
               transfers.push(transfer)
             }
             return transfers;
         },

         getAllMediaByType : async function(type, size) {
              var query = {
                index: "media",
                body: {
                   "size": size,
                   "sort": ["Published", "Name"],
                   "query": {
                        "match": {
                         "Type" : type
                        }
                   }
                }
              };

             var results = await client.search(query);
             var media = [];
             for(var i=0; i < results.body.hits.hits.length; i++) {
               var item = {title: results.body.hits.hits[i]["_source"].Name};
               var image = {
                 "bucket": "trfc-programmes",
                 "key": results.body.hits.hits[i]["_source"].Image,
                 "edits": {
                   "resize": {
                     "height": 400,
                     "fit": "contain"
                   }
                 }
               };
               var link = {
                    "bucket": "trfc-programmes",
                    "key": results.body.hits.hits[i]["_source"].Image,
                    "edits": {
                     "resize": {
                       "height": 1200,
                       "fit": "contain"
                     }
                   }
               };
               item.image = "https://images.tranmere-web.com/" + Buffer.from(JSON.stringify(image)).toString('base64');
               item.link = "https://images.tranmere-web.com/" + Buffer.from(JSON.stringify(link)).toString('base64');
               media.push(item)
             }
             return media;
         },

         getLinksByPlayer : async function(name, size) {
              var query = {
                index: "links",
                body: {
                   "size": size,
                   "query": {
                     "bool": {
                        "must": [
                          {
                            "match": {
                             "Name" : name
                            }
                          }
                        ]
                      }
                   }
                }
              };

             var results = await client.search(query);
             var links = [];
             for(var i=0; i < results.body.hits.hits.length; i++) {
               var link = results.body.hits.hits[i]["_source"];
               links.push(link)
             }
             return links;
         },

         findAllPlayers : async function(size) {
            var playersQuery = {
                index: "players",
                body: {
                    "sort": ["Name"],
                    "size": size,
                }
            };
            var results = await client.search(playersQuery);
            var players = [];
            for(var i=0; i < results.body.hits.hits.length; i++) {
                var player = results.body.hits.hits[i]["_source"];
                player.Id = results.body.hits.hits[i]["_id"]
                player.goals = await this.findGoalsByPlayer(player.Name, 200);
                player.apps = await this.findAppsByPlayer(player.Name, 1000);
                player.links = await this.getLinksByPlayer(player.Name);
                player.stats = this.calculateStats(player.apps, player.goals);
                players.push(player)
            }
            return players;
         },

         findAllTranmereManagers : async function(size) {
            var managersQuery = {
                index: "managers",
                body: {
                    "sort": [{"DateJoined" : {"order" : "desc"}}],
                    "size": size,
                }
            };
            var results = await client.search(managersQuery);
            var managers = [];
            for(var i=0; i < results.body.hits.hits.length; i++) {
                var manager = results.body.hits.hits[i]["_source"];
                var dateLeft = "now";
                if(manager.DateLeft)
                    dateLeft = manager.DateLeft;
                manager.DateLeftText = dateLeft;
                manager.Id = results.body.hits.hits[i]["_id"]
                managers.push(manager)
            }
            return managers;
         },

         findGoalsByPlayer : async function(player, size, season) {
            var query = {
                index: "goals",
                body: {
                   "sort": ["Date"],
                   "size": size,
                   "query": {
                     "bool": {
                        "must": [
                          {
                              "match": {
                                "PlayersInvolved": player
                              }
                          }
                        ]
                      }
                   }
                }
              };
            if(season) {
                query.body.query.bool.must.push(
                    {
                        "match": {
                            "Season": season
                        }
                    }
                );
            }
            var goals = await client.search(query);
            var goalsList = [];
            for(var i=0; i < goals.body.hits.hits.length; i++){
                var goal = goals.body.hits.hits[i]["_source"];
                if(goal.Scorer == player) {
                    goal.isGoal = true;
                    if(goal.GoalType == "Header")
                        goal.isHeader = true;
                    else if(goal.GoalType == "Shot")
                        goal.isShot = true;
                    else if(goal.GoalType == "Penalty")
                        goal.isPenalty = true;
                    else if(goal.GoalType == "FreeKick")
                        goal.isFreeKick = true;
                    else
                        goal.isUnknown= true;
                } else {
                    goal.isAssist = true;
                    if(goal.AssistType == "Header")
                        goal.isHeader = true;
                    else if(goal.AssistType == "Cross")
                        goal.isCross = true;
                    else if(goal.AssistType == "Pass")
                        goal.isPass = true;
                    else if(goal.AssistType == "FreeKick")
                        goal.isFreeKick = true;
                    else if(goal.AssistType == "Corner")
                        goal.isCorner = true;
                    else
                        goal.isUnknown= true;
                }
                goalsList.push(goal);
            }

            return Promise.resolve(goalsList);
         },

         findAppsByPlayer : async function(player, size, season) {
            var query = {
                index: "apps",
                body: {
                   "sort": ["Date"],
                   "size": size,
                   "query": {
                     "bool": {
                        "must": [
                          {
                              "match": {
                                "PlayersInvolved": player
                              }
                          }
                        ]
                      }
                   }
                }
              };

            if(season) {
                query.body.query.bool.must.push(
                    {
                        "match": {
                            "Season": season
                        }
                    }
                );
            }

            var apps = await client.search(query);
            var appsList = [];
            for(var i=0; i < apps.body.hits.hits.length; i++){
                var app = apps.body.hits.hits[i]["_source"];
                if(app.SubbedBy == player) {
                    app.isSub = true;
                    app.replaced = app.Name;
                    app.yellow = app.SubYellow;
                    app.red = app.SubRed;
                } else if(app.SubSubbedBy == player) {
                    app.isSub = true;
                    app.replaced = app.SubbedBy;
                    app.yellow = app.SubYellow;
                    app.red = app.SubRed;
                } else {
                    app.replaced = app.SubbedBy;
                    app.yellow = app.YellowCard;
                    app.red = app.RedCard;
                }
                appsList.push(app);
            }

            return Promise.resolve(appsList);
         },

         getTopPlayerByAppearances : async function(size) {
            var query = {
                index: "apps",
                body: {
                      "size": 0,
                      "aggs": {
                        "apps": {
                          "terms": {
                            "size" : size,
                            "field": "Name"
                          }
                        }
                      }
                  }
            };

            var result = await client.search(query);
            var results = [];
            for(var i=0; i < result.body.aggregations.apps.buckets.length; i++) {
                var player = result.body.aggregations.apps.buckets[i].key;

                var playerBio = await this.getPlayerByName(player);

                results.push({"Name": player, "Bio": playerBio, "Starts": result.body.aggregations.apps.buckets[i].doc_count})
            }
            return results;
        },

         getPlayerByName : async function(name) {
              var query = {
                index: "players",
                body: {
                   "size": 1,
                   "query": {
                        "match": {
                         "Name" : name
                        }
                   }
                }
              };

             var results = await client.search(query);
             if(results.body.hits && results.body.hits.hits && results.body.hits.hits[0]) {
                return results.body.hits.hits[0]["_source"];
             } else {
                return null;
             }
         },

         getTopPlayerByGoals : async function(size) {
            var query = {
                index: "goals",
                body: {
                      "size": 0,
                      "aggs": {
                        "Scorer": {
                          "terms": {
                            "size" : size,
                            "field": "Scorer"
                          }
                        }
                      }
                  }
            };

            var result = await client.search(query);
            var results = [];
            for(var i=0; i < result.body.aggregations.Scorer.buckets.length; i++) {
                var player = result.body.aggregations.Scorer.buckets[i].key;
                var playerBio = await this.getPlayerByName(player);
                results.push({"Name": player, "Bio": playerBio, "Goals": result.body.aggregations.Scorer.buckets[i].doc_count})
            }
            return results;
        },

         getAllCupCompetitions : async function(size) {
            var competitionQuery = {
                index: "matches",
                body: {
                    "size": 0,
                    "aggs": {
                      "competition": {
                        "terms": {
                          "size" : size,
                          "field": "competition"
                        }
                      }
                    }
                }
            };

            var result = await client.search(competitionQuery);
            var results = [];
            for(var i=0; i < result.body.aggregations.competition.buckets.length; i++) {
                if(result.body.aggregations.competition.buckets[i].key != "League"
                    && result.body.aggregations.competition.buckets[i].key != "Conference") {
                    results.push({"Name": result.body.aggregations.competition.buckets[i].key, "Count": result.body.aggregations.competition.buckets[i].doc_count})
                }
            }
            return results;
        },

         getTopScorersBySeason : async function(size) {
            var query = {
                index: "goals",
                body: {
                        "size": 0,
                        "aggs": {
                          "season": {
                            "terms": {
                              "size": size,
                              "field": "Season",
                              "order": {
                                "_key": "asc"
                              }
                            },
                            "aggs": {
                              "scorers": {
                                "terms": {
                                  "field": "Scorer",
                                  "size": 1
                                }
                              }
                            }
                          }
                        }
                      }
            };

            var result = await client.search(query);
            var results = [];
            for(var i=0; i < result.body.aggregations.season.buckets.length; i++) {
                var record = {
                    Name: result.body.aggregations.season.buckets[i].scorers.buckets[0].key,
                    Season: result.body.aggregations.season.buckets[i].key,
                    Goals: result.body.aggregations.season.buckets[i].scorers.buckets[0]['doc_count']
                }
                results.push(record);
            }
            return results;
        },

         findAllTeams : async function(size) {
            var teamQuery = {
                index: "matches",
                body: {
                    "size": 0,
                    "query": {
                      "match": {
                        "teams": "Tranmere Rovers"
                      }
                    },
                    "aggs": {
                      "teams": {
                        "terms": {
                          "size" : size,
                          "field": "teams"
                        }
                      }
                    }
                }
            };

            var result = await client.search(teamQuery);
            var results = [];
            var resultsByLetter = {};
            for(var i=0; i < result.body.aggregations.teams.buckets.length; i++) {
                if(result.body.aggregations.teams.buckets[i].key != "Tranmere Rovers") {

                    var firstLetter = result.body.aggregations.teams.buckets[i].key.substring(0,1);
                    if(resultsByLetter[firstLetter]) {
                        resultsByLetter[firstLetter].push(result.body.aggregations.teams.buckets[i].key)
                    } else {
                        var obj = [result.body.aggregations.teams.buckets[i].key];
                        resultsByLetter[firstLetter] = obj;
                    }
                    results.push(result.body.aggregations.teams.buckets[i])
                }
            }
            var list = [];
            var keys = Object.keys(resultsByLetter);
            for(var i=0; i < keys.length; i++) {
                list.push({key: keys[i], teams: resultsByLetter[keys[i]]});
            }
            results.sort(function(a, b) {
              if (a.key < b.key) return -1;
              if (a.key > b.key) return 1;
              return 0;
            });
            list.sort(function(a, b) {
              if (a.key < b.key) return -1;
              if (a.key > b.key) return 1;
              return 0;
            });
            return {results:results, resultsByLetter:list};
         },

         findAllPlayersByLetterAndDates : async function(size, from, to) {
            var query = {
                index: "apps",
                body: {
                    "size": 0,
                    "query": {
                     "range": {
                       "Date": {
                         "gte": from,
                         "lte": to
                       }
                     }
                    },
                    "aggs": {
                      "players": {
                        "terms": {
                          "size" : size,
                          "field": "Name"
                        }
                      }
                    }
                }
            };

            var result = await client.search(query);
            var results = [];
            var resultsByLetter = {};
            for(var i=0; i < result.body.aggregations.players.buckets.length; i++) {
                var firstLetter = result.body.aggregations.players.buckets[i].key.substring(0,1);
                if(resultsByLetter[firstLetter]) {
                    resultsByLetter[firstLetter].push(result.body.aggregations.players.buckets[i].key)
                } else {
                    var obj = [result.body.aggregations.players.buckets[i].key];
                    resultsByLetter[firstLetter] = obj;
                }
                results.push(result.body.aggregations.players.buckets[i])
            }
            var list = [];
            var keys = Object.keys(resultsByLetter);
            for(var i=0; i < keys.length; i++) {
                list.push({key: keys[i], players: resultsByLetter[keys[i]]});
            }
            results.sort(function(a, b) {
              if (a.key < b.key) return -1;
              if (a.key > b.key) return 1;
              return 0;
            });
            list.sort(function(a, b) {
              if (a.key < b.key) return -1;
              if (a.key > b.key) return 1;
              return 0;
            });
            return {results:results, resultsByLetter:list};
         }
    };
};