import React, { Component } from 'react';
import './membersTable.css';
import { withRouter } from 'react-router-dom';
import LeagueRow from '../leagueRow/leagueRow';
import MembersRow from '../membersRow/membersRow';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();
let authService = new AuthenticationService();

class MembersTable extends Component {
  // TODO: add logic to automatically redirect
  // TODO: HUGE REFACTOR to improve the logic for loading table data

  constructor(props) {
    super(props);

    this.state = {
      memberRanks: [],
      members: {},
      users: {},
      isAuthenticated: this.props.isAuthenticated,
      usersDownloaded: false,
      leagueId: this.props.match.params.id,
      uid: '',
      prizePool: {}
    };

    // Bind functions
    this.loadMembers = this.loadMembers.bind(this);
    this.calculateBuyIn = this.calculateBuyIn.bind(this);
    this.membersList = this.membersList.bind(this);
    this.clearTable = this.clearTable.bind(this);
    this.loadUsers = this.loadUsers.bind(this);
    this.userAuthenticated = this.userAuthenticated.bind(this);
  }

  componentDidMount() {
    // Shouldn't have a signin observer becasue this page shouldn't be accessed unless you're signed in
    ns.addObserver(NOTIF_SIGNIN, this, this.userAuthenticated);
    ns.addObserver(NOTIF_SIGNOUT, this, this.clearTable);

    // won't fire if not authenticated
    if (this.state.isAuthenticated) {
      this.loadUsers();
      var self = this;
      ds.getTotalPrizePoolByLeagueId(this.props.match.params.id).then(prizePool => {
        self.setState({prizePool: prizePool});
      }, function(error) {
        console.log(error);
      });
    }
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  userAuthenticated(uid) {
    this.setState({
      isAuthenticated: true,
      uid: uid
    });
    this.loadUsers();
  }

  loadUsers() {
    // TODO: move to DataService
    var self = this;
    var users = {};

    if (this.state.isAuthenticated) {
      ds.getDataSnapshot('/users').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var id = childSnapshot.key;
          var username = childSnapshot.child('username').val();
          users[id] = username;
        });
        self.setState({
          users: users,
          usersDownloaded: true
        });
        // Horrible place for this function call - will need a major refactor later on
        self.loadMembers();
      });
    }
  }

  loadMembers() {
    if (this.state.usersDownloaded) {
      var uid = authService.getUser() != null ? authService.getUser().uid : null;
      var self = this;
      var thisMembers = {};
      var memberRanks = [];

      if (uid != null) { 
        ds.getLeagueUserInfo(this.state.leagueId, uid).then(function(members) {
          thisMembers = members;
          var uids = Object.keys(thisMembers);

          for (var i = 0; i < uids.length; i++) {
            for (var mem in thisMembers) {
              if (thisMembers[mem]['rank'] === i + 1) {
                memberRanks.push(mem);
              }
            }
          }

          self.setState({
            members: thisMembers,
            memberRanks: memberRanks
          });
        });
      }
    }
  }

  clearTable() {
    this.setState({members: []});
  }

  calculateBuyIn = (uid) => {
    var buyIn = 0;
    
    if (this.state.prizePool['use-tax'] !== undefined) {
      if (this.state.prizePool.bids[uid] !== undefined && this.state.prizePool['use-tax'][uid] !== undefined) {
        buyIn = this.state.prizePool.bids[uid] + this.state.prizePool['use-tax'][uid];
      } else if (this.state.prizePool.bids[uid] !== undefined) {
        buyIn = this.state.prizePool.bids[uid];
      }
    } else if (this.state.prizePool.bids !== undefined) {
      if (this.state.prizePool.bids[uid] !== undefined) {
        buyIn = this.state.prizePool.bids[uid];
      }
    } else {
      buyIn = this.state.members[uid].buyIn;
    }
    return buyIn;
  }

  membersList = () => {
    // TODO: write logic to display them in order of rank
    var numMembers = this.state.memberRanks.length;
    var useTaxFlag = this.state.prizePool['use-tax'] !== undefined ? true : false;
    if (numMembers > 0) {
      const list = this.state.memberRanks.map((mem, index) => {
        var buyInVal = this.calculateBuyIn(mem);
        var payoutVal = this.state.members[mem].payout;
        var netReturnVal = payoutVal - buyInVal;

        var buyIn = ds.formatMoney(buyInVal);
        var payout = ds.formatMoney(payoutVal);
        var netReturn = ds.formatMoney(netReturnVal);

        var netReturnNegativeClass = this.state.members[mem].netReturn < 0 ? 'col col-md-2 text-danger' : 'col col-md-2';

        return (
          // TODO: Create a MemberRow component that has a "rank" column
          <MembersRow key={mem} id={mem} uid={authService.getUser().uid} rank={this.state.members[mem].rank} name={this.state.users[mem]} buyIn={buyIn} payout={payout} netReturn={netReturn} netReturnClass={netReturnNegativeClass} />
        );
      });
      return (list);
    }
  }

  render() {
    return (
      <div className='members-table'>
        <table className={this.props.className}>
          <thead>
            <tr className='d-flex'>
              <th className='col col-md-2'>Rank</th>
              <th className='col col-md-4'>Name</th>
              <th className='col col-md-2'>Buy In</th>
              <th className='col col-md-2'>Current Payout</th>
              <th className='col col-md-2'>Net Return</th>
            </tr>
          </thead>
          <tbody>
            {this.membersList()}
          </tbody>
        </table>
      </div>
    );
  }

}

export default withRouter(MembersTable);