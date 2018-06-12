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
      console.log('sign in notification posted');
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

  addAuthListener(thisApp) {
    auth.onAuthStateChanged(function(user) {
      if (user) {
        console.log('user signed in');
        thisApp.setState({authenticatedUser: user});

        ds.getDisplayName(thisApp.state.authenticatedUser.uid).then(function(res) {
          thisApp.setState({authenticatedUsername: res});
        });
        ns.postNotification(NOTIF_SIGNIN, null);
      } else {
        console.log('user is signed out');
        ns.postNotification(NOTIF_SIGNOUT);
        thisApp.setState({
          authenticatedUser: {},
          authenticatedUsername: ''
        })
      }
    });
  }

  removeAuthListener() {
    auth.onAuthStateChanged();
  }
}

export default AuthenticationService;