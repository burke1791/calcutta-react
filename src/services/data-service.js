import NotificationService, { 
  NOTIF_LEAGUE_JOINED, 
  NOTIF_LEAGUE_CREATED, 
  NOTIF_AUCTION_CHANGE, 
  NOTIF_AUCTION_NEW_MESSAGE,
  NOTIF_AUCTION_ITEM_SOLD,
  NOTIF_AUCTION_TOTAL_UPDATED
} from './notification-service';
import { database, fireDatabase } from './fire';

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

  isAdmin = (uid) => {
    return new Promise((resolve, reject) => {
      database.ref('/admins/' + uid).once('value').then(function(snapshot) {
        if (snapshot.val()) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, function(error) {
        resolve(false);
      });
    });
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
      });
    });
  }

  getLeagueSportCode = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/sport').once('value').then(sportCodeSnapshot => {
        let sportCode = sportCodeSnapshot.val();
        resolve(sportCode);
      });
    });
  }

  attachUserServerClockListener = (uid, callback) => {
    database.ref('/users/' + uid + '/clock-offset').on('value', (serverTimestampSnapshot) => {
      let serverTimestamp = serverTimestampSnapshot.val();
      callback(serverTimestamp);
    }, function(error) {
      console.log(error);
    });
  }

  detatchUserServerClockListener(uid) {
    database.ref('/users/' + uid + '/clock-offset').off('value');
  }

  sendNewClientServerTimestamp(uid) {
    let currentTime = new Date().getTime();

    database.ref('/users/' + uid + '/clock-offset').update({
      'client': currentTime,
      'server': fireDatabase.ServerValue.TIMESTAMP
    });
  }

  // TEST
  getClientServerTimeOffset() {
    let currentTime = new Date().getTime();
    return new Promise((resolve, reject) => {
      database.ref('.info/serverTimeOffset').once('value').then(function(offsetSnapshot) {
        let offset = offsetSnapshot.val();
        resolve(offset);
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

    database.ref('/leagues/' + leagueId + '/teamGroups').on('value', function(snapshot) {
      ns.postNotification(NOTIF_AUCTION_ITEM_SOLD, snapshot.val());
    }, function(errorObject) {
      console.log('the read failed: ' + errorObject.code);
    });
  }

  detatchLeagueBiddingListener = (leagueId) => {
    database.ref('/leagues/' + leagueId + '/teams').off('value');
    database.ref('/leagues/' + leagueId + '/teamGroups').off('value');
  }

  attachLeagueTotalsListener = (leagueId) => {
    database.ref('/leagues/' + leagueId + '/prize-pool').on('value', function(prizeSnapshot) {
      ns.postNotification(NOTIF_AUCTION_TOTAL_UPDATED, prizeSnapshot.val());
    }, function(errorObject) {
      console.log('the read failed: ' + errorObject.code);
    });
  }

  detatchLeagueTotalsListener = (leagueId) => {
    database.ref('/leagues/' + leagueId + '/prize-pool').off('value');
  }

  getTeamCodes = (leagueId) => {
    return new Promise((resolve, reject) => {
      var teams = {};
      database.ref('/leagues/' + leagueId).once('value').then(function(snapshot) {
        let teams = snapshot.child('teams').val();
        let teamGroups = snapshot.child('teamGroups').val();
        let teamsObj = {};
        
        for (var teamKey in teams) {
          var owner = teams[teamKey]['owner'];

          if (owner === '') {
            teamsObj[teamKey] = teams[teamKey];
          }
        }

        if (teamGroups !== null) {
          for (var groupKey in teamGroups) {
            var owner = teamGroups[groupKey]['owner'];

            if (owner === '') {
              teamsObj[groupKey] = teamGroups[groupKey]
            }
          }
        }

        resolve(teamsObj);
      });
    });
  }

  logAuctionItemResult = (leagueId, unclaimed = false) => {
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
        
        if (unclaimed || winnerUID !== '(unclaimed)') {
          const team = database.ref('/leagues/' + leagueId + '/teams/' + itemCode).once('value');
          const teamGroup = database.ref('/leagues/' + leagueId + '/teamGroups/' + itemCode).once('value');

          return Promise.all([team, teamGroup]).then(data => {
            let team = data[0].val();
            let teamGroup = data[1].val();

            // check if teamCode refers to a team grouping
            if (teamGroup !== null) {
              database.ref('/leagues/' + leagueId + '/teamGroups/' + itemCode).update({
                'owner': winnerUID,
                'price': winningBid
              }, function(error) {
                if (error) {
                  console.log('logAuctionItemResult failed: ' + error.code);
                  reject();
                } else {
                  resolve(itemCode);
                }
              });
            } else {
              database.ref('/leagues/' + leagueId + '/teams/' + itemCode).update({
                'owner': winnerUID,
                'price': winningBid
              }, function(error) {
                if (error) {
                  console.log('logAuctionItemResult failed: ' + error.code);
                  reject();
                } else {
                  resolve(itemCode);
                }
              });
            }
          });
        } else {
          resolve();
        }
      });
    });
  }

  loadNextItem = (teamCode, leagueId, interval = 15) => {
    var name;

    const teams = database.ref('/leagues/' + leagueId + '/teams').once('value');
    const teamGroups = database.ref('/leagues/' + leagueId + '/teamGroups').once('value');

    return new Promise((resolve, reject) => {
      return Promise.all([teams, teamGroups]).then(data => {
        let teams = data[0].val();
        let teamGroups = data[1].val();
  
        let endTime = fireDatabase.ServerValue.TIMESTAMP;
        let auctionUpdate = {};
  
        // check for teamCode in teamGroups
        if (teamGroups !== null && teamGroups[teamCode] !== undefined) {
          if (teamGroups[teamCode]['seed-value'] !== undefined) {
            name = '(' + teamGroups[teamCode]['seed-value'] + ') ' + teamGroups[teamCode]['name'];
          } else {
            name = teamGroups[teamCode]['name'];
          }
        } else {
          // teamCode is a regular code
          if (teams[teamCode]['seed-value'] !== undefined) {
            name = '(' + teams[teamCode]['seed-value'] + ') ' + teams[teamCode]['name'];
          } else {
            name = teams[teamCode]['name'];
          }
        }
  
        database.ref('/auctions/' + leagueId).update({
          'current-item': {
            'code': teamCode,
            'complete': false,
            'current-bid': 0,
            'current-winner': '',
            'end-time': endTime,
            'name': name,
            'winner-uid': ''
          },
          'in-progress': true
        }, function(error) {
          if (error) {
            console.log('loadNextItem failed: ' + error.code);
            reject();
          } else {
            resolve('I returned to you');
          }
        });
      });
    });
  }

  restartAuctionClock = (leagueId) => {
    var newTime = new Date();
    newTime = newTime.toLocaleTimeString();
    database.ref('/auctions/' + leagueId + '/current-item').update({
      'end-time': fireDatabase.ServerValue.TIMESTAMP,
      'complete': false
    });
  }

  placeBid(leagueId, uid, name, bid, interval) {
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
        let endTimestamp = fireDatabase.ServerValue.TIMESTAMP;
        var bidObj = {
          'code': currentData['code'],
          'complete': false,
          'current-bid': bid,
          'current-winner': name,
          'end-time': endTimestamp,
          'name': currentData['name'],
          'winner-uid': uid
        };

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
  }

  auctionItemComplete(leagueId) {
    database.ref('/auctions/' + leagueId + '/current-item').update({
      'complete': true
    });
  }

  getTotalPrizePoolByLeagueId(leagueId, uid = '') {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/prize-pool').once('value').then(prizePoolSnapshot => {
        if (prizePoolSnapshot.val() === null) {
          reject();
        } else {
          resolve(prizePoolSnapshot.val());
        }
      }, function(error) {
        reject(error);
      });
    })
  }

  endAuction(leagueId, reset = false) {

    var freshAuction = {
      'current-item': {
        'code': '',
        'complete': true,
        'current-bid': 0,
        'current-winner': '',
        'end-time': '',
        'name': '',
        'winner-uid': ''
      },
      'in-progress': false
    }

    if (reset) {
      database.ref('/auctions/' + leagueId).set(freshAuction);
      database.ref('/leagues/' + leagueId + '/auction-status').set(false);
    } else {
      database.ref('/auctions/' + leagueId).update(freshAuction);
      database.ref('/leagues/' + leagueId + '/auction-status').set(true);
    }
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
      'uid': uid,
      'timestamp': fireDatabase.ServerValue.TIMESTAMP
    };

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
        let teamGroups = league.val().teamGroups;

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

            for (var teamGroup in teamGroups) {
              if (teamGroups[teamGroup].owner === mem) {
                payout += Number(teamGroups[teamGroup].return);
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
    const teamsSnapshot = database.ref('/leagues/' + leagueId + '/teams').once('value');
    const teamGroupsSnapshot = database.ref('/leagues/' + leagueId + '/teamGroups').once('value');

    return new Promise((resolve, reject) => {
      return Promise.all([teamsSnapshot, teamGroupsSnapshot]).then(data => {
        let teams = data[0].val();
        let teamGroups = data[1].val();
  
        var userTeams = {};

        for (var team in teams) {
          var userTeam = {
            name: '',
            price: 0,
            payout: 0,
            netReturn: 0
          };

          if (teams[team].owner === uid) {
            userTeam.name = teams[team].name;
            userTeam.price = teams[team].price;
            userTeam.payout = teams[team].return;
            userTeam.netReturn = Number(userTeam.payout) - Number(userTeam.price);

            userTeams[team] = userTeam;
          }
        }

        if (teamGroups !== null) {
          for (var team in teamGroups) {
            var userTeam = {
              name: '',
              price: 0,
              payout: 0,
              netReturn: 0
            };

            if (teamGroups[team].owner === uid) {
              userTeam.name = teamGroups[team].name;
              userTeam.price = teamGroups[team].price;
              userTeam.payout = teamGroups[team].return;
              userTeam.netReturn = Number(userTeam.payout) - Number(userTeam.price);

              userTeams[team] = userTeam;
            }
          }
        }

        resolve(userTeams);
      });
    });
  }

  joinLeague(key, uid) {
    let updates = {};
    updates['leagues/' + key + '/members/' + uid] = true;
    updates['users/' + uid + '/leagues/' + key] = true;
    database.ref('/').update(updates).then(function() {
      ns.postNotification(NOTIF_LEAGUE_JOINED, uid);
    }).catch(function(error) {
      if (error) {
        console.log('joinLeague error: ' + error);
      }
    });
  }

  getDefaultPayoutSettings = (tournamentCode) => {
    var defaultPayoutSettings = {};
    if (tournamentCode === 'btt') {
      defaultPayoutSettings = {
        'R1': 0.02,
        'R2': 0.04,
        'R3': 0.08,
        'R4': 0.12,
        'R5': 0.2,
        'upset': 0.02,
        'loss': 0.02
      };
    } else if (tournamentCode === 'mm') {
      defaultPayoutSettings = {
        'W1': 0.01,
        'W2': 0.02,
        'W3': 0.04,
        'W4': 0.075,
        'W5': 0.125,
        'W6': 0.215,
        'upset': 0.015,
        'loss': 0.015
      };
    }

    return defaultPayoutSettings;
  }

  createLeague(uid, leagueName, leaguePassword, leagueSportCode, infoNode = '') {
    // TODO: add completion handler
    let league = {
      'auction-status': false,
      'status': 'in-progress',
      'creator': uid,
      'members': {
        [uid]: true
      },
      'name': leagueName,
      'password': leaguePassword,
      'settings': {
        'unclaimed': false,
        'minBid': 1,
        'minBuyIn': 0,
        'maxBuyIn': 0,
        'use-tax': 0,
        'tax-rate': 0,
        'auction-interval': 15
      },
      'sport': leagueSportCode,
      'info-node': infoNode,
      'pool-total': 0,
      'prize-pool': {
        'total': 0,
        'bids': {}, // object where the keys are each league member's uids and the values are their bid totals
        'use-tax': {} // same as above, but the values are that member's use tax
      }
    };

    let auction = {
      'current-item': {
        'code': "",
        'complete': true,
        'current-bid': 0,
        'current-winner': "",
        'end-time': "",
        'name': "",
        'winner-uid': ""
      },
      'in-progress': false,
      'pool-total': 0
    };

    // temporary until I move creation of the league object to this function
    var newLeague = league;

    if (leagueSportCode === 'custom') {
      alert('Custom Leagues are not yet supported');
    } else {
      // TODO: write error handling for any of the .matches not finding anything
      var season = leagueSportCode.match(/[0-9]{4,}/g);
      season = season[0]; // four digit year

      var tournamentCode = leagueSportCode.match(/[a-z]{2,}/g);
      tournamentCode = tournamentCode[0]; // tournament code (i.e. the big ten tournament is "btt")
      
      let defaultPayoutSettings = this.getDefaultPayoutSettings(tournamentCode);
      league['payout-settings'] = defaultPayoutSettings;

      let teamsObj = {};
      let teamGroupsObj = {};
      let pushId;

      if (tournamentCode === 'mm') {
        database.ref('/leagues').push(league).then((snapshot) => {
          pushId = snapshot.key;
          database.ref('/auctions').child(pushId).set(auction);
          ns.postNotification(NOTIF_LEAGUE_CREATED, null);
        }).then(() => {
          database.ref('/leagues-' + tournamentCode + '/' + season).update({[pushId]: true});
          database.ref('/users/' + uid + '/leagues/' + pushId).set(true);
        });
      } else if (tournamentCode === 'btt') {
        database.ref('/' + tournamentCode + '-teams/' + season).once('value').then((seeds) => {
          seeds.forEach(child => {
            var teamId = child.key;
            var teamVal = child.val();
  
            teamsObj[teamId] = {};
            teamsObj[teamId].owner = '';
            teamsObj[teamId].price = 0;
            teamsObj[teamId].return = 0;
          });
          league['teams'] = teamsObj;
          database.ref('/leagues').push(league).then((snapshot) => {
            pushId = snapshot.key;
            database.ref('/auctions').child(pushId).set(auction);
            ns.postNotification(NOTIF_LEAGUE_CREATED, null);
          }).then(() => {
            database.ref('/leagues-' + tournamentCode + '/' + season).update({[pushId]: true});
            database.ref('/users/' + uid + '/leagues/' + pushId).set(true);
          });
        });
      }
      // populate league info from all source nodes
      // TODO: create cloud function to add tourney structure
    }
  }

  fetchSettings = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/settings').once('value').then(function(settings) {
        var currentSettings = settings.val();
        if (currentSettings) {
          resolve(currentSettings);
        } else {
          reject();
        }
      });
    });
  }

  fetchPayoutSettings = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/payout-settings').once('value').then(payoutSettingsSnapshot => {
        let payoutSettings = payoutSettingsSnapshot.val();
        if (payoutSettings) {
          resolve(payoutSettings);
        } else {
          reject();
        }
      });
    });
  }

  leaveLeague = (uid, leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/members/' + uid).set(false, function(error) {
        if (error) {
          console.log(error);
          reject();
        } else {
          resolve();
        }
      });
    });
    // should I also remove the users uid from the teams he or she owns?
  }

  resetAuction = (leagueId) => {
    var self = this;

    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/teams').once('value').then(teamsSnapshot => {
        let updates = {};
        updates['/leagues/' + leagueId + '/auction-status'] = false;

        let teams = teamsSnapshot.val();

        for (var teamId in teams) {
          teams[teamId].owner = '';
          teams[teamId].price = 0;
          teams[teamId].return = 0;
        }
        updates['/leagues/' + leagueId + '/teams'] = teams;
        updates['/leagues/' + leagueId + '/pool-total'] = 0;
        updates['/leagues/' + leagueId + '/prize-pool'] = {'total': 0};

        database.ref('/').update(updates);
        database.ref('/auctions/' + leagueId).child('bid-history').remove();
      });
    });
  }

  getAllTeamNamesInLeagueById = (teamIds, sportCode, infoNode = '') => {
    return new Promise((resolve, reject) => {
      if (infoNode !== '') {
        // go straight to the info node
      } else {
        database.ref('/tournaments/' + sportCode + '/info-node-id').once('value').then(infoNode => {
          for (var teamId of teamIds) {
            database.ref('/' + infoNode.val() + '-team-info/' + teamId + '/name').once('value').then(teamName => {

            });
          }
        });
      }
    });
  }

  deleteLeague = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId).update({
        'status': 'deleted'
      }, function(error) {
        if (error) {
          console.log(error);
          reject();
        } else { 
          resolve();
        }
      });
    })
  }

  saveSettings = (leagueId, newSettings) => {
    return new Promise((resolve, reject) => {
      let dataError = false;

      if (newSettings['maxBuyIn'] != 0) {
        if (newSettings['minBid'] > newSettings['maxBuyIn']) {
          dataError = true;
        } else if (newSettings['minBuyIn'] > newSettings['maxBuyIn']) {
          dataError = true;
        }
      } 
      
      if (!dataError) {
        database.ref('leagues/' + leagueId + '/settings').update(newSettings, function(error) {
          if (error) {
            console.log(error);
            reject();
          } else {
            resolve();
          }
        });
      } else {
        reject();
      }
    });
  }

  savePayoutSettings = (leagueId, newPayoutSettings) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/payout-settings').update(newPayoutSettings, function(error) {
        if (error) {
          console.log(error);
          reject();
        } else {
          resolve();
        }
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

  formatServerTimestamp = (timestampInMilliseconds) => {
    let date = new Date(timestampInMilliseconds);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    var period;

    if (hours > 11) {
      period = 'PM';
    } else {
      period = 'AM';
    }

    if (hours > 12) {
      hours -= 12;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    return hours + ':' + minutes + ' ' + period;
  }

  getTournamentStructure = (tournamentId, year) => {
    return new Promise((resolve, reject) => {
      database.ref('/' + tournamentId + '-structure/' + year).once('value').then(structureSnapshot => {
        let tournamentStructure = structureSnapshot.val();
        resolve(tournamentStructure);
      });
    });
  }

  getTourneyTeamsFromTourneyIdAndYear = (tourneyId, year) => {
    return new Promise((resolve, reject) => {
      database.ref('/' + tourneyId + '-teams/' + year).once('value').then(function(snapshot) {
        var teamIds = snapshot.val();
        var availableTeams = [];
        for (var team in teamIds) {
          if (teamIds[team] === true) {
            availableTeams.push(team);
          }
        }

        resolve(availableTeams);
      });
    });
  }

  getTeamNameFromId = (teamId, teamInfoNode) => {
    return new Promise((resolve, reject) => {
      database.ref('/' + teamInfoNode + '-team-info/' + teamId).once('value').then(function(snapshot) {
        var teamName = snapshot.val()['name'];
        
        resolve(teamName);
      });
    });
  }

  getTournamentSeeds = (tournamentId, year, teamId) => {
    return new Promise((resolve, reject) => {
      database.ref('/' + tournamentId + '-seeds/' + year).once('value').then(function(snapshot) {
        var tournamentSeeds = snapshot.val();

        for (var key in tournamentSeeds) {
          if (tournamentSeeds[key] == teamId) {
            resolve(key);
          }
        }
      });
    });
  }

  getTournamentSeedsByTournamentIdAndYear = (tournamentId, year) => {
    return new Promise((resolve, reject) => {
      database.ref('/' + tournamentId + '-seeds/' + year).once('value').then(seedSnapshot => {
        let seedsObj = seedSnapshot.val();

        resolve(seedsObj);
      });
    });
  }

  assignSeedByTeamId = (teamId, sportId, year, seed, region = null) => {
    if (region == null) {
      if (seed < 10) {
        var seedId = 'S0' + seed;
      } else {
        var seedId = 'S' + seed;
      }
    } else {
      if (seed < 10) {
        var seedId = String(region) + '0' + String(seed);
      } else {
        var seedId = String(region) + String(seed);
      }
    }

    var obj = {};
    obj[seedId] = teamId;

    return new Promise((resolve, reject) => {
      database.ref('/' + sportId + '-seeds/' + year + '/').update(obj).then(function() {
        resolve();
      }).catch(function(error) {
        reject(error);
      });
    });
  }

  resetSeedsByTournamentIdAndYear(tournamentId, year) {
    // in the future implement a completion handler.  Might require a rewrite of the components that call this function
    database.ref('/' + tournamentId + '-seeds/' + year + '/').once('value').then(snapshot => {
      snapshot.forEach(child => {
        const childKey = child.key;
        const seedUpdate = {};
        seedUpdate[childKey] = 0;

        database.ref('/' + tournamentId + '-seeds/' + year).update(seedUpdate);
      });
    });
  }

  getTournamentsList = () => {
    return new Promise((resolve, reject) => {
      database.ref('/tournaments/').once('value').then(function(snapshot) {
        var tournaments = snapshot.val();

        resolve(tournaments);
      });
    });
  }

  getTournamentGamesByTournamentId = (tournamentId, year) => {
    return new Promise((resolve, reject) => {
      database.ref('/' + tournamentId + '-structure/' + year).once('value').then(function(snapshot) {
        var gamesObj = snapshot.val();


        resolve(gamesObj);
      });
    });
  }

  updateScoresByTournamentIdAndYear = (tournamentId, year, gameId, newScoreObj) => {
    let path = '/' + tournamentId + '-structure/' + year + '/' + gameId + '/';

    return new Promise((resolve, reject) => {
      // change to transaction
      database.ref(path).update(newScoreObj).then(function() {
        resolve();
      });
    });
  }
}

export default DataService;