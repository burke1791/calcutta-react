const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/*
exports.testFunction = functions.database.ref('/leagues/{pushId}').onCreate((snapshot, context) => {
  const original = snapshot.val();
  var sport = original['sport'];
  console.log('New League Sport Code: ' + sport);

  var newSeed = {
    's-09': {
      'name': 'test function',
      'owner': 'nobody',
      'price': 0,
      'return': 0
    }
  };

  return null;
});
*/

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
  const btt_structureRef = admin.database().ref('/btt-structure/' + year);

  return btt_structureRef.once('value').then(snapshot => {
    const seedUpdate = {"id": newTeamId};
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

  const team1Score = change.after.child('team1').val();
  const team2Score = change.after.child('team2').val();

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
      updateBTTPayoutInfoByTeamId(year, dayNum, winner);
      return updateRef.update(winnerUpdate);
    } else if (team2Score > team1Score) {
      winner = team2Id;
      winnerUpdate = {'winner': winner};
      updateBTTPayoutInfoByTeamId(dayNum, winner);
      return updateRef.update(winnerUpdate);
    } else {
      return null
    }
  }).then(() => {
    if (gamesObj[nextGameId]['team1']['id'] === 0) {
      var team1Update = {"id": winner};
      const team1UpdateRef = admin.database().ref('/btt-structure/' + year + '/' + nextGameId + '/team1');
      return team1UpdateRef.update(team1Update);
    } else if (gamesObj[nextGameId]['team2']['id'] === 0) {
      var team2Update = {"id": winner};
      const team2UpdateRef = admin.database().ref('/btt-structure/' + year + '/' + nextGameId + '/team2');
      return team2UpdateRef.update(team2Update);
    } else {
      return null;
    }
  });
});