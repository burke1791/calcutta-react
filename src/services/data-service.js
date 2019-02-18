import NotificationService, { 
  NOTIF_LEAGUE_JOINED, 
  NOTIF_LEAGUE_CREATED, 
  NOTIF_AUCTION_CHANGE, 
  NOTIF_AUCTION_NEW_MESSAGE,
  NOTIF_AUCTION_ITEM_SOLD,
  NOTIF_AUCTION_TOTAL_UPDATED
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

  isAdmin = (uid) => {
    return new Promise((resolve, reject) => {
      database.ref('/admins/' + uid).once('value').then(function(snapshot) {
        if (snapshot.val()) {
          resolve(true);
        } else {
          resolve(false);
        }
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
  }

  auctionItemComplete(leagueId) {
    database.ref('/auctions/' + leagueId + '/current-item').update({
      'complete': true
    });
  }

  getTotalPrizePoolByLeagueId(leagueId, uid) {
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
    } else {
      database.ref('/auctions/' + leagueId).update(freshAuction);
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
    database.ref('/leagues/' + key + '/members').update({
      [uid]: true
    }, function(error) {
      if (error) {
        console.log('joinLeague error: ' + error);
      } else {
        console.log('league joined notification posted');
        ns.postNotification(NOTIF_LEAGUE_JOINED, uid);
      }
    });
  }

  createLeague(uid, leagueName, leaguePassword, leagueSportCode, infoNode = '') {
    // TODO: add completion handler

    let league = {
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
        'tax-rate': 0
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
      database.ref('/leagues/' + leagueId + '/sport').once('value').then(function(snapshot) {
        var sportCode = snapshot.val();
        database.ref('/sports/' + sportCode).once('value').then(function(snapshot) {
          var teams = snapshot.val();
          database.ref('/leagues/' + leagueId + '/teams').set(teams);
          self.endAuction(leagueId, true);
          resolve();
        });
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

        reject();
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
      },
      "cbb-mens-team-info": {
        "1437": {
          "name": "Villanova",
          "conf": {
            "2018": "Big East"
          },
          "location": "",
          "conf-record": {
            "2018": "17-4"
          },
          "ovr-record": {
            "2018": "30-4"
          }
        },
        "1458": {
          "name": "Wisconsin",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "Madison, WI",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1268": {
          "name": "Maryland",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1278": {
          "name": "Minnesota",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1234": {
          "name": "Iowa",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1231": {
          "name": "Indiana",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "Bloomington, IN",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1304": {
          "name": "Nebraska",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "Lincoln, NE",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1228": {
          "name": "Illinois",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "Champaign, IL",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1336": {
          "name": "Penn St",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1353": {
          "name": "Rutgers",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1321": {
          "name": "Northwestern",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "Evanston, IL",
          "conf-record": {
            "2019": "0-0"
          },
          "ovr-record": {
            "2019": "0-0"
          }
        },
        "1345": {
          "name": "Purdue",
          "conf": {
            "2018": "Big Ten",
            "2019": "Big Ten"
          },
          "location": "West Lafayette, IN",
          "conf-record": {
            "2018": "17-4"
          },
          "ovr-record": {
            "2018": "28-6"
          }
        },
        "1403": {
          "name": "Texas Tech",
          "conf": {
            "2018": "Big 12"
          },
          "location": "",
          "conf-record": {
            "2018": "12-8"
          },
          "ovr-record": {
            "2018": "24-9"
          }
        },
        "1455": {
          "name": "Wichita St",
          "conf": {
            "2018": "American Athletic"
          },
          "location": "",
          "conf-record": {
            "2018": "15-5"
          },
          "ovr-record": {
            "2018": "25-7"
          }
        },
        "1452": {
          "name": "West Virginia",
          "conf": {
            "2018": "Big 12"
          },
          "location": "",
          "conf-record": {
            "2018": "13-8"
          },
          "ovr-record": {
            "2018": "24-10"
          }
        },
        "1196": {
          "name": "Florida",
          "conf": {
            "2018": "SEC"
          },
          "location": "",
          "conf-record": {
            "2018": "11-8"
          },
          "ovr-record": {
            "2018": "20-12"
          }
        },
        "1116": {
          "name": "Arkansas",
          "conf": {
            "2018": "SEC"
          },
          "location": "",
          "conf-record": {
            "2018": "12-9"
          },
          "ovr-record": {
            "2018": "23-11"
          }
        },
        "1439": {
          "name": "Virginia Tech",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "10-9"
          },
          "ovr-record": {
            "2018": "21-11"
          }
        },
        "1104": {
          "name": "Alabama",
          "conf": {
            "2018": "SEC"
          },
          "location": "",
          "conf-record": {
            "2018": "10-11"
          },
          "ovr-record": {
            "2018": "19-15"
          }
        },
        "1139": {
          "name": "Butler",
          "conf": {
            "2018": "Big East"
          },
          "location": "",
          "conf-record": {
            "2018": "10-10"
          },
          "ovr-record": {
            "2018": "20-13"
          }
        },
        "1382": {
          "name": "St Bonaventure",
          "conf": {
            "2018": "Atlantic 10"
          },
          "location": "",
          "conf-record": {
            "2018": "15-5"
          },
          "ovr-record": {
            "2018": "25-7"
          }
        },
        "1417": {
          "name": "UCLA",
          "conf": {
            "2018": "Pac-12"
          },
          "location": "",
          "conf-record": {
            "2018": "12-8"
          },
          "ovr-record": {
            "2018": "21-11"
          }
        },
        "1293": {
          "name": "Murray St",
          "conf": {
            "2018": "Ohio Valley Conference"
          },
          "location": "",
          "conf-record": {
            "2018": "18-2"
          },
          "ovr-record": {
            "2018": "24-5"
          }
        },
        "1267": {
          "name": "Marshall",
          "conf": {
            "2018": "Conference USA"
          },
          "location": "",
          "conf-record": {
            "2018": "15-6"
          },
          "ovr-record": {
            "2018": "23-10"
          }
        },
        "1372": {
          "name": "SF Austin",
          "conf": {
            "2018": "Southland Conference"
          },
          "location": "",
          "conf-record": {
            "2018": "17-4"
          },
          "ovr-record": {
            "2018": "24-6"
          }
        },
        "1168": {
          "name": "CS Fullerton",
          "conf": {
            "2018": "Big West"
          },
          "location": "",
          "conf-record": {
            "2018": "13-6"
          },
          "ovr-record": {
            "2018": "18-11"
          }
        },
        "1254": {
          "name": "Long Island",
          "conf": {
            "2018": "Northeast Conference"
          },
          "location": "",
          "conf-record": {
            "2018": "13-8"
          },
          "ovr-record": {
            "2018": "17-16"
          }
        },
        "1347": {
          "name": "Radford",
          "conf": {
            "2018": "Big South"
          },
          "location": "",
          "conf-record": {
            "2018": "15-6"
          },
          "ovr-record": {
            "2018": "20-12"
          }
        },
        "1242": {
          "name": "Kansas",
          "conf": {
            "2018": "Big 12"
          },
          "location": "",
          "conf-record": {
            "2018": "16-5"
          },
          "ovr-record": {
            "2018": "27-7"
          }
        },
        "1181": {
          "name": "Duke",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "14-6"
          },
          "ovr-record": {
            "2018": "26-7"
          }
        },
        "1277": {
          "name": "Michigan St",
          "conf": {
            "2018": "Big Ten"
          },
          "location": "",
          "conf-record": {
            "2018": "17-3"
          },
          "ovr-record": {
            "2018": "29-4"
          }
        },
        "1120": {
          "name": "Auburn",
          "conf": {
            "2018": "SEC"
          },
          "location": "",
          "conf-record": {
            "2018": "13-6"
          },
          "ovr-record": {
            "2018": "25-7"
          }
        },
        "1155": {
          "name": "Clemson",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "12-8"
          },
          "ovr-record": {
            "2018": "23-9"
          }
        },
        "1395": {
          "name": "TCU",
          "conf": {
            "2018": "Big 12"
          },
          "location": "",
          "conf-record": {
            "2018": "9-10"
          },
          "ovr-record": {
            "2018": "21-11"
          }
        },
        "1348": {
          "name": "Rhode Island",
          "conf": {
            "2018": "Atlantic 10"
          },
          "location": "",
          "conf-record": {
            "2018": "17-4"
          },
          "ovr-record": {
            "2018": "25-7"
          }
        },
        "1371": {
          "name": "Seton Hall",
          "conf": {
            "2018": "Big East"
          },
          "location": "",
          "conf-record": {
            "2018": "10-9"
          },
          "ovr-record": {
            "2018": "21-11"
          }
        },
        "1301": {
          "name": "NC State",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "11-8"
          },
          "ovr-record": {
            "2018": "21-11"
          }
        },
        "1328": {
          "name": "Oklahoma",
          "conf": {
            "2018": "Big 12"
          },
          "location": "",
          "conf-record": {
            "2018": "8-11"
          },
          "ovr-record": {
            "2018": "18-13"
          }
        },
        "1113": {
          "name": "Arizona St",
          "conf": {
            "2018": "Pac-12"
          },
          "location": "",
          "conf-record": {
            "2018": "8-11"
          },
          "ovr-record": {
            "2018": "20-11"
          }
        },
        "1393": {
          "name": "Syracuse",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "9-11"
          },
          "ovr-record": {
            "2018": "20-13"
          }
        },
        "1308": {
          "name": "New Mexico St",
          "conf": {
            "2018": "Western Athletic"
          },
          "location": "",
          "conf-record": {
            "2018": "15-2"
          },
          "ovr-record": {
            "2018": "25-5"
          }
        },
        "1158": {
          "name": "Col Charleston",
          "conf": {
            "2018": "Colonial Athletic Association"
          },
          "location": "",
          "conf-record": {
            "2018": "17-4"
          },
          "ovr-record": {
            "2018": "24-7"
          }
        },
        "1137": {
          "name": "Bucknell",
          "conf": {
            "2018": "Patriot League"
          },
          "location": "",
          "conf-record": {
            "2018": "19-2"
          },
          "ovr-record": {
            "2018": "25-9"
          }
        },
        "1233": {
          "name": "Iona",
          "conf": {
            "2018": "Metro Atlantic Athletic"
          },
          "location": "",
          "conf-record": {
            "2018": "14-7"
          },
          "ovr-record": {
            "2018": "20-13"
          }
        },
        "1335": {
          "name": "Penn",
          "conf": {
            "2018": "Ivy League"
          },
          "location": "",
          "conf-record": {
            "2018": "14-2"
          },
          "ovr-record": {
            "2018": "23-8"
          }
        },
        "1438": {
          "name": "Virginia",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "20-1"
          },
          "ovr-record": {
            "2018": "31-2"
          }
        },
        "1153": {
          "name": "Cincinnati",
          "conf": {
            "2018": "American Athletic"
          },
          "location": "",
          "conf-record": {
            "2018": "19-2"
          },
          "ovr-record": {
            "2018": "30-4"
          }
        },
        "1397": {
          "name": "Tennessee",
          "conf": {
            "2018": "SEC"
          },
          "location": "",
          "conf-record": {
            "2018": "15-6"
          },
          "ovr-record": {
            "2018": "25-8"
          }
        },
        "1112": {
          "name": "Arizona",
          "conf": {
            "2018": "Pac-12"
          },
          "location": "",
          "conf-record": {
            "2018": "17-4"
          },
          "ovr-record": {
            "2018": "27-7"
          }
        },
        "1246": {
          "name": "Kentucky",
          "conf": {
            "2018": "SEC"
          },
          "location": "",
          "conf-record": {
            "2018": "13-8"
          },
          "ovr-record": {
            "2018": "24-10"
          }
        },
        "1274": {
          "name": "Miami FL",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "11-8"
          },
          "ovr-record": {
            "2018": "22-9"
          }
        },
        "1305": {
          "name": "Nevada",
          "conf": {
            "2018": "Mountain West"
          },
          "location": "",
          "conf-record": {
            "2018": "16-4"
          },
          "ovr-record": {
            "2018": "27-7"
          }
        },
        "1166": {
          "name": "Creighton",
          "conf": {
            "2018": "Big East"
          },
          "location": "",
          "conf-record": {
            "2018": "10-9"
          },
          "ovr-record": {
            "2018": "20-11"
          }
        },
        "1243": {
          "name": "Kansas St",
          "conf": {
            "2018": "Big 12"
          },
          "location": "",
          "conf-record": {
            "2018": "11-9"
          },
          "ovr-record": {
            "2018": "22-11"
          }
        },
        "1400": {
          "name": "Texas",
          "conf": {
            "2018": "Big 12"
          },
          "location": "",
          "conf-record": {
            "2018": "9-11"
          },
          "ovr-record": {
            "2018": "19-14"
          }
        },
        "1260": {
          "name": "Loyola-Chicago",
          "conf": {
            "2018": "Missouri Valley"
          },
          "location": "",
          "conf-record": {
            "2018": "18-3"
          },
          "ovr-record": {
            "2018": "27-5"
          }
        },
        "1172": {
          "name": "Davidson",
          "conf": {
            "2018": "Atlantic 10"
          },
          "location": "",
          "conf-record": {
            "2018": "16-5"
          },
          "ovr-record": {
            "2018": "21-11"
          }
        },
        "1138": {
          "name": "Buffalo",
          "conf": {
            "2018": "Mid-American"
          },
          "location": "",
          "conf-record": {
            "2018": "18-3"
          },
          "ovr-record": {
            "2018": "25-8"
          }
        },
        "1460": {
          "name": "Wright St",
          "conf": {
            "2018": "Horizon League"
          },
          "location": "",
          "conf-record": {
            "2018": "17-4"
          },
          "ovr-record": {
            "2018": "23-9"
          }
        },
        "1209": {
          "name": "Georgia St",
          "conf": {
            "2018": "Sun Belt"
          },
          "location": "",
          "conf-record": {
            "2018": "15-6"
          },
          "ovr-record": {
            "2018": "22-10"
          }
        },
        "1420": {
          "name": "UMBC",
          "conf": {
            "2018": "America East"
          },
          "location": "",
          "conf-record": {
            "2018": "15-4"
          },
          "ovr-record": {
            "2018": "21-10"
          }
        },
        "1462": {
          "name": "Xavier",
          "conf": {
            "2018": "Big East"
          },
          "location": "",
          "conf-record": {
            "2018": "16-4"
          },
          "ovr-record": {
            "2018": "28-5"
          }
        },
        "1314": {
          "name": "North Carolina",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "14-8"
          },
          "ovr-record": {
            "2018": "25-10"
          }
        },
        "1276": {
          "name": "Michigan",
          "conf": {
            "2018": "Big Ten"
          },
          "location": "",
          "conf-record": {
            "2018": "17-5"
          },
          "ovr-record": {
            "2018": "27-7"
          }
        },
        "1211": {
          "name": "Gonzaga",
          "conf": {
            "2018": "West Coast Conference"
          },
          "location": "",
          "conf-record": {
            "2018": "20-1"
          },
          "ovr-record": {
            "2018": "30-4"
          }
        },
        "1326": {
          "name": "Ohio St",
          "conf": {
            "2018": "Big Ten"
          },
          "location": "",
          "conf-record": {
            "2018": "15-4"
          },
          "ovr-record": {
            "2018": "24-8"
          }
        },
        "1222": {
          "name": "Houston",
          "conf": {
            "2018": "American Athletic"
          },
          "location": "",
          "conf-record": {
            "2018": "16-5"
          },
          "ovr-record": {
            "2018": "26-7"
          }
        },
        "1401": {
          "name": "Texas A&M",
          "conf": {
            "2018": "SEC"
          },
          "location": "",
          "conf-record": {
            "2018": "9-10"
          },
          "ovr-record": {
            "2018": "20-12"
          }
        },
        "1281": {
          "name": "Missouri",
          "conf": {
            "2018": "SEC"
          },
          "location": "",
          "conf-record": {
            "2018": "10-9"
          },
          "ovr-record": {
            "2018": "19-12"
          }
        },
        "1199": {
          "name": "Florida St",
          "conf": {
            "2018": "Atlantic Coast"
          },
          "location": "",
          "conf-record": {
            "2018": "9-10"
          },
          "ovr-record": {
            "2018": "20-11"
          }
        },
        "1344": {
          "name": "Providence",
          "conf": {
            "2018": "Big East"
          },
          "location": "",
          "conf-record": {
            "2018": "12-9"
          },
          "ovr-record": {
            "2018": "21-13"
          }
        },
        "1361": {
          "name": "San Diego St",
          "conf": {
            "2018": "Mountain West"
          },
          "location": "",
          "conf-record": {
            "2018": "14-7"
          },
          "ovr-record": {
            "2018": "21-10"
          }
        },
        "1355": {
          "name": "S Dakota St",
          "conf": {
            "2018": "Summit League"
          },
          "location": "",
          "conf-record": {
            "2018": "16-1"
          },
          "ovr-record": {
            "2018": "24-6"
          }
        },
        "1422": {
          "name": "UNC Greensboro",
          "conf": {
            "2018": "Southern Conference"
          },
          "location": "",
          "conf-record": {
            "2018": "18-3"
          },
          "ovr-record": {
            "2018": "24-7"
          }
        },
        "1285": {
          "name": "Montana",
          "conf": {
            "2018": "Big Sky"
          },
          "location": "",
          "conf-record": {
            "2018": "19-2"
          },
          "ovr-record": {
            "2018": "24-7"
          }
        },
        "1252": {
          "name": "Lipscomb",
          "conf": {
            "2018": "Atlantic Sun"
          },
          "location": "",
          "conf-record": {
            "2018": "13-4"
          },
          "ovr-record": {
            "2018": "20-9"
          }
        },
        "1300": {
          "name": "NC Central",
          "conf": {
            "2018": "Mid-Eastern Athletic"
          },
          "location": "",
          "conf-record": {
            "2018": "13-7"
          },
          "ovr-record": {
            "2018": "16-15"
          }
        },
        "1411": {
          "name": "TX Southern",
          "conf": {
            "2018": "Southwest Athletic"
          },
          "location": "",
          "conf-record": {
            "2018": "15-6"
          },
          "ovr-record": {
            "2018": "15-19"
          }
        }
      },
      "cbb-mens-team-ids": {
        "Michigan": 1276,
        "Michigan St": 1277,
        "Purdue": 1345,
        "Wisconsin": 1458,
        "Maryland": 1268,
        "Minnesota": 1278,
        "Iowa": 1234,
        "Ohio St": 1326,
        "Indiana": 1231,
        "Rutgers": 1353,
        "Northwestern": 1321,
        "Nebraska": 1304,
        "Illinois": 1228,
        "Penn St": 1336
      },
      "tournaments": {
        "mens-btt-2019": {
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

    database.ref('/').update(btt_2019);

    // database.ref('/sports/' + node_id + '/').update(sportObj);
  }
}

export default DataService;