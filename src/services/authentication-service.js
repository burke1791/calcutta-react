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
    auth.createUserWithEmailAndPassword(email, password).then(function() {
      var user = auth.currentUser;
      ds.logUserInDatabase(user, username);
      ns.postNotification(NOTIF_SIGNIN, user.uid);
    }, function(error) {
      // var errorCode = error.code;
      var errorMessage = error.message;

      console.log('create user error: ' + errorMessage);
    });
  }

  signInUser = (email, password) => {
    return new Promise((resolve, reject) => {
      auth.signInWithEmailAndPassword(email, password).then(function(user) {
        ns.postNotification(NOTIF_SIGNIN, user.user.uid);
        resolve();
      }, function(error) {
        // var errorCode = error.code;
        var errorMessage = error.message;
        var errorCode = error.code;
  
        console.log('sign in error: ' + errorMessage);
        console.log('sign in error code: ' + errorCode);

        reject(error);
      });
    })
  }

  signOutUser() {
    auth.signOut();
    ns.postNotification(NOTIF_SIGNOUT, null);
  }

  updateUsername = (newUsername) => {
    var uid = auth.currentUser.uid;
    
    auth.currentUser.updateProfile({
      displayName: newUsername
    });

    ds.updateUsername(uid, newUsername);
  }

  updatePassword = (newPassword) => {
    // need to check reauthentication
    //auth.currentUser.reauthenticateWithCredential()
    auth.currentUser.updatePassword(newPassword);
  }

  sendPasswordResetEmail = (email = '') => {
    var userEmail;
    if (email === '') {
      userEmail = auth.currentUser.email;
    } else {
      userEmail = email;
    }

    return new Promise((resolve, reject) => {
      if (userEmail) {
        auth.sendPasswordResetEmail(userEmail).then(() => {
          resolve();
        }).catch(function(error) {
          console.log('error sending password reset email');
          console.log(error);
          reject(error);
        });
      } else {
        reject('need email to send reset link');
      }
    });
  }

  addAuthListener(thisApp) {
    auth.onAuthStateChanged(function(user) {
      if (user) {
        thisApp.setState({
          authenticatedUser: user,
          authenticatedUid: user.uid
        });

        ds.getDisplayName(thisApp.state.authenticatedUser.uid).then(function(res) {
          thisApp.setState({authenticatedUsername: res});
        });
        ns.postNotification(NOTIF_SIGNIN, user.uid);
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