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
        console.log('premission denied');
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

  getLeagueSportCode = (leagueId) => {
    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/sport').once('value').then(sportCodeSnapshot => {
        let sportCode = sportCodeSnapshot.val();
        resolve(sportCode);
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
        } else {
          resolve();
        }
        
      });
    });
  }

  loadNextItem = (teamCode, leagueId, interval = 15) => {
    var name;

    return new Promise((resolve, reject) => {
      database.ref('/leagues/' + leagueId + '/teams/' + teamCode).once('value').then(function(snapshot) {
        if (snapshot.child('seed-value').exists()) {
          name = '(' + snapshot.child('seed-value').val() + ') ' + snapshot.child('name').val();
        } else {
          name = snapshot.child('name').val();
        }

        let endTime = fireDatabase.ServerValue.TIMESTAMP;

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
      // default payout settings
      'payout-settings': {
        'R1': 0.02,
        'R2': 0.04,
        'R3': 0.08,
        'R4': 0.12,
        'R5': 0.2,
        'upset': 0.02,
        'loss': 0.02
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
      
      let teamsObj = {};
      let pushId;

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
    /*
    newScoreObj = {
      "score": {
        "team1": *score*,
        "team2": *score*,
        "num-ot": *#*
      }
    }
    if any of the above object properties are absent, then they will not be updated in firebase
    */

    /*
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
    */

    let path = '/' + tournamentId + '-structure/' + year + '/' + gameId + '/';

    return new Promise((resolve, reject) => {
      // change to transaction
      database.ref(path).update(newScoreObj).then(function() {
        resolve();
      });
    });
  }

  addSportToDatabase(node_id, sportObj) {
    // add winner field to each game node
    var march_madness_2018 = {
      "march-madness-regions": {
        "2018": {
          "W": "East",
          "X": "Midwest",
          "Y": "South",
          "Z": "West"
        }
      },
      "march-madness-tourney-structure": {
        "2018": {
          "R1W1": {
            "W01": 0,
            "W16": 0,
            "score": {
              "W01": 0,
              "W16": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W1"
          },
          "R1W2": {
            "W02": 0,
            "W15": 0,
            "score": {
              "W02": 0,
              "W15": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W2"
          },
          "R1W3": {
            "W03": 0,
            "W14": 0,
            "score": {
              "W03": 0,
              "W14": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W3"
          },
          "R1W4": {
            "W04": 0,
            "W13": 0,
            "score": {
              "W04": 0,
              "W13": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W4"
          },
          "R1W5": {
            "W05": 0,
            "W12": 0,
            "score": {
              "W05": 0,
              "W12": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W4"
          },
          "R1W6": {
            "W06": 0,
            "W11": 0,
            "score": {
              "W06": 0,
              "W11": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W3"
          },
          "R1W7": {
            "W07": 0,
            "W10": 0,
            "score": {
              "W07": 0,
              "W10": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W2"
          },
          "R1W8": {
            "W08": 0,
            "W09": 0,
            "score": {
              "W08": 0,
              "W09": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W1"
          },
          "R1X1": {
            "X01": 0,
            "X16": 0,
            "score": {
              "X01": 0,
              "X16": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X1"
          },
          "R1X2": {
            "X02": 0,
            "X15": 0,
            "score": {
              "X02": 0,
              "X15": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X2"
          },
          "R1X3": {
            "X03": 0,
            "X14": 0,
            "score": {
              "X03": 0,
              "X14": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X3"
          },
          "R1X4": {
            "X04": 0,
            "X13": 0,
            "score": {
              "X04": 0,
              "X13": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X4"
          },
          "R1X5": {
            "X05": 0,
            "X12": 0,
            "score": {
              "X05": 0,
              "X12": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X4"
          },
          "R1X6": {
            "X06": 0,
            "X11": 0,
            "score": {
              "X06": 0,
              "X11": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X3"
          },
          "R1X7": {
            "X07": 0,
            "X10": 0,
            "score": {
              "X07": 0,
              "X10": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X2"
          },
          "R1X8": {
            "X08": 0,
            "X09": 0,
            "score": {
              "X08": 0,
              "X09": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X1"
          },
          "R1Y1": {
            "Y01": 0,
            "Y16": 0,
            "score": {
              "Y01": 0,
              "Y16": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y1"
          },
          "R1Y2": {
            "Y02": 0,
            "Y15": 0,
            "score": {
              "Y02": 0,
              "Y15": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y2"
          },
          "R1Y3": {
            "Y03": 0,
            "Y14": 0,
            "score": {
              "Y03": 0,
              "Y14": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y3"
          },
          "R1Y4": {
            "Y04": 0,
            "Y13": 0,
            "score": {
              "Y04": 0,
              "Y13": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y4"
          },
          "R1Y5": {
            "Y05": 0,
            "Y12": 0,
            "score": {
              "Y05": 0,
              "Y12": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y4"
          },
          "R1Y6": {
            "Y06": 0,
            "Y11": 0,
            "score": {
              "Y06": 0,
              "Y11": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y3"
          },
          "R1Y7": {
            "Y07": 0,
            "Y10": 0,
            "score": {
              "Y07": 0,
              "Y10": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y2"
          },
          "R1Y8": {
            "Y08": 0,
            "Y09": 0,
            "score": {
              "Y08": 0,
              "Y09": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y1"
          },
          "R1Z1": {
            "Z01": 0,
            "Z16": 0,
            "score": {
              "Z01": 0,
              "Z16": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z1"
          },
          "R1Z2": {
            "Z02": 0,
            "Z15": 0,
            "score": {
              "Z02": 0,
              "Z15": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z2"
          },
          "R1Z3": {
            "Z03": 0,
            "Z14": 0,
            "score": {
              "Z03": 0,
              "Z14": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z3"
          },
          "R1Z4": {
            "Z04": 0,
            "Z13": 0,
            "score": {
              "Z04": 0,
              "Z13": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z4"
          },
          "R1Z5": {
            "Z05": 0,
            "Z12": 0,
            "score": {
              "Z05": 0,
              "Z12": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z4"
          },
          "R1Z6": {
            "Z06": 0,
            "Z11": 0,
            "score": {
              "Z06": 0,
              "Z11": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z3"
          },
          "R1Z7": {
            "Z07": 0,
            "Z10": 0,
            "score": {
              "Z07": 0,
              "Z10": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z2"
          },
          "R1Z8": {
            "Z08": 0,
            "Z09": 0,
            "score": {
              "Z08": 0,
              "Z09": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z1"
          },
          "R2W1": {
            "R1W1": 0,
            "R1W8": 0,
            "score": {
              "R1W1": 0,
              "R1W8": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3W1"
          },
          "R2W2": {
            "R1W2": 0,
            "R1W7": 0,
            "score": {
              "R1W2": 0,
              "R1W7": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3W2"
          },
          "R2W3": {
            "R1W3": 0,
            "R1W6": 0,
            "score": {
              "R1W3": 0,
              "R1W6": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3W2"
          },
          "R2W4": {
            "R1W4": 0,
            "R1W5": 0,
            "score": {
              "R1W4": 0,
              "R1W5": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3W1"
          },
          "R2X1": {
            "R1X1": 0,
            "R1X8": 0,
            "score": {
              "R1X1": 0,
              "R1X8": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3X1"
          },
          "R2X2": {
            "R1X2": 0,
            "R1X7": 0,
            "score": {
              "R1X2": 0,
              "R1X7": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3X2"
          },
          "R2X3": {
            "R1X3": 0,
            "R1X6": 0,
            "score": {
              "R1X3": 0,
              "R1X6": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3X2"
          },
          "R2X4": {
            "R1X4": 0,
            "R1X5": 0,
            "score": {
              "R1X4": 0,
              "R1X5": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3X1"
          },
          "R2Y1": {
            "R1Y1": 0,
            "R1Y8": 0,
            "score": {
              "R1Y1": 0,
              "R1Y8": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Y1"
          },
          "R2Y2": {
            "R1Y2": 0,
            "R1Y7": 0,
            "score": {
              "R1Y2": 0,
              "R1Y7": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Y2"
          },
          "R2Y3": {
            "R1Y3": 0,
            "R1Y6": 0,
            "score": {
              "R1Y3": 0,
              "R1Y6": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Y2"
          },
          "R2Y4": {
            "R1Y4": 0,
            "R1Y5": 0,
            "score": {
              "R1Y4": 0,
              "R1Y5": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Y1"
          },
          "R2Z1": {
            "R1Z1": 0,
            "R1Z8": 0,
            "score": {
              "R1Z1": 0,
              "R1Z8": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Z1"
          },
          "R2Z2": {
            "R1Z2": 0,
            "R1Z7": 0,
            "score": {
              "R1Z2": 0,
              "R1Z7": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Z2"
          },
          "R2Z3": {
            "R1Z3": 0,
            "R1Z6": 0,
            "score": {
              "R1Z3": 0,
              "R1Z6": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Z2"
          },
          "R2Z4": {
            "R1Z4": 0,
            "R1Z5": 0,
            "score": {
              "R1Z4": 0,
              "R1Z5": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Z1"
          },
          "R3W1": {
            "R2W1": 0,
            "R2W4": 0,
            "score": {
              "R2W1": 0,
              "R2W4": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4W1"
          },
          "R3W2": {
            "R2W2": 0,
            "R2W3": 0,
            "score": {
              "R2W2": 0,
              "R2W3": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4W1"
          },
          "R3X1": {
            "R2X1": 0,
            "R2X4": 0,
            "score": {
              "R2X1": 0,
              "R2X4": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4X1"
          },
          "R3X2": {
            "R2X2": 0,
            "R2X3": 0,
            "score": {
              "R2X2": 0,
              "R2X3": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4X1"
          },
          "R3Y1": {
            "R2Y1": 0,
            "R2Y4": 0,
            "score": {
              "R2Y1": 0,
              "R2Y4": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4Y1"
          },
          "R3Y2": {
            "R2Y2": 0,
            "R2Y3": 0,
            "score": {
              "R2Y2": 0,
              "R2Y3": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4Y1"
          },
          "R3Z1": {
            "R2Z1": 0,
            "R2Z4": 0,
            "score": {
              "R2Z1": 0,
              "R2Z4": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4Z1"
          },
          "R3Z2": {
            "R2Z2": 0,
            "R2Z3": 0,
            "score": {
              "R2Z2": 0,
              "R2Z3": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4Z1"
          },
          "R4W1": {
            "R3W1": 0,
            "R3W2": 0,
            "score": {
              "R3W1": 0,
              "R3W2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R5WX"
          },
          "R4X1": {
            "R3X1": 0,
            "R3X2": 0,
            "score": {
              "R3X1": 0,
              "R3X2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R5WX"
          },
          "R4Y1": {
            "R3Y1": 0,
            "R3Y2": 0,
            "score": {
              "R3Y1": 0,
              "R3Y2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R5YZ"
          },
          "R4Z1": {
            "R3Z1": 0,
            "R3Z2": 0,
            "score": {
              "R3Z1": 0,
              "R3Z2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R5YZ"
          },
          "R5WX": {
            "R4W1": 0,
            "R4X1": 0,
            "score": {
              "R4W1": 0,
              "R4X1": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R6CH"
          },
          "R5YZ": {
            "R4Y1": 0,
            "R4Z1": 0,
            "score": {
              "R4Y1": 0,
              "R4Z1": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R6CH"
          },
          "R6CH": {
            "R5WX": 0,
            "R5YZ": 0,
            "score": {
              "R5WX": 0,
              "R5YZ": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "n/a"
          }
        }
      },
      "march-madness-seeds": {
        "2018": {
          "W01": 1437,
          "W02": 1345,
          "W03": 1403,
          "W04": 1455,
          "W05": 1452,
          "W06": 1196,
          "W07": 1116,
          "W08": 1439,
          "W09": 1104,
          "W10": 1139,
          "W11a": 1382,
          "W11b": 1417,
          "W12": 1293,
          "W13": 1267,
          "W14": 1372,
          "W15": 1168,
          "W16a": 1254,
          "W16b": 1347,
          "X01": 1242,
          "X02": 1181,
          "X03": 1277,
          "X04": 1120,
          "X05": 1155,
          "X06": 1395,
          "X07": 1348,
          "X08": 1371,
          "X09": 1301,
          "X10": 1328,
          "X11a": 1113,
          "X11b": 1393,
          "X12": 1308,
          "X13": 1158,
          "X14": 1137,
          "X15": 1233,
          "X16": 1335,
          "Y01": 1438,
          "Y02": 1153,
          "Y03": 1397,
          "Y04": 1112,
          "Y05": 1246,
          "Y06": 1274,
          "Y07": 1305,
          "Y08": 1166,
          "Y09": 1243,
          "Y10": 1400,
          "Y11": 1260,
          "Y12": 1172,
          "Y13": 1138,
          "Y14": 1460,
          "Y15": 1209,
          "Y16": 1420,
          "Z01": 1462,
          "Z02": 1314,
          "Z03": 1276,
          "Z04": 1211,
          "Z05": 1326,
          "Z06": 1222,
          "Z07": 1401,
          "Z08": 1281,
          "Z09": 1199,
          "Z10": 1344,
          "Z11": 1361,
          "Z12": 1355,
          "Z13": 1422,
          "Z14": 1285,
          "Z15": 1252,
          "Z16a": 1300,
          "Z16b": 1411
        }
      }
    }

    var march_madness_2019 = {
      "mm-regions": {
        "2018": {
          "W": "East",
          "X": "Midwest",
          "Y": "South",
          "Z": "West"
        },
        "2019": {
          "W": "",
          "X": "",
          "Y": "",
          "Z": ""
        }
      },
      "mm-seeds": {
        "2018": {
          "W01": 1437,
          "W02": 1345,
          "W03": 1403,
          "W04": 1455,
          "W05": 1452,
          "W06": 1196,
          "W07": 1116,
          "W08": 1439,
          "W09": 1104,
          "W10": 1139,
          "W11a": 1382,
          "W11b": 1417,
          "W12": 1293,
          "W13": 1267,
          "W14": 1372,
          "W15": 1168,
          "W16a": 1254,
          "W16b": 1347,
          "X01": 1242,
          "X02": 1181,
          "X03": 1277,
          "X04": 1120,
          "X05": 1155,
          "X06": 1395,
          "X07": 1348,
          "X08": 1371,
          "X09": 1301,
          "X10": 1328,
          "X11a": 1113,
          "X11b": 1393,
          "X12": 1308,
          "X13": 1158,
          "X14": 1137,
          "X15": 1233,
          "X16": 1335,
          "Y01": 1438,
          "Y02": 1153,
          "Y03": 1397,
          "Y04": 1112,
          "Y05": 1246,
          "Y06": 1274,
          "Y07": 1305,
          "Y08": 1166,
          "Y09": 1243,
          "Y10": 1400,
          "Y11": 1260,
          "Y12": 1172,
          "Y13": 1138,
          "Y14": 1460,
          "Y15": 1209,
          "Y16": 1420,
          "Z01": 1462,
          "Z02": 1314,
          "Z03": 1276,
          "Z04": 1211,
          "Z05": 1326,
          "Z06": 1222,
          "Z07": 1401,
          "Z08": 1281,
          "Z09": 1199,
          "Z10": 1344,
          "Z11": 1361,
          "Z12": 1355,
          "Z13": 1422,
          "Z14": 1285,
          "Z15": 1252,
          "Z16a": 1300,
          "Z16b": 1411
        }
      },
      "mm-structure": {
        "2018": {
          "R1W1": {
            "W01": 0,
            "W16": 0,
            "score": {
              "W01": 0,
              "W16": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W1"
          },
          "R1W2": {
            "W02": 0,
            "W15": 0,
            "score": {
              "W02": 0,
              "W15": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W2"
          },
          "R1W3": {
            "W03": 0,
            "W14": 0,
            "score": {
              "W03": 0,
              "W14": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W3"
          },
          "R1W4": {
            "W04": 0,
            "W13": 0,
            "score": {
              "W04": 0,
              "W13": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W4"
          },
          "R1W5": {
            "W05": 0,
            "W12": 0,
            "score": {
              "W05": 0,
              "W12": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W4"
          },
          "R1W6": {
            "W06": 0,
            "W11": 0,
            "score": {
              "W06": 0,
              "W11": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W3"
          },
          "R1W7": {
            "W07": 0,
            "W10": 0,
            "score": {
              "W07": 0,
              "W10": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W2"
          },
          "R1W8": {
            "W08": 0,
            "W09": 0,
            "score": {
              "W08": 0,
              "W09": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2W1"
          },
          "R1X1": {
            "X01": 0,
            "X16": 0,
            "score": {
              "X01": 0,
              "X16": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X1"
          },
          "R1X2": {
            "X02": 0,
            "X15": 0,
            "score": {
              "X02": 0,
              "X15": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X2"
          },
          "R1X3": {
            "X03": 0,
            "X14": 0,
            "score": {
              "X03": 0,
              "X14": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X3"
          },
          "R1X4": {
            "X04": 0,
            "X13": 0,
            "score": {
              "X04": 0,
              "X13": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X4"
          },
          "R1X5": {
            "X05": 0,
            "X12": 0,
            "score": {
              "X05": 0,
              "X12": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X4"
          },
          "R1X6": {
            "X06": 0,
            "X11": 0,
            "score": {
              "X06": 0,
              "X11": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X3"
          },
          "R1X7": {
            "X07": 0,
            "X10": 0,
            "score": {
              "X07": 0,
              "X10": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X2"
          },
          "R1X8": {
            "X08": 0,
            "X09": 0,
            "score": {
              "X08": 0,
              "X09": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2X1"
          },
          "R1Y1": {
            "Y01": 0,
            "Y16": 0,
            "score": {
              "Y01": 0,
              "Y16": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y1"
          },
          "R1Y2": {
            "Y02": 0,
            "Y15": 0,
            "score": {
              "Y02": 0,
              "Y15": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y2"
          },
          "R1Y3": {
            "Y03": 0,
            "Y14": 0,
            "score": {
              "Y03": 0,
              "Y14": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y3"
          },
          "R1Y4": {
            "Y04": 0,
            "Y13": 0,
            "score": {
              "Y04": 0,
              "Y13": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y4"
          },
          "R1Y5": {
            "Y05": 0,
            "Y12": 0,
            "score": {
              "Y05": 0,
              "Y12": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y4"
          },
          "R1Y6": {
            "Y06": 0,
            "Y11": 0,
            "score": {
              "Y06": 0,
              "Y11": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y3"
          },
          "R1Y7": {
            "Y07": 0,
            "Y10": 0,
            "score": {
              "Y07": 0,
              "Y10": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y2"
          },
          "R1Y8": {
            "Y08": 0,
            "Y09": 0,
            "score": {
              "Y08": 0,
              "Y09": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Y1"
          },
          "R1Z1": {
            "Z01": 0,
            "Z16": 0,
            "score": {
              "Z01": 0,
              "Z16": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z1"
          },
          "R1Z2": {
            "Z02": 0,
            "Z15": 0,
            "score": {
              "Z02": 0,
              "Z15": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z2"
          },
          "R1Z3": {
            "Z03": 0,
            "Z14": 0,
            "score": {
              "Z03": 0,
              "Z14": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z3"
          },
          "R1Z4": {
            "Z04": 0,
            "Z13": 0,
            "score": {
              "Z04": 0,
              "Z13": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z4"
          },
          "R1Z5": {
            "Z05": 0,
            "Z12": 0,
            "score": {
              "Z05": 0,
              "Z12": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z4"
          },
          "R1Z6": {
            "Z06": 0,
            "Z11": 0,
            "score": {
              "Z06": 0,
              "Z11": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z3"
          },
          "R1Z7": {
            "Z07": 0,
            "Z10": 0,
            "score": {
              "Z07": 0,
              "Z10": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z2"
          },
          "R1Z8": {
            "Z08": 0,
            "Z09": 0,
            "score": {
              "Z08": 0,
              "Z09": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R2Z1"
          },
          "R2W1": {
            "R1W1": 0,
            "R1W8": 0,
            "score": {
              "R1W1": 0,
              "R1W8": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3W1"
          },
          "R2W2": {
            "R1W2": 0,
            "R1W7": 0,
            "score": {
              "R1W2": 0,
              "R1W7": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3W2"
          },
          "R2W3": {
            "R1W3": 0,
            "R1W6": 0,
            "score": {
              "R1W3": 0,
              "R1W6": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3W2"
          },
          "R2W4": {
            "R1W4": 0,
            "R1W5": 0,
            "score": {
              "R1W4": 0,
              "R1W5": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3W1"
          },
          "R2X1": {
            "R1X1": 0,
            "R1X8": 0,
            "score": {
              "R1X1": 0,
              "R1X8": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3X1"
          },
          "R2X2": {
            "R1X2": 0,
            "R1X7": 0,
            "score": {
              "R1X2": 0,
              "R1X7": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3X2"
          },
          "R2X3": {
            "R1X3": 0,
            "R1X6": 0,
            "score": {
              "R1X3": 0,
              "R1X6": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3X2"
          },
          "R2X4": {
            "R1X4": 0,
            "R1X5": 0,
            "score": {
              "R1X4": 0,
              "R1X5": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3X1"
          },
          "R2Y1": {
            "R1Y1": 0,
            "R1Y8": 0,
            "score": {
              "R1Y1": 0,
              "R1Y8": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Y1"
          },
          "R2Y2": {
            "R1Y2": 0,
            "R1Y7": 0,
            "score": {
              "R1Y2": 0,
              "R1Y7": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Y2"
          },
          "R2Y3": {
            "R1Y3": 0,
            "R1Y6": 0,
            "score": {
              "R1Y3": 0,
              "R1Y6": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Y2"
          },
          "R2Y4": {
            "R1Y4": 0,
            "R1Y5": 0,
            "score": {
              "R1Y4": 0,
              "R1Y5": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Y1"
          },
          "R2Z1": {
            "R1Z1": 0,
            "R1Z8": 0,
            "score": {
              "R1Z1": 0,
              "R1Z8": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Z1"
          },
          "R2Z2": {
            "R1Z2": 0,
            "R1Z7": 0,
            "score": {
              "R1Z2": 0,
              "R1Z7": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Z2"
          },
          "R2Z3": {
            "R1Z3": 0,
            "R1Z6": 0,
            "score": {
              "R1Z3": 0,
              "R1Z6": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Z2"
          },
          "R2Z4": {
            "R1Z4": 0,
            "R1Z5": 0,
            "score": {
              "R1Z4": 0,
              "R1Z5": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R3Z1"
          },
          "R3W1": {
            "R2W1": 0,
            "R2W4": 0,
            "score": {
              "R2W1": 0,
              "R2W4": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4W1"
          },
          "R3W2": {
            "R2W2": 0,
            "R2W3": 0,
            "score": {
              "R2W2": 0,
              "R2W3": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4W1"
          },
          "R3X1": {
            "R2X1": 0,
            "R2X4": 0,
            "score": {
              "R2X1": 0,
              "R2X4": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4X1"
          },
          "R3X2": {
            "R2X2": 0,
            "R2X3": 0,
            "score": {
              "R2X2": 0,
              "R2X3": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4X1"
          },
          "R3Y1": {
            "R2Y1": 0,
            "R2Y4": 0,
            "score": {
              "R2Y1": 0,
              "R2Y4": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4Y1"
          },
          "R3Y2": {
            "R2Y2": 0,
            "R2Y3": 0,
            "score": {
              "R2Y2": 0,
              "R2Y3": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4Y1"
          },
          "R3Z1": {
            "R2Z1": 0,
            "R2Z4": 0,
            "score": {
              "R2Z1": 0,
              "R2Z4": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4Z1"
          },
          "R3Z2": {
            "R2Z2": 0,
            "R2Z3": 0,
            "score": {
              "R2Z2": 0,
              "R2Z3": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R4Z1"
          },
          "R4W1": {
            "R3W1": 0,
            "R3W2": 0,
            "score": {
              "R3W1": 0,
              "R3W2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R5WX"
          },
          "R4X1": {
            "R3X1": 0,
            "R3X2": 0,
            "score": {
              "R3X1": 0,
              "R3X2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R5WX"
          },
          "R4Y1": {
            "R3Y1": 0,
            "R3Y2": 0,
            "score": {
              "R3Y1": 0,
              "R3Y2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R5YZ"
          },
          "R4Z1": {
            "R3Z1": 0,
            "R3Z2": 0,
            "score": {
              "R3Z1": 0,
              "R3Z2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R5YZ"
          },
          "R5WX": {
            "R4W1": 0,
            "R4X1": 0,
            "score": {
              "R4W1": 0,
              "R4X1": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R6CH"
          },
          "R5YZ": {
            "R4Y1": 0,
            "R4Z1": 0,
            "score": {
              "R4Y1": 0,
              "R4Z1": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "R6CH"
          },
          "R6CH": {
            "R5WX": 0,
            "R5YZ": 0,
            "score": {
              "R5WX": 0,
              "R5YZ": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "date": 0,
            "location": "",
            "next-round": "n/a"
          }
        },
        "2019": {
          "R1W1": {
            "team1": {
              "seed": "W01",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "W16",
              "id": 0,
              "name": ""
            },
            "date": "",
            "location": "",
            "next-round": "R2W1",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R1W2": {

          }
        }
      }
    }

    var march_madness_test = {
      "mm-structure": {
        "1111": {

        }
      },
      "mm-seeds": {
        "2018": {
          "W01": 1437,
          "W02": 1345,
          "W03": 1403,
          "W04": 1455,
          "W05": 1452,
          "W06": 1196,
          "W07": 1116,
          "W08": 1439,
          "W09": 1104,
          "W10": 1139,
          "W11a": 1382,
          "W11b": 1417,
          "W12": 1293,
          "W13": 1267,
          "W14": 1372,
          "W15": 1168,
          "W16a": 1254,
          "W16b": 1347,
          "X01": 1242,
          "X02": 1181,
          "X03": 1277,
          "X04": 1120,
          "X05": 1155,
          "X06": 1395,
          "X07": 1348,
          "X08": 1371,
          "X09": 1301,
          "X10": 1328,
          "X11a": 1113,
          "X11b": 1393,
          "X12": 1308,
          "X13": 1158,
          "X14": 1137,
          "X15": 1233,
          "X16": 1335,
          "Y01": 1438,
          "Y02": 1153,
          "Y03": 1397,
          "Y04": 1112,
          "Y05": 1246,
          "Y06": 1274,
          "Y07": 1305,
          "Y08": 1166,
          "Y09": 1243,
          "Y10": 1400,
          "Y11": 1260,
          "Y12": 1172,
          "Y13": 1138,
          "Y14": 1460,
          "Y15": 1209,
          "Y16": 1420,
          "Z01": 1462,
          "Z02": 1314,
          "Z03": 1276,
          "Z04": 1211,
          "Z05": 1326,
          "Z06": 1222,
          "Z07": 1401,
          "Z08": 1281,
          "Z09": 1199,
          "Z10": 1344,
          "Z11": 1361,
          "Z12": 1355,
          "Z13": 1422,
          "Z14": 1285,
          "Z15": 1252,
          "Z16a": 1300,
          "Z16b": 1411
        },
        "1111": {
        }
      },
      "mm-regions": {
        "2018": {
          "W": "East",
          "X": "Midwest",
          "Y": "South",
          "Z": "West"
        },
        "1111": {
          "W": "East",
          "X": "Midwest",
          "Y": "South",
          "Z": "West"
        }
      }
    }

    // gameId : nextRoundId
    var tourneyMapDict = {
      "R1W1": "R2W1",
      "R1W2": "R2W2",
      "R1W3": "R2W3",
      "R1W4": "R2W4",
      "R1W5": "R2W4",
      "R1W6": "R2W3",
      "R1W7": "R2W2",
      "R1W8": "R2W1",
      "R1X1": "R2X1",
      "R1X2": "R2X2",
      "R1X3": "R2X3",
      "R1X4": "R2X4",
      "R1X5": "R2X4",
      "R1X6": "R2X3",
      "R1X7": "R2X2",
      "R1X8": "R2X1",
      "R1Y1": "R2Y1",
      "R1Y2": "R2Y2",
      "R1Y3": "R2Y3",
      "R1Y4": "R2Y4",
      "R1Y5": "R2Y4",
      "R1Y6": "R2Y3",
      "R1Y7": "R2Y2",
      "R1Y8": "R2Y1",
      "R1Z1": "R2Z1",
      "R1Z2": "R2Z2",
      "R1Z3": "R2Z3",
      "R1Z4": "R2Z4",
      "R1Z5": "R2Z4",
      "R1Z6": "R2Z3",
      "R1Z7": "R2Z2",
      "R1Z8": "R2Z1",
      "R2W1": "R3W1",
      "R2W2": "R3W2",
      "R2W3": "R3W2",
      "R2W4": "R3W1",
      "R2X1": "R3X1",
      "R2X2": "R3X2",
      "R2X3": "R3X2",
      "R2X4": "R3X1",
      "R2Y1": "R3Y1",
      "R2Y2": "R3Y2",
      "R2Y3": "R3Y2",
      "R2Y4": "R3Y1",
      "R2Z1": "R3Z1",
      "R2Z2": "R3Z2",
      "R2Z3": "R3Z2",
      "R2Z4": "R3Z1",
      "R3W1": "R4W1",
      "R3W2": "R4W1",
      "R3X1": "R4X1",
      "R3X2": "R4X1",
      "R3Y1": "R4Y1",
      "R3Y2": "R4Y1",
      "R3Z1": "R4Z1",
      "R3Z2": "R4Z1",
      "R4W1": "R5WX",
      "R4X1": "R5WX",
      "R4Y1": "R5YZ",
      "R4Z1": "R5YZ",
      "R5WX": "R6CH",
      "R5YZ": "R6CH",
      "R6CH": "n/a"
    }

    // gameId : [seeds]
    var seedMapDict = {
      "R1W1": ["W01", "W16"],
      "R1W2": ["W02", "W15"],
      "R1W3": ["W03", "W14"],
      "R1W4": ["W04", "W13"],
      "R1W5": ["W05", "W12"],
      "R1W6": ["W06", "W11"],
      "R1W7": ["W07", "W10"],
      "R1W8": ["W08", "W09"],
      
      "R1X1": ["X01", "X16"],
      "R1X2": ["X02", "X15"],
      "R1X3": ["X03", "X14"],
      "R1X4": ["X04", "X13"],
      "R1X5": ["X05", "X12"],
      "R1X6": ["X06", "X11"],
      "R1X7": ["X07", "X10"],
      "R1X8": ["X08", "X09"],

      "R1Y1": ["Y01", "Y16"],
      "R1Y2": ["Y02", "Y15"],
      "R1Y3": ["Y03", "Y14"],
      "R1Y4": ["Y04", "Y13"],
      "R1Y5": ["Y05", "Y12"],
      "R1Y6": ["Y06", "Y11"],
      "R1Y7": ["Y07", "Y10"],
      "R1Y8": ["Y08", "Y09"],

      "R1Z1": ["Z01", "Z16"],
      "R1Z2": ["Z02", "Z15"],
      "R1Z3": ["Z03", "Z14"],
      "R1Z4": ["Z04", "Z13"],
      "R1Z5": ["Z05", "Z12"],
      "R1Z6": ["Z06", "Z11"],
      "R1Z7": ["Z07", "Z10"],
      "R1Z8": ["Z08", "Z09"],

      "R2W1": ["R1W1", "R1W8"],
      "R2W2": ["R1W2", "R1W7"],
      "R2W3": ["R1W3", "R1W6"],
      "R2W4": ["R1W4", "R1W5"],

      "R2X1": ["R1X1", "R1X8"],
      "R2X2": ["R1X2", "R1X7"],
      "R2X3": ["R1X3", "R1X6"],
      "R2X4": ["R1X4", "R1X5"],

      "R2Y1": ["R1Y1", "R1Y8"],
      "R2Y2": ["R1Y2", "R1Y7"],
      "R2Y3": ["R1Y3", "R1Y6"],
      "R2Y4": ["R1Y4", "R1Y5"],

      "R2Z1": ["R1Z1", "R1Z8"],
      "R2Z2": ["R1Z2", "R1Z7"],
      "R2Z3": ["R1Z3", "R1Z6"],
      "R2Z4": ["R1Z4", "R1Z5"],

      "R3W1": ["R2W1", "R2W4"],
      "R3W2": ["R2W2", "R2W3"],

      "R3X1": ["R2X1", "R2X4"],
      "R3X2": ["R2X2", "R2X3"],

      "R3Y1": ["R2Y1", "R2Y4"],
      "R3Y2": ["R2Y2", "R2Y3"],

      "R3Z1": ["R2Z1", "R2Z4"],
      "R3Z2": ["R2Z2", "R2Z3"],

      "R4W1": ["R3W1", "R3W2"],
      "R4X1": ["R3X1", "R3X2"],
      "R4Y1": ["R3Y1", "R3Y2"],
      "R4Z1": ["R3Z1", "R3Z2"],

      "R5WX": ["R4W1", "R4X1"],
      "R5YZ": ["R4Y1", "R4Z1"],

      "R6CH": ["R5WX", "R5YZ"]
    };

    for (var gameId in tourneyMapDict) {
      var gameObj = {
        "date": "",
        "location": "",
        "next-round": tourneyMapDict[gameId],
        "score": {
          "team1": 0,
          "team2": 0,
          "num-ot": 0
        },
        "status": "not-started",
        "team1": {
          "id": 0,
          "name": "",
          "seed": seedMapDict[gameId][0]
        },
        "team2": {
          "id": 0,
          "name": "",
          "seed": seedMapDict[gameId][1]
        },
        "winner": "n/a"
      };

      march_madness_test['mm-structure']['1111'][gameId] = gameObj;
    }

    console.log(march_madness_test);

    var btt_2019 = {
      "btt-structure": {
        "2019": {
          "R1G1": {
            "team1": {
              "seed": "S12",
              "id": 0,
              "name": ""         
            },
            "team2": {
              "seed": "S13",
              "id": 0,
              "name": ""
            },
            "date": "Wed. March 13, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R2G2",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R1G2": {
            "team1": {
              "seed": "S11",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "S14",
              "id": 0,
              "name": ""
            },
            "date": "Wed. March 13, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R2G4",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R2G1": {
            "team1": {
              "seed": "S08",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "S09",
              "id": 0,
              "name": ""
            },
            "date": "Thurs. March 14, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R3G1",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R2G2": {
            "team1": {
              "seed": "S05",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R1G1",
              "id": 0,
              "name": ""
            },
            "date": "Thurs. March 14, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R3G2",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R2G3": {
            "team1": {
              "seed": "S07",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "S10",
              "id": 0,
              "name": ""
            },
            "date": "Thurs. March 14, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R3G3",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R2G4": {
            "team1": {
              "seed": "S06",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R1G2",
              "id": 0,
              "name": ""
            },
            "date": "Thurs. March 14, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R3G4",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R3G1": {
            "team1": {
              "seed": "S01",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R2G1",
              "id": 0,
              "name": ""
            },
            "date": "Fri. March 15, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R4G1",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R3G2": {
            "team1": {
              "seed": "S04",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R2G2",
              "id": 0,
              "name": ""
            },
            "date": "Fri. March 15, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R4G1",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R3G3": {
            "team1": {
              "seed": "S02",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R2G3",
              "id": 0,
              "name": ""
            },
            "date": "Fri. March 15, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R4G2",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R3G4": {
            "team1": {
              "seed": "S03",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R2G4",
              "id": 0,
              "name": ""
            },
            "date": "Fri. March 15, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R4G2",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R4G1": {
            "team1": {
              "seed": "R3G1",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R3G2",
              "id": 0,
              "name": ""
            },
            "date": "Sat. March 16, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R5CH",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R4G2": {
            "team1": {
              "seed": "R3G3",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R3G4",
              "id": 0,
              "name": ""
            },
            "date": "Sat. March 16, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "R5CH",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          },
          "R5CH": {
            "team1": {
              "seed": "R4G1",
              "id": 0,
              "name": ""
            },
            "team2": {
              "seed": "R4G2",
              "id": 0,
              "name": ""
            },
            "date": "Sun. March 17, 2019",
            "location": "United Center, Chicago, IL",
            "next-round": "n/a",
            "score": {
              "team1": 0,
              "team2": 0,
              "num-ot": 0
            },
            "status": "not-started",
            "winner": "n/a"
          }
        }
      }
    }

    var tournaments = {
      "tournaments": {
        "btt-2019": {
          "name": "2019 Men's Big Ten Tournament",
          "info-node-id": "cbb-mens"
        },
        "mm-2019": {
          "name": "March Madness 2019",
          "info-node-id": "cbb-mens"
        }
      },
      "tournaments-old": {
        "mm-2018": {
          "name": "March Madness 2018",
          "info-node-id": "cbb-mens"
        }
      },
      "btt-teams": {
        "2019": {
          "1276": true,
          "1277": true,
          "1345": true,
          "1458": true,
          "1268": true,
          "1278": true,
          "1234": true,
          "1326": true,
          "1231": true,
          "1353": true,
          "1321": true,
          "1304": true,
          "1228": true,
          "1336": true
        }
      }
    }

    database.ref('/').update(march_madness_test);

  }
}

export default DataService;