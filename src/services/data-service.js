import NotificationService, { 
  NOTIF_LEAGUE_JOINED, 
  NOTIF_LEAGUE_CREATED, 
  NOTIF_AUCTION_CHANGE, 
  NOTIF_AUCTION_NEW_MESSAGE,
  NOTIF_AUCTION_ITEM_SOLD 
} from './notification-service';
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

  // Needs to be called when league creator chooses the sport
  populateLeagueTeams(leagueId, sport) {
    if (leagueId != null && sport == 'mlb') {
      this.getDataSnapshot('/sports/mlb').then(function(snapshot) {
        var mlbTeams = snapshot.val();
        database.ref('/leagues/' + leagueId + '/teams').set(mlbTeams);
      });
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

  getLeagueParticipants = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/members').once('value').then(function(snapshot) {
        var members = snapshot.val();
        var uids = Object.keys(members);
        var participants = {};

        for (var uid in uids) {
          if (members[uid]) {
            participants[uid] = null;
          }
        }
        resolve(participants);
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

  attachLeagueBiddingListener = (leagueId) => {
    database.ref('/leagues/' + leagueId + '/teams').on('value', function(snapshot) {
      ns.postNotification(NOTIF_AUCTION_ITEM_SOLD, snapshot.val());
    }, function(errorObject) {
      console.log('the read failed: ' + errorObject.code);
    });
  }

  detatchLeagueBiddingListener = (leagueId) => {
    database.ref('/leagues/' + leagueId + '/teams').off('value');
  }

  getTeamCodes = (leagueId) => {
    return new Promise((resolve, reject) => {
      var teams = {};
      database.ref('/leagues/' + leagueId + '/teams').once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          var owner = childSnapshot.child('owner').val();

          if (owner === '') {
            teams[key] = childSnapshot.val();
            console.log('team: ' + teams[key]['name']);
          }
        });
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
    var bidRef = database.ref('/auctions/' + leagueId + '/current-item');
    var bidHistoryRef = database.ref('/auctions/' + leagueId + '/bid-history');

    var bidDate = new Date();
    var bidTime = bidDate.toLocaleTimeString();

    var bidHistoryObj = {
      amount: bid,
      bidder: name,
      time: bidTime,
      uid: uid
    };

    bidRef.transaction(function(currentData) {
      var currentBid = currentData['current-bid'];
      if (currentData === null || currentBid < bid) {
        var bidObj = {
          'code': currentData['code'],
          'complete': false,
          'current-bid': bid,
          'current-winner': name,
          'end-time': currentData['end-time'],
          'name': currentData['name'],
          'winner-uid': uid
        };

        bidHistoryRef.child(currentData['code']).push(bidHistoryObj);
        
        return bidObj; // update the current bid
      } else if (currentBid > bid) {
        return; // abort the transaction
      }
    }, function(error, committed, snapshot) {
      if (error) {
        console.log('Transaction failed abnormally: ' + error);
      } else if (!committed) {
        console.log('Aborted transaction because bid was too low');
      } else {
        console.log('Bid succeeded');
      }
    });

    // keeping the below in case the transaction paradigm (above) ends up failing miserably
    /*
    database.ref('/auctions/' + leagueId + '/current-item/bids').push(bidObj);
    database.ref('/auctions/' + leagueId + '/current-item').update({
      'current-bid': bid,
      'current-winner': name,
      'winner-uid': uid
    });
    */
  }

  auctionItemComplete(leagueId) {
    database.ref('/auctions/' + leagueId + '/current-item').update({
      'complete': true
    });
  }

  attachAuctionMessagesListener = (leagueId) => {
    database.ref('/messages-auction/' + leagueId).on('value', function(snapshot) {
      ns.postNotification(NOTIF_AUCTION_NEW_MESSAGE, snapshot.val());
    }, function(errorObject) {
      console.log('auction messages read failed: ' + errorObject.code);
    });
  }

  detatchAuctionMessagesListener = (leagueId) => {
    database.ref('/messages-auction/' + leagueId).off('value');
  }

  postAuctionChatMessage = (leagueId, message, user, uid) => {
    var messageDate = new Date();
    var messageTime = messageDate.toLocaleTimeString();
    
    var message = {
      'author': user,
      'body': message,
      'time': messageTime,
      'uid': uid
    }

    database.ref('/messages-auction/' + leagueId).push(message);
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

  getUserTeams = (leagueId, uid) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/teams').once('value').then(function(snapshot) {
        var teams = snapshot.val();
        var userTeams = {};

        for (var team in teams) {
          var userTeam = {
            name: '',
            price: 0,
            payout: 0,
            netReturn: 0
          }

          if (teams[team].owner === uid) {
            userTeam.name = teams[team].name;
            userTeam.price = teams[team].price;
            userTeam.payout = teams[team].return;
            userTeam.netReturn = Number(userTeam.payout) - Number(userTeam.price);

            userTeams[team] = userTeam;
          }
        }

        resolve(userTeams);
      });
    });
    
  }

  joinLeague(key, uid) {
    database.ref('/leagues/' + key + '/members/' + uid).set(true);
    ns.postNotification(NOTIF_LEAGUE_JOINED, null);
  }

  createLeague(league) {
    const sportCode = league['sport'];

    var auction = {
      'current-item': {
        'code': "",
        'complete': true,
        'current-bid': 0,
        'current-winner': "",
        'end-time': "",
        'name': "",
        'winner-uid': ""
      },
      'in-progress': false
    };

    // temporary until I move creation of the league object to this function
    var newLeague = league;

    database.ref('/sports/' + sportCode).once('value').then(function(snapshot) {
      var teams = snapshot.val();
      newLeague['teams'] = teams;

      database.ref('/leagues').push(league).then(function(snapshot) {
        const pushId = snapshot.key;
        database.ref('/auctions').child(pushId).set(auction);
        // TODO: Redirect to league setup page (react router)
        ns.postNotification(NOTIF_LEAGUE_CREATED, null);
      });
    });
  }

  formatMoney = (value) => {
    var currencyString = '';

    var s = '';
    var sym = '$';
    
    if (value < 0) {
      s = '-';
    }
    currencyString = s + sym + ' ' + Math.abs(value).toFixed(2);
    return (currencyString);
  }

  addSportToDatabase() {
    var nfl = {
      'nfl-2018': {
        'afc-e-01': {
          'name': 'New England Patriots',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-e-02': {
          'name': 'Miami Dolphins',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-e-03': {
          'name': 'New York Jets',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-e-04': {
          'name': 'Buffalo Bills',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-n-01': {
          'name': 'Pittsburgh Steelers',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-n-02': {
          'name': 'Cleveland Browns',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-n-03': {
          'name': 'Baltimore Ravens',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-n-04': {
          'name': 'Cincinnati Bengals',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-s-01': {
          'name': 'Indianapolis Colts',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-s-02': {
          'name': 'Houston Texans',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-s-03': {
          'name': 'Tennessee Titans',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-s-04': {
          'name': 'Jacksonville Jaguars',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-w-01': {
          'name': 'Oakland Raiders',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-w-02': {
          'name': 'Denver Broncos',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-w-03': {
          'name': 'Kansas City Chiefs',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'afc-w-04': {
          'name': 'Los Angeles Chargers',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-e-01': {
          'name': 'New York Giants',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-e-02': {
          'name': 'Dallas Cowboys',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-e-03': {
          'name': 'Washington Redskins',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-e-04': {
          'name': 'Philadelphia Eagles',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-n-01': {
          'name': 'Green Bay Packers',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-n-02': {
          'name': 'Chicago Bears',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-n-03': {
          'name': 'Detroit Lions',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-n-04': {
          'name': 'Minnesota Vikings',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-s-01': {
          'name': 'Tampa Bay Buccaneers',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-s-02': {
          'name': 'Atlanta Falcons',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-s-03': {
          'name': 'New Orleans Saints',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-s-04': {
          'name': 'Carolina Panthers',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-w-01': {
          'name': 'San Francisco 49ers',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-w-02': {
          'name': 'Los Angeles Rams',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-w-03': {
          'name': 'Arizona Cardinals',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'nfc-w-04': {
          'name': 'Seattle Seahawks',
          'owner': '',
          'price': 0,
          'return': 0
        }
      }
    };

    database.ref('/sports/').update(nfl);
  }
}

export default DataService;