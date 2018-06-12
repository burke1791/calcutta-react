import NotificationService, { NOTIF_LEAGUE_JOINED, NOTIF_LEAGUE_CREATED } from './notification-service';
import { database } from './fire';

let ns = new NotificationService();
let instance = null;

class DataService {
  constructor() {
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  logUserInDatabase(user, username) {
    var uid = user.uid;

    var userData = {
      'username': username
    };
    database.ref('/users').child(uid).update(userData);

    if (user != null) {
      user.providerData.forEach(function(profile) {
        var userData = {
          'provider': profile.providerId,
          'provider-uid': profile.uid,
          'name': profile.displayName,
          'email': profile.email,
          'photo-url': profile.photoURL
        };
        database.ref('users').child(uid).update(userData);
      })
    }
  }

  getDisplayName = (uid) => {
    if (uid != null) {
      return new Promise((resolve, reject) => {
        var displayName = 'didn\'t work'
        database.ref('/users/' + uid).once('value').then(function(snapshot) {
          displayName = snapshot.child('username').val();
          console.log('display snapshot: ' + displayName);
          resolve(displayName);
        });
      })
    } else {
      return null;
    }
  }

  getDataSnapshot = (ref) => {
    return new Promise((resolve, reject) => {
      database.ref(ref).once('value').then(function(snapshot) {
        resolve(snapshot);
      });
    });
  }

  joinLeague(key, uid) {
    database.ref('/leagues/' + key + '/members/' + uid).set(true);
    ns.postNotification(NOTIF_LEAGUE_JOINED, null);
  }

  createLeague(league) {
    database.ref('/leagues').push(league);
    ns.postNotification(NOTIF_LEAGUE_CREATED, null);
    // Redirect to league setup page (react router)
  }
}

export default DataService;