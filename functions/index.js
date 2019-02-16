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
        return childRef.update(seedUpdate);
      }

      if (child.val().team2.seed === seedId) {
        const childRef = admin.database().ref('/btt-structure/' + year + '/' + child.key + '/team2');
        return childRef.update(seedUpdate);
      }
      return null;
    });
    return null;
  });
});

exports.setTeamNamesForNewLeague = functions.database.ref('/leagues/{pushId}').onCreate((snapshot, context) => {
  const pushId = context.params.pushId;
  const sport = snapshot.child('sport').val();
  const infoNode = snapshot.child('info-node').val();
  const teams = snapshot.child('teams');

  teams.forEach(child => {
    const teamId = child.key;

    return admin.database().ref('/' + infoNode + '-team-info/' + teamId + '/name').once('value').then(teamName => {
      var teamNameUpdate = {'name': teamName.val()};

      const newLeagueTeamPath = admin.database().ref('/leagues/' + pushId + '/teams/' + teamId);

      return newLeagueTeamPath.update(teamNameUpdate);
    });
  });
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
    let team1SeedVal = gameObj['team1']['seed-value'];
    let team2SeedVal = gameObj['team2']['seed-value'];

    if (gamesObj[nextGameId]['team1']['id'] === 0) {
      var team1Update = {"id": winner, "seed-value": team1SeedVal};
      const team1UpdateRef = admin.database().ref('/btt-structure/' + year + '/' + nextGameId + '/team1');
      return team1UpdateRef.update(team1Update);
    } else if (gamesObj[nextGameId]['team2']['id'] === 0) {
      var team2Update = {"id": winner, "seed-value": team2SeedVal};
      const team2UpdateRef = admin.database().ref('/btt-structure/' + year + '/' + nextGameId + '/team2');
      return team2UpdateRef.update(team2Update);
    } else {
      return null;
    }
  });
});

exports.updateBTTLeagueTeamsNodesAfterScoreUpdate = functions.database.ref('/btt-structure/{year}/{gameId}/winner').onUpdate((change, context) => {
  const year = context.params.year;
  const gameId = context.params.gameId;
  const winnerId = change.after.val();

  let dayNum = Number(gameId.match(/[0-9]+/g)[0]);
  console.log('dayNum: ' + dayNum);

  const allLeaguesRef = admin.database().ref('/leagues/');

  const currentBracket = admin.database().ref('/btt-structure/' + year).once('value');
  const bttLeagues = admin.database().ref('/leagues-btt/' + year).once('value');

  if (winnerId !== 'n/a') {
    return Promise.all([currentBracket, bttLeagues]).then(data => {
      let winners = {'tournament-code': 'btt'};

      console.log('btt-leagues:');
      console.log(data[1].val());

      // TODO: Add ability to determine biggest loss and largest upset
      var biggestLossGameId = [];
      var biggestLossTeamId = [];
      var pointDifferential = 0;
      var prevPointDifferential = 0;

      var biggestUpsetGameId = [];
      var biggestUpsetTeamId = [];
      var seedDifferential = 0;
      var prevSeedDifferential = 0;
      data[0].forEach(game => {
        let gameObj = game.val();

        let team1Score = Number(gameObj['score']['team1']);
        let team2Score = Number(gameObj['score']['team2']);

        if (gameObj['winner'] !== 'n/a') {
          winners[game.key] = gameObj['winner'];

          // find the game with the largest point differential
          pointDifferential = Math.abs(team1Score - team2Score);
          if (pointDifferential > prevPointDifferential) {
            biggestLossGameId = game.key;
            if (team1Score < team2Score) {
              biggestLossTeamId = gameObj['team1']['id'];
            } else {
              biggestLossTeamId = gameObj['team2']['id'];
            }
          } else if (differential === prevDifferential) {
            biggestLossGameId.push(game.key);
            if (team1Score < team2Score) {
              biggestLossTeamId.push(gameObj['team1']['id']);
            } else {
              biggestLossTeamId.push(gameObj['team2']['id']);
            }
          }

          // find the game with the biggest upset

        }
      });

      winners['loss'] = biggestLossTeamId;

      console.log('winners: ');
      console.log(winners);

      data[1].forEach(league => {
        let leagueId = league.key;
        let leagueStatus = league.val();
        console.log('leagueId: ' + leagueId);
        console.log(leagueStatus);
        if (leagueStatus) {
          return admin.database().ref('/leagues/' + leagueId + '/game-winners').set(winners);
        }
      });

      return null;
    });
  }
});

exports.updateBTTLeaguePayoutValues = functions.database.ref('/leagues/{leagueId}/game-winners').onUpdate((change, context) => {
  const leagueId = context.params.leagueId;
  const winners = change.after.val();

  console.log(winners['tournament-code']);

  if (winners['tournament-code'] === 'btt') {
    const payoutSettings = admin.database().ref('/leagues/' + leagueId + '/payout-settings').once('value');
    const poolTotal = admin.database().ref('/leagues/' + leagueId + '/pool-total').once('value');
    const teamsNode = admin.database().ref('/leagues/' + leagueId + '/teams').once('value');

    return Promise.all([payoutSettings, poolTotal, teamsNode]).then(data => {
      let payouts = data[0].val();
      let total = data[1].val();
      let teams = data[2].val();
      let teamPayouts = {};

      for (var gameId in winners) {
        let roundCode = gameId.match(/R[0-9]+/g) !== null ? gameId.match(/R[0-9]+/g)[0] : 'n/a';
        console.log('round code: ' + roundCode);

        if (roundCode !== 'n/a') {
          let payoutRate = Number(payouts[roundCode]);
          console.log('payout rate: ' + payoutRate);
          let returnValue = total * payoutRate;

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
  

})
