import NotificationService, {} from './notification-service';
import Fire from './fire';

let ns = new NotificationService();
let instance = null;

let usersRef = Fire.database().ref('users');

class DataService {
  constructor() {
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  logUserInDatabase(user, username) {
    console.log('user: ' + user);
    var uid = user.uid;
    console.log(usersRef == null);
    console.log('username: ' + username);

    var userData = {
      'username': username
    };
    usersRef.child(uid).update(userData);

    if (user != null) {
      user.providerData.forEach(function(profile) {
        var userData = {
          'provider': profile.providerId,
          'provider-uid': profile.uid,
          'name': profile.displayName,
          'email': profile.email,
          'photo-url': profile.photoURL
        };
        usersRef.child(uid).update(userData);
      })
    }
  }
}

export default DataService;