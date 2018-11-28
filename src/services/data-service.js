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

  updateUsername(uid, newUsername) {
    database.ref('/users').child(uid).update({
      'username': newUsername
    });
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

        resolve(uids);

        /*
        var participants = {};

        for (var uid in uids) {
          if (members[uid]) {
            participants[uid] = null;
          }
        }
        resolve(participants);
        */
      });
    });
  }

  attachAuctionListener = (leagueId) => {
    database.ref('/auctions/' + leagueId).on('value', function(snapshot) {
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

        if (winnerUID === '') {
          winnerUID = '(unclaimed)';
        }
  
        database.ref('/leagues/' + leagueId + '/teams/' + itemCode).update({
          'owner': winnerUID,
          'price': winningBid
        }, function(error) {
          if (error) {
            console.log('logAuctionItemResult failed');
            reject();
          } else {
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
        database.ref('/auctions/' + leagueId).update({
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
        
        // bidHistoryRef.child(currentData['code']).push(bidHistoryObj);

        return bidObj; // update the current bid
      } else if (currentBid > bid) {
        return; // abort the transaction
      }
    }, function(error, committed, snapshot) {
      if (error) {
        console.log('Transaction failed abnormally: ' + error);
      } else if (!committed) {
        console.log('Aborted transaction because bid was too low');
      } else if (committed) {
        console.log('committed true - Bid succeeded');

        var bidDate = new Date();
        var bidTime = bidDate.toLocaleTimeString();

        var bidHistoryObj = {
          amount: snapshot.child('current-bid').val(),
          bidder: snapshot.child('current-winner').val(),
          time: bidTime,
          uid: snapshot.child('winner-uid').val()
        };
        bidHistoryRef.child(snapshot.child('code').val()).push(bidHistoryObj);
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

  endAuction(leagueId) {
    database.ref('/auctions/' + leagueId).update({
      'in-progress': false
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
    var cfb_2018 = {
      'cfb-2018': {
        'acc-01': {
          'name': '(ACC) Clemson',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-02': {
          'name': '(ACC) Florida St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-03': {
          'name': '(ACC) NC State',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-04': {
          'name': '(ACC) Wake Forest',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-05': {
          'name': '(ACC) Boston College',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-06': {
          'name': '(ACC) Louisville',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-07': {
          'name': '(ACC) Miami',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-08': {
          'name': '(ACC) Virginia Tech',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-09': {
          'name': '(ACC) Georgia Tech',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-10': {
          'name': '(ACC) Pittsburgh',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-11': {
          'name': '(ACC) Duke',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-12': {
          'name': '(ACC) North Carolina',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'acc-13': {
          'name': '(ACC) Virginia',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-01': {
          'name': '(B12) Oklahoma',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-02': {
          'name': '(B12) Texas',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-03': {
          'name': '(B12) West Virginia',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-04': {
          'name': '(B12) TCU',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-05': {
          'name': '(B12) Oklahoma St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-06': {
          'name': '(B12) Iowa St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-07': {
          'name': '(B12) Kansas St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-08': {
          'name': '(B12) Baylor',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b12-09': {
          'name': '(B12) Texas Tech',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-01': {
          'name': '(B1G) Ohio St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-02': {
          'name': '(B1G) Michigan',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-03': {
          'name': '(B1G) Penn St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-04': {
          'name': '(B1G) Michigan St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-05': {
          'name': '(B1G) Maryland',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-06': {
          'name': '(B1G) Indiana',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-07': {
          'name': '(B1G) Rutgers',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-08': {
          'name': '(B1G) Wisconsin',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-09': {
          'name': '(B1G) Iowa',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-10': {
          'name': '(B1G) Purdue',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-11': {
          'name': '(B1G) Northwestern',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-12': {
          'name': '(B1G) Nebraska',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-13': {
          'name': '(B1G) Minnesota',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'b10-14': {
          'name': '(B1G) Illinois',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-01': {
          'name': '(Pac-12) Washington',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-02': {
          'name': '(Pac-12) Stanford',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-03': {
          'name': '(Pac-12) Oregon',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-04': {
          'name': '(Pac-12) California',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-05': {
          'name': '(Pac-12) Washington St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-06': {
          'name': '(Pac-12) Oregon St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-07': {
          'name': '(Pac-12) USC',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-08': {
          'name': '(Pac-12) Utah',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-09': {
          'name': '(Pac-12) Arizona',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-10': {
          'name': '(Pac-12) UCLA',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-11': {
          'name': '(Pac-12) Colorado',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'p12-12': {
          'name': '(Pac-12) Arizona St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-01': {
          'name': '(SEC) Georgia',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-02': {
          'name': '(SEC) Florida',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-03': {
          'name': '(SEC) South Carolina',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-04': {
          'name': '(SEC) Missouri',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-05': {
          'name': '(SEC) Kentucky',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-06': {
          'name': '(SEC) Tennessee',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-07': {
          'name': '(SEC) Vanderbilt',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-08': {
          'name': '(SEC) Alabama',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-09': {
          'name': '(SEC) Auburn',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-10': {
          'name': '(SEC) Mississippi',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-11': {
          'name': '(SEC) Texas A&M',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-12': {
          'name': '(SEC) LSU',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-13': {
          'name': '(SEC) Ole Miss',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sec-14': {
          'name': '(SEC) Arkansas',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'ind-01': {
          'name': '(Indep) Notre Dame',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'ind-02': {
          'name': '(Indep) Army',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'mwc-01': {
          'name': '(MWC) Boise St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'mwc-02': {
          'name': '(MWC) San Diego St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'mwc-03': {
          'name': '(MWC) Fresno St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'cusa-01': {
          'name': '(C-USA) FAU',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'cusa-02': {
          'name': '(C-USA) Marshall',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'cusa-03': {
          'name': '(C-USA) North Texas',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'cusa-04': {
          'name': '(C-USA) Louisiana Tech',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'am-01': {
          'name': '(American) UCF',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'am-02': {
          'name': '(American) Memphis',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'am-03': {
          'name': '(American) Navy',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'am-04': {
          'name': '(American) Houston',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'am-05': {
          'name': '(American) Temple',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'am-06': {
          'name': '(American) USF',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'mac-01': {
          'name': '(MAC) Ohio',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'mac-02': {
          'name': '(MAC) NIU',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'mac-03': {
          'name': '(MAC) Toledo',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sb-01': {
          'name': '(Sun Belt) Arkansas St',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sb-02': {
          'name': '(Sun Belt) Troy',
          'owner': '',
          'price': 0,
          'return': 0
        },
        'sb-03': {
          'name': '(Sun Belt) Appalachian St',
          'owner': '',
          'price': 0,
          'return': 0
        }
      }
    }

    database.ref('/sports/').update(cfb_2018);
  }
}

export default DataService;