const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.updateBTTTeamNamesInStructureNode = functions.database.ref('/btt-structure/{year}/{gameId}/{team}/id').onUpdate((change, context) => {
  const oldTeamId = change.before.val();
  const newTeamId = change.after.val();

  const year = context.params.year;
  const gameId = context.params.gameId;
  const team = context.params.team;

  const teamInfoRef = admin.database().ref('/cbb-mens-team-info/' + newTeamId);
  const bttGameRef = admin.database().ref('/btt-structure/' + year + '/' + gameId + '/' + team);

  if (newTeamId === 0 || newTeamId === '0') {
    // resets team name to an empty string
    const newNameUpdate = {"name": ""};
    return bttGameRef.update(newNameUpdate);
  } else {
    return teamInfoRef.once('value').then(snapshot => {
      const newName = snapshot.val().name;
      const newNameUpdate = {"name": newName};
  
      return bttGameRef.update(newNameUpdate);
    });
  }
  
});

exports.updateBTTSeedsInStructureNode = functions.database.ref('/btt-seeds/{year}/{seedId}').onUpdate((change, context) => {
  const oldTeamId = change.before.val();
  const newTeamId = change.after.val();

  const year = context.params.year;
  const seedId = context.params.seedId;
  const seedValue = Number(seedId.match(/[0-9]+/g)[0]);
  const btt_structureRef = admin.database().ref('/btt-structure/' + year);

  return btt_structureRef.once('value').then(snapshot => {
    const seedUpdate = {"id": newTeamId, "seed-value": seedValue};
    snapshot.forEach(child => {
      
      if (child.val().team1.seed === seedId) {
        const childRef = admin.database().ref('/btt-structure/' + year + '/' + child.key + '/team1');
        childRef.update(seedUpdate);
      }

      if (child.val().team2.seed === seedId) {
        const childRef = admin.database().ref('/btt-structure/' + year + '/' + child.key + '/team2');
        childRef.update(seedUpdate);
      }
    });
    return;
  });
});

exports.updateBTTSeedsInLeaguesNode = functions.database.ref('/btt-seeds/{year}/{seedId}').onUpdate((change, context) => {
  const oldTeamId = change.before.val();
  const newTeamId = change.after.val();

  const year = context.params.year;
  const seedId = context.params.seedId;
  const seedValue = Number(seedId.match(/[0-9]+/g)[0]);
  
  const bttLeagues = admin.database().ref('/leagues-btt/' + year).once('value');

  return bttLeagues.then(bttLeaguesSnapshot => {
    bttLeaguesSnapshot.forEach(child => {
      var leagueId = child.key;
      var isActive = child.val();

      console.log(leagueId);
      console.log(isActive);

      if (isActive) {
        let seedValueUpdate;
        if (newTeamId === 0) {
          seedValueUpdate = {'seed-value': 0}
        } else {
          seedValueUpdate = {'seed-value': seedValue};
        }

        admin.database().ref('leagues/' + leagueId + '/teams/' + newTeamId).update(seedValueUpdate);
      }
    });
    return;
  });
});

exports.setTeamNamesForNewLeague = functions.database.ref('/leagues/{pushId}').onCreate((snapshot, context) => {
  const pushId = context.params.pushId;
  const sport = snapshot.child('sport').val();
  const tournamentId = sport.match(/[a-z]{2,}/g)[0];
  const infoNode = snapshot.child('info-node').val();
  const teams = snapshot.child('teams');

  if (tournamentId === 'mm') {
    // populate the teams node from scratch
    let year = sport.match(/[0-9]{4,}/g)[0];
    let teamsObj = {};
    let teamGroupsObj = {};

    const regionsSnapshot = admin.database().ref('/' + tournamentId + '-regions/' + year).once('value');
    const seedsSnapshot = admin.database().ref('/' + tournamentId + '-seeds/' + year).once('value');
    const teamsSnapshot = admin.database().ref('/' + tournamentId + '-teams/' + year).once('value');
    const infoNodeSnapshot = admin.database().ref('/' + infoNode + '-team-info').once('value');

    return Promise.all([regionsSnapshot, seedsSnapshot, teamsSnapshot, infoNodeSnapshot]).then(data => {
      let regions = data[0].val();
      let infoNode = data[3].val();
      var regionCode;
      var regionString;
      var playInFlag = false;
      var seedValue;
      data[1].forEach(seed => {
        playInFlag = false;
        if (seed.key.match(/[a-z]/g) !== null) {
          playInFlag = true;
        }
        seedValue = seed.key.match(/[0-9]+/g) === null ? 0 : seed.key.match(/[0-9]+/g)[0];
        regionCode = seed.key.match(/[A-Z]/g) === null ? 'n-a' : seed.key.match(/[A-Z]/g);
        if (regionCode === 'n-a') {
          regionString = 'n-a';
        } else {
          regionString = regions[regionCode];
        }

        var teamId = seed.val();
        var name;
        if (infoNode[teamId] !== undefined) {
          name = infoNode[teamId]['name'];
        } else {
          name = teamId;
        }
        var groupCode;
        var teamObj = {};

        // group lower seeds
        if (seedValue >= 14) {
          // check if this region already has a group in the teamGroupsObj
          groupCode = regionCode + '-14-16';
          if (teamGroupsObj[groupCode] !== undefined) {
            teamObj = {
              'name': name,
              'return': 0,
              'seed-value': Number(seedValue)
            };
            teamGroupsObj[groupCode]['teams'][teamId] = teamObj;
          } else {
            // create region group
            teamGroupsObj[groupCode] = {
              'name': regionString + ' (14-16)',
              'price': 0,
              'return': 0,
              'owner': '',
              'teams': {
                [teamId]: {
                  'name': name,
                  'return': 0,
                  'seed-value': Number(seedValue)
                }
              }
            };
          }
        } else if (playInFlag) {
          // check if this play-in game already has a group
          groupCode = regionCode + seedValue;
          if (teamGroupsObj[groupCode] !== undefined) {
            teamObj = {
              'name': name,
              'return': 0,
              'seed-value': Number(seedValue)
            };
            teamGroupsObj[groupCode]['name'] = teamGroupsObj[groupCode]['name'] + '/' + name;
            teamGroupsObj[groupCode]['teams'][teamId] = teamObj;
          } else {
            // create play-in group
            teamGroupsObj[groupCode] = {
              'name': '(' + Number(seedValue) + ') ' + name,
              'return': 0,
              'price': 0,
              'owner': '',
              'teams': {
                [teamId]: {
                  'name': name,
                  'return': 0,
                  'seed-value': Number(seedValue)
                }
              }
            };
          }
        } else {
          // populate regular teams
          teamsObj[teamId] = {
            'name': name,
            'owner': '',
            'price': 0,
            'return': 0,
            'seed-value': Number(seedValue)
          };
        }
      });
      let teamUpdates = {};
      teamUpdates['/leagues/' + pushId + '/teams'] = teamsObj;
      teamUpdates['/leagues/' + pushId + '/teamGroups'] = teamGroupsObj;

      return admin.database().ref('/').update(teamUpdates);
    });
  } else if (sport !== 'custom') {
    // TODO: refactor to update the entire teams node at once to avoid the nested promise
    let year = sport.match(/[0-9]{4,}/g)[0];
    return admin.database().ref('/' + tournamentId + '-seeds/' + year).once('value').then(seedsSnapshot => {
      return seedsSnapshot.val();
    }).then((seeds) => {
      console.log('seeds: ');
      console.log(seeds);
      teams.forEach(child => {
        const teamId = child.key;

        let teamNameUpdate = {};

        for (var seedId in seeds) {
          if (seeds[seedId] === teamId) {
            seedValue = Number(seedId.match(/[0-9]+/g)[0]);
            teamNameUpdate['seed-value'] = seedValue;
          }
        }
    
        const infoNodeTeam = admin.database().ref('/' + infoNode + '-team-info/' + teamId + '/name').once('value');
  
        return admin.database().ref('/' + infoNode + '-team-info/' + teamId + '/name').once('value').then(teamName => {
          teamNameUpdate['name'] = teamName.val();
          const newLeagueTeamPath = admin.database().ref('/leagues/' + pushId + '/teams/' + teamId);
    
          return newLeagueTeamPath.update(teamNameUpdate);
        });
      });
      return;
    });
  }
});

exports.updateBTTBracketAfterFinalScoreChange = functions.database.ref('/btt-structure/{year}/{gameId}/score').onUpdate((change, context) => {
  const year = context.params.year;
  const gameId = context.params.gameId;

  const team1Score = Number(change.after.child('team1').val());
  const team2Score = Number(change.after.child('team2').val());

  let gamesObj;
  let gameObj;
  let nextGameId;
  let winner;

  return admin.database().ref('/btt-structure/' + year).once('value').then(games => {
    gamesObj = games.val();
    gameObj = games.child(gameId).val();
    dayNum = games.child(gameId).child('day').val();

    let team1Id = gameObj['team1']['id'];
    let team2Id = gameObj['team2']['id'];

    nextGameId = gameObj['next-round'];

    const updateRef = admin.database().ref('/btt-structure/' + year + '/' + gameId);

    if (team1Score > team2Score) {
      winner = team1Id;
      winnerUpdate = {'winner': winner};
      return updateRef.update(winnerUpdate);
    } else if (team2Score > team1Score) {
      winner = team2Id;
      winnerUpdate = {'winner': winner};
      return updateRef.update(winnerUpdate);
    } else {
      return null
    }
  }).then(() => {
    let winnerSeedVal;
    if (winner === gamesObj[gameId]['team1']['id']) {
      winnerSeedVal = gamesObj[gameId]['team1']['seed-value'];
    } else if (winner === gamesObj[gameId]['team2']['id']) {
      winnerSeedVal = gamesObj[gameId]['team2']['seed-value'];
    }

    if (nextGameId !== 'n/a') {
      if (gamesObj[nextGameId]['team1']['id'] === 0) {
        var team1Update = {"id": winner, "seed-value": winnerSeedVal};
        const team1UpdateRef = admin.database().ref('/btt-structure/' + year + '/' + nextGameId + '/team1');
        return team1UpdateRef.update(team1Update);
      } else if (gamesObj[nextGameId]['team2']['id'] === 0) {
        var team2Update = {"id": winner, "seed-value": winnerSeedVal};
        const team2UpdateRef = admin.database().ref('/btt-structure/' + year + '/' + nextGameId + '/team2');
        return team2UpdateRef.update(team2Update);
      } else {
        return null;
      }
    } else {
      return null;
    }
  });
});

exports.updateBTTLeagueWinnersNodesAfterScoreUpdate = functions.database.ref('/btt-structure/{year}/{gameId}/winner').onUpdate((change, context) => {
  const year = context.params.year;
  const gameId = context.params.gameId;
  const winnerId = change.after.val();

  const allLeaguesRef = admin.database().ref('/leagues/');

  const currentBracket = admin.database().ref('/btt-structure/' + year).once('value');
  const bttLeagues = admin.database().ref('/leagues-btt/' + year).once('value');

  if (winnerId !== 'n/a') {
    return Promise.all([currentBracket, bttLeagues]).then(data => {
      let winners = {'tournament-code': 'btt'};

      // TODO: Add ability to determine biggest loss and largest upset
      var biggestLossGameId = [];
      var biggestLossTeamId = [];
      var pointDifferential = 0;
      var prevPointDifferential = 0;

      var biggestUpsetGameId = [];
      var biggestUpsetTeamId = [];
      var upsetDifferential = 0;
      var prevUpsetDifferential = 0;

      data[0].forEach(game => {
        let gameObj = game.val();

        let team1Score = Number(gameObj['score']['team1']);
        let team2Score = Number(gameObj['score']['team2']);

        let team1SeedVal = Number(gameObj['team1']['seed-value']);
        let team2SeedVal = Number(gameObj['team2']['seed-value']);

        let team1Id = gameObj['team1']['id'];
        let team2Id = gameObj['team2']['id'];

        if (gameObj['winner'] !== 'n/a') {
          winners[game.key] = gameObj['winner'];

          // find the game with the largest point differential
          pointDifferential = Math.abs(team1Score - team2Score);
          if (pointDifferential > prevPointDifferential) {
            biggestLossGameId = [game.key];
            if (team1Score < team2Score) {
              biggestLossTeamId = [gameObj['team1']['id']];
            } else {
              biggestLossTeamId = [gameObj['team2']['id']];
            }
            prevPointDifferential = pointDifferential;
          } else if (pointDifferential === prevPointDifferential) {
            biggestLossGameId.push(game.key);
            if (team1Score < team2Score) {
              biggestLossTeamId.push(gameObj['team1']['id']);
            } else {
              biggestLossTeamId.push(gameObj['team2']['id']);
            }
          }

          var winnerKey;
          // find the game with the biggest upset
          if (gameObj['winner'] === team1Id) {
            winnerKey = 'team1';
            // check if game was an upset
            if (team1SeedVal - team2SeedVal > 0) {
              upsetDifferential = team1SeedVal - team2SeedVal;
            } else {
              upsetDifferential = -1;
            }
          } else if (gameObj['winner'] === team2Id) {
            winnerKey = 'team2';
            // check if game was an upset
            if (team2SeedVal - team1SeedVal > 0) {
              upsetDifferential = team2SeedVal - team1SeedVal;
            } else {
              upsetDifferential = -1;
            }
          }

          if (upsetDifferential > prevUpsetDifferential && upsetDifferential > 0) {
            prevUpsetDifferential = upsetDifferential;
            biggestUpsetGameId = [game.key];
            biggestUpsetTeamId = [gameObj['winner']];
          } else if (upsetDifferential === prevUpsetDifferential && upsetDifferential > 0) {
            biggestUpsetGameId.push(game.key);
            biggestUpsetTeamId.push(gameObj['winner']);
          }
        }
      });

      winners['loss'] = biggestLossTeamId;
      winners['upset'] = biggestUpsetTeamId;

      data[1].forEach(league => {
        let leagueId = league.key;
        let leagueStatus = league.val();

        if (leagueStatus) {
          admin.database().ref('/leagues/' + leagueId + '/game-winners').set(winners);
        }
      });

      return;
    });
  }
});

exports.updateBTTLeaguePayoutValues = functions.database.ref('/leagues/{leagueId}/game-winners').onUpdate((change, context) => {
  const leagueId = context.params.leagueId;
  const winners = change.after.val();

  if (winners['tournament-code'] === 'btt') {
    const payoutSettings = admin.database().ref('/leagues/' + leagueId + '/payout-settings').once('value');
    const poolTotal = admin.database().ref('/leagues/' + leagueId + '/pool-total').once('value');
    const teamsNode = admin.database().ref('/leagues/' + leagueId + '/teams').once('value');

    return Promise.all([payoutSettings, poolTotal, teamsNode]).then(data => {
      let payouts = data[0].val();
      let total = data[1].val();
      let teams = data[2].val();
      let teamPayouts = {};

      var biggestUpsetCount = 0;
      var biggestLossCount = 0;

      var ind;
      for (ind in winners['loss']) {
        biggestLossCount++;
      }
      
      for (ind in winners['upset']) {
        biggestUpsetCount++;
      }

      for (var gameId in winners) {
        let roundCode = gameId.match(/R[0-9]+/g) !== null ? gameId.match(/R[0-9]+/g)[0] : 'n/a';

        let payoutRate;
        if (gameId === 'loss') {
          payoutRate = Number(payouts['loss']);
        } else if (gameId === 'upset') {
          payoutRate = Number(payouts['upset']) / biggestUpsetCount;
        } else if (roundCode !== 'n/a') {
          payoutRate = Number(payouts[roundCode]) / biggestLossCount;
        } else {
          payoutRate = 0;
        }

        let returnValue = total * payoutRate;

        if (returnValue > 0) {
          if (!teamPayouts[winners[gameId]]) {
            teamPayouts[winners[gameId]] = returnValue;
          } else {
            teamPayouts[winners[gameId]] = teamPayouts[winners[gameId]] + returnValue;
          }
        }
      }

      for (var teamId in teams) {
        if (teamPayouts[teamId]) {
          teams[teamId]['return'] = teamPayouts[teamId];
        } else {
          teams[teamId]['return'] = 0;
        }
      }

      return admin.database().ref('/leagues/' + leagueId + '/teams').update(teams);
    });
  }
  

});

exports.updateBiddingTotalsOnAuctionItemSold = functions.database.ref('/leagues/{leagueId}/teams/{teamId}/owner').onUpdate((change, context) => {
  const leagueId = context.params.leagueId;
  const teamId = context.params.teamId;
  const newOwnerId = change.after.val();

  const teams = admin.database().ref('/leagues/' + leagueId + '/teams').once('value');
  const teamGroups = admin.database().ref('/leagues/' + leagueId + '/teamGroups').once('value');
  const settings = admin.database().ref('/leagues/' + leagueId + '/settings').once('value');

  return Promise.all([teams, teamGroups, settings]).then(data => {
    let teams = data[0].val();
    let teamGroups = data[1].val();
    let settings = data[2].val();

    var useTax = false;

    if (settings['use-tax'] > 0) {
      var noTaxLimit = settings['use-tax'];
      var taxRate = settings['tax-rate'];
      useTax = true;
    }

    let updateObj = {
      'pool-total': 0,
      'prize-pool': {
        'total': 0,
        'bids': {},
        'use-tax': {}
      }
    };

    var grandTotal = 0;

    var teamId;
    var uid;
    var price;

    // calculates each user's total bid amount
    for (teamId in teams) {
      uid = teams[teamId]['owner'];
      price = Number(teams[teamId]['price']);

      grandTotal += price;

      if (uid !== '') {
        if (!updateObj['prize-pool']['bids'][uid]) {
          updateObj['prize-pool']['bids'][uid] = price;
        } else {
          updateObj['prize-pool']['bids'][uid] += price;
        }
      }
    }

    // calculates each user's total bid amount from the teamGroups node
    for (teamId in teamGroups) {
      uid = teamGroups[teamId]['owner'];
      price = Number(teamGroups[teamId]['price']);

      grandTotal += price;

      if (uid !== '') {
        if (!updateObj['prize-pool']['bids'][uid]) {
          updateObj['prize-pool']['bids'][uid] = price;
        } else {
          updateObj['prize-pool']['bids'][uid] += price;
        }
      }
    }

    // calculates the amount of use tax each user owes
    if (useTax) {
      var bidTotal;
      var useTaxOwed;
      for (uid in updateObj['prize-pool']['bids']) {
        bidTotal = updateObj['prize-pool']['bids'][uid];
        if (bidTotal > noTaxLimit) {
          useTaxOwed = (bidTotal - noTaxLimit) * taxRate;
          updateObj['prize-pool']['use-tax'][uid] = useTaxOwed;

          grandTotal += useTaxOwed;
        }
      }
    }

    updateObj['pool-total'] = grandTotal;
    updateObj['prize-pool']['total'] = grandTotal;
    
    return admin.database().ref('/leagues/' + leagueId).update(updateObj);
  });
});

exports.updateBiddingTotalsOnAuctionGroupItemSold = functions.database.ref('/leagues/{leagueId}/teamGroups/{teamId}/owner').onUpdate((change, context) => {
  const leagueId = context.params.leagueId;
  const teamId = context.params.teamId;
  const newOwnerId = change.after.val();

  const teams = admin.database().ref('/leagues/' + leagueId + '/teams').once('value');
  const teamGroups = admin.database().ref('/leagues/' + leagueId + '/teamGroups').once('value');
  const settings = admin.database().ref('/leagues/' + leagueId + '/settings').once('value');

  return Promise.all([teams, teamGroups, settings]).then(data => {
    let teams = data[0].val();
    let teamGroups = data[1].val();
    let settings = data[2].val();

    var useTax = false;

    if (settings['use-tax'] > 0) {
      var noTaxLimit = settings['use-tax'];
      var taxRate = settings['tax-rate'];
      useTax = true;
    }

    let updateObj = {
      'pool-total': 0,
      'prize-pool': {
        'total': 0,
        'bids': {},
        'use-tax': {}
      }
    };

    var grandTotal = 0;

    var teamId;
    var uid;
    var price;

    // calculates each user's total bid amount from the teams node
    for (teamId in teams) {
      uid = teams[teamId]['owner'];
      price = Number(teams[teamId]['price']);

      grandTotal += price;

      if (uid !== '') {
        if (!updateObj['prize-pool']['bids'][uid]) {
          updateObj['prize-pool']['bids'][uid] = price;
        } else {
          updateObj['prize-pool']['bids'][uid] += price;
        }
      }
    }

    // calculates each user's total bid amount from the teamGroups node
    for (teamId in teamGroups) {
      uid = teamGroups[teamId]['owner'];
      price = Number(teamGroups[teamId]['price']);

      grandTotal += price;

      if (uid !== '') {
        if (!updateObj['prize-pool']['bids'][uid]) {
          updateObj['prize-pool']['bids'][uid] = price;
        } else {
          updateObj['prize-pool']['bids'][uid] += price;
        }
      }
    }

    // calculates the amount of use tax each user owes
    if (useTax) {
      var bidTotal;
      var useTaxOwed;
      for (uid in updateObj['prize-pool']['bids']) {
        bidTotal = updateObj['prize-pool']['bids'][uid];
        if (bidTotal > noTaxLimit) {
          useTaxOwed = (bidTotal - noTaxLimit) * taxRate;
          updateObj['prize-pool']['use-tax'][uid] = useTaxOwed;

          grandTotal += useTaxOwed;
        }
      }
    }

    updateObj['pool-total'] = grandTotal;
    updateObj['prize-pool']['total'] = grandTotal;
    
    return admin.database().ref('/leagues/' + leagueId).update(updateObj);
  });
});