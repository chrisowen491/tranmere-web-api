module.exports = function (client) {
    return {

         getTopPlayerBySubs : async function(size, season) {
            var query = {
                index: "apps",
                body: {
                      "size": 0,
                      "aggs": {
                        "apps": {
                          "terms": {
                            "size" : size,
                            "field": "SubbedBy"
                          }
                        }
                      }
                  }
            };

            if(season) {
                query.body.query = {
                  "bool": {
                     "must": [{"match": {"Season": season}}]
                  }
               }
            }

            var result = await client.search(query);
            var results = [];
            for(var i=0; i < result.body.aggregations.apps.buckets.length; i++) {
                var player = result.body.aggregations.apps.buckets[i].key;
                var subs = result.body.aggregations.apps.buckets[i].doc_count;
                results.push({"Name": player, "Subs": subs})
            }
            return results;
        },

         getTopPlayerByAppearances : async function(size, season) {
            var query = {
                index: "apps",
                body: {
                      "size": 0,
                      "aggs": {
                        "apps": {
                          "terms": {
                            "size" : size,
                            "field": "PlayersInvolved"
                          }
                        }
                      }
                  }
            };

            if(season) {
                query.body.query = {
                  "bool": {
                     "must": [{"match": {"Season": season}}]
                  }
               }
            }

            var result = await client.search(query);
            var results = [];
            for(var i=0; i < result.body.aggregations.apps.buckets.length; i++) {
                var player = result.body.aggregations.apps.buckets[i].key;
                var apps = result.body.aggregations.apps.buckets[i].doc_count;
                results.push({"Name": player, "Apps": apps})
            }
            return results;
        },

         getTopPlayerByStarts : async function(size, season) {
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

            if(season) {
                query.body.query = {
                  "bool": {
                     "must": [{"match": {"Season": season}}]
                  }
               }
            }

            var result = await client.search(query);
            var results = [];
            for(var i=0; i < result.body.aggregations.apps.buckets.length; i++) {
                var player = result.body.aggregations.apps.buckets[i].key;
                var starts = result.body.aggregations.apps.buckets[i].doc_count;
                results.push({"Name": player, "Starts": starts})
            }
            return results;
        },

         getTopPlayerByGoals : async function(size, season) {
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

            if(season) {
                query.body.query = {
                  "bool": {
                     "must": [{"match": {"Season": season}}]
                  }
               }
            }

            var result = await client.search(query);
            var results = [];
            for(var i=0; i < result.body.aggregations.Scorer.buckets.length; i++) {
                var player = result.body.aggregations.Scorer.buckets[i].key;
                var goals = result.body.aggregations.Scorer.buckets[i].doc_count;
                results.push({"Name": player, "Goals": goals});
            }
            return results;
        }
    };
};