import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT } from './notification-service';
import DataService from './data-service';
import { auth } from './fire';

let ns = new NotificationService();
let ds = new DataService();
let instance = null;

class AuthenticationService {
  constructor() {
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  getUser = () => {
    console.log(auth.currentUser.uid);
    return auth.currentUser;
  }

  createUser(email, password, username) {
    console.log('username in authServ: ' + username);
    auth.createUserWithEmailAndPassword(email, password).then(function(user) {
      var user = auth.currentUser;
      ds.logUserInDatabase(user, username);
      ns.postNotification(NOTIF_SIGNIN, null);
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;

      console.log('create user error: ' + errorMessage);
    });
  }

  signInUser(email, password) {
    auth.signInWithEmailAndPassword(email, password).then(function(user) {
      // Post notification?
      ns.postNotification(NOTIF_SIGNIN, null);
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;

      console.log('sign in error: ' + errorMessage);
    })
  }

  signOutUser() {
    auth.signOut();
    ns.postNotification(NOTIF_SIGNOUT, null);
  }
}

export default AuthenticationService;