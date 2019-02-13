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

  const newLeaguePath = admin.database().ref('/leagues/' + pushId);
  const newLeagueTeamsPath = admin.database().ref('/leagues/' + pushId + '/teams');

  teams.forEach(child => {
    const teamId = child.key;

    return admin.database().ref('/' + infoNode + '-team-info/' + teamId + '/name').once('value').then(teamName => {
      var teamNameUpdate = {
        [teamId]: {
          'name': teamName.val()
        }
      };

      return newLeagueTeamsPath.update(teamNameUpdate);
    });
  });
});