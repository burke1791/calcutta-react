import React, { Component } from 'react';
import './membersTable.css';
import { withRouter } from 'react-router-dom';
import LeagueRow from '../leagueRow/leagueRow';
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
      members: {},
      users: {},
      isAuthenticated: this.props.isAuthenticated,
      usersDownloaded: false,
      leagueId: this.props.match.params.id
    };

    // Bind functions
    this.loadMembers = this.loadMembers.bind(this);
    this.membersList = this.membersList.bind(this);
    this.clearTable = this.clearTable.bind(this);
    this.formatMoney = this.formatMoney.bind(this);
    this.loadUsers = this.loadUsers.bind(this);
    this.userAuthenticated = this.userAuthenticated.bind(this);
  }

  componentDidMount() {
    // Shouldn't have a signin observer becasue this page should be accessed unless you're signed in
    ns.addObserver(NOTIF_SIGNIN, this, this.userAuthenticated);
    ns.addObserver(NOTIF_SIGNOUT, this, this.clearTable);

    // won't fire if not authenticated
    if (this.state.isAuthenticated) {
      this.loadUsers();
    }
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  userAuthenticated() {
    this.setState({isAuthenticated: true});
    this.loadUsers();
  }

  loadUsers() {
    // TODO: move to DataService
    console.log('loadUsers() called');
    console.log('this.state.isAuthenticated: ' + this.state.isAuthenticated);
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
    console.log('loadMembers() called');
    if (this.state.usersDownloaded) {
      var uid = authService.getUser() != null ? authService.getUser().uid : null;
      var self = this;
      var members = {};

      if (uid != null) {
        ds.getLeagueInfo(this.state.leagueId, uid).then(function(league) {
          var members = league.child('members').val();
          var teams = league.val().teams;

          for (var mem in members) {
            var member = {
              buyIn: 0,
              payout: 0,
              netReturn: 0
            }

            var buyIn = 0;
            var payout = 0;

            if (members[mem]) {
              for (var team in teams) {
                if (teams[team].owner === mem) {
                  buyIn += teams[team].price;
                  payout += teams[team].return;
                }
              }
              member.buyIn = buyIn;
              member.payout = payout;
              member.netReturn = payout - buyIn;

              members[mem] = member;
            }
          }

          self.setState({members: members});
        });
      }
    }
  }

  clearTable() {
    this.setState({members: []});
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

  membersList = () => {
    if (Object.keys(this.state.members).length > 0) {
      const list = Object.keys(this.state.members).map((member) => {
        var buyIn = this.formatMoney(this.state.members[member].buyIn);
        var payout = this.formatMoney(this.state.members[member].payout);
        var netReturn = this.formatMoney(this.state.members[member].netReturn);
  
        var netReturnNegativeClass = this.state.members[member].netReturn < 0 ? 'col col-md-2 text-danger' : 'col col-md-2';
  
        return (
          // TODO: Create a MemberRow component that has a "rank" column
          <LeagueRow key={member} id={member} name={this.state.users[member]} buyIn={buyIn} payout={payout} netReturn={netReturn} netReturnClass={netReturnNegativeClass} />
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
              <th className='col col-md-6'>Name</th>
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