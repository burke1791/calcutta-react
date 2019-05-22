import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT } from './notification-service';
import DataService from './data-service';
import { auth, emailAuth } from './fire';

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
    return new Promise((resolve, reject) => {
      auth.createUserWithEmailAndPassword(email, password).then(function() {
        var user = auth.currentUser;
        ds.logUserInDatabase(user, username);
        ns.postNotification(NOTIF_SIGNIN, user.uid);
        resolve();
      }, function(error) {
        reject(error);
      });
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

  reauthenticateUser = (email, password) => {
    let cred = emailAuth.credential(email, password);

    return new Promise((resolve, reject) => {
      auth.currentUser.reauthenticateAndRetrieveDataWithCredential(cred).then(userCredential => {
        resolve(userCredential);
      }).catch(error => {
        reject(error);
      });
    })
  }

  updatePassword = (newPassword) => {
    return new Promise((resolve, reject) => {
      auth.currentUser.updatePassword(newPassword).then((passwordChangeReturn) => {
        resolve(passwordChangeReturn);
      }).catch((error) => {
        reject(error);
      });
    });
    
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