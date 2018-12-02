const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

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

  return snapshot.ref.child('teams').update(newSeed);
});