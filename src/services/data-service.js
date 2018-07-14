import NotificationService, { NOTIF_LEAGUE_JOINED, NOTIF_LEAGUE_CREATED, NOTIF_AUCTION_CHANGE } from './notification-service';
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

  // Grabs the entire league's node
  getLeagueInfo = (leagueId, uid) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId).once('value').then(function(snapshot) {
        var members = snapshot.child('members').val()
        if (members[uid]) {
          resolve(snapshot);
        } else {
          reject(new Error('failed to get league info'));
        }
      });
    })
  }

  getLeagueName = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId).once('value').then(function(snapshot) {
        var leagueName = snapshot.child('name').val();
        console.log('leagueName: ' + leagueName);
        // need some sort of conditional check
        resolve(leagueName);
      });
    });
  }

  attachAuctionListener = (leagueId) => {
    database.ref('/auctions/' + leagueId).on('value', function(snapshot) {
      console.log('auction snapshot: ' + snapshot.child('current-bid').val());
      ns.postNotification(NOTIF_AUCTION_CHANGE, snapshot.val());
    }, function(errorObject) {
      console.log('the read failed: ' + errorObject.code);
    });
  }

  detatchAuctionListener = (leagueId) => {
    database.ref('/auctions/' + leagueId).off('value');
  }

  getTeamCodes = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/teams').once('value').then(function(snapshot) {
        var teams = snapshot.val();
        resolve(teams);
      });
    });
  }

  logAuctionItemResult = (leagueId) => {
    var itemCode = '';
    var winnerUID = '';
    var winningBid = 0;

    return new Promise((resolve, reject) => {
      database.ref('/auctions/' + leagueId + '/current-item').once('value').then(function(snapshot) {
        itemCode = snapshot.child('code').val();
        winnerUID = snapshot.child('winner-uid').val();
        winningBid = snapshot.child('current-bid').val();
  
        database.ref('/leagues/' + leagueId + '/teams/' + itemCode).update({
          'owner': winnerUID,
          'price': winningBid
        }, function(error) {
          if (error) {
            console.log('logAuctionItemResult failed');
            reject();
          } else {
            console.log('logAuctionItemResult succeeded');
            resolve(itemCode);
          }
        });
      });
    });
  }

  loadNextItem = (teamCode, leagueId) => {
    var name = '';

    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/teams/' + teamCode).once('value').then(function(snapshot) {
        name = snapshot.child('name').val();
        database.ref('/auctions/' + leagueId).set({
          'current-item': {
            'code': teamCode,
            'complete': false,
            'current-bid': 0,
            'current-winner': '',
            'end-time': '',
            'name': name,
            'winner-uid': ''
          },
          'in-progress': true
        }, function(error) {
          if (error) {
            console.log('loadNextItem failed');
            reject();
          } else {
            console.log('loadNextItem succeeded');
            resolve();
          }
        });
      });
    });
    
  }

  restartAuctionClock = (leagueId) => {
    var newTime = new Date();
    newTime = newTime.toLocaleTimeString();
    database.ref('/auctions/' + leagueId + '/current-item').update({
      'end-time': newTime,
      'complete': false
    });
  }

  placeBid(leagueId, uid, name, bid) {
    var bidDate = new Date();

    var bidTime = bidDate.toLocaleTimeString();

    var bidObj = {
      amount: bid,
      bidder: name,
      time: bidTime
    }

    database.ref('/auctions/' + leagueId + '/current-item/bids').push(bidObj);
    database.ref('/auctions/' + leagueId + '/current-item').update({
      'current-bid': bid,
      'current-winner': name,
      'winner-uid': uid
    });
  }

  auctionItemComplete(leagueId) {
    database.ref('/auctions/' + leagueId + '/current-item').update({
      'complete': true
    });
  }

  getLeagueOwner = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/creator').once('value').then(function(snapshot) {
        var leagueOwner = snapshot.val();
        resolve(leagueOwner);
      });
    });
  }

  getLeagueUserInfo = (leagueId, uid) => {
    return new Promise((resolve, reject) => {
      var thisMembers = {};

      database.ref('/leagues/' + leagueId).once('value').then(function(league) {
        var members = league.child('members').val();
        var teams = league.val().teams;

        for (var mem in members) {
          var member = {
            buyIn: 0,
            payout: 0,
            netReturn: 0,
            rank: 0
          }

          var buyIn = 0;
          var payout = 0;

          if (members[mem]) {
            for (var team in teams) {
              if (teams[team].owner === mem) {
                buyIn += Number(teams[team].price);
                payout += Number(teams[team].return);
              }
            }
            member.buyIn = buyIn;
            member.payout = payout;
            member.netReturn = payout - buyIn;

            thisMembers[mem] = member;
          }
        }

        var netReturns = [];

        for (var mem in thisMembers) {
          netReturns.push(thisMembers[mem].netReturn);
        }

        netReturns.sort(function(a, b) {return(b - a)});

        for (var mem in thisMembers) {
          for (var i = 0; i < netReturns.length; i++) {
            if (netReturns[i] == thisMembers[mem].netReturn) {
              thisMembers[mem].rank = i + 1;
              break;
            }
          }
        }

        resolve(thisMembers);
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