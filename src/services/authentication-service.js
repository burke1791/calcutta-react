import NotificationService, {NOTIF_SIGNIN, NOTIF_SIGNOUT} from './notification-service';
import DataService from './data-service';
import Fire from './fire';

let ns = new NotificationService();
let ds = new DataService();
let instance = null;
let authRef = Fire.auth();

class AuthenticationService {
  constructor() {
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  getUser = () => {
    console.log(authRef.currentUser.uid);
    return authRef.currentUser;
  }

  createUser(email, password, username) {
    console.log('username in authServ: ' + username);
    authRef.createUserWithEmailAndPassword(email, password).then(function(user) {
      var user = authRef.currentUser;
      ds.logUserInDatabase(user, username);
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;

      console.log('create user error: ' + errorMessage);
    });
  }

  signInUser(email, password) {
    authRef.signInWithEmailAndPassword(email, password).then(function(user) {
      // Post notification?
    }, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;

      console.log('sign in error: ' + errorMessage);
    })
  }

  signOutUser() {

  }
}

export default AuthenticationService;