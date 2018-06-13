import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import './leagueTable.css';
import LeagueRow from '../leagueRow/leagueRow';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT, NOTIF_LEAGUE_CREATED, NOTIF_LEAGUE_JOINED } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let authService = new AuthenticationService();
let ds = new DataService();

class LeagueTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      leagues: [],
      tableDataSource: this.props.tableSource // Can be one of three values: 'in-progress', 'complete', or 'pending'
    }

    // Bind functions
    this.loadLeagues = this.loadLeagues.bind(this);
    this.leagueList = this.leagueList.bind(this);
    this.clearTables = this.clearTables.bind(this);
    this.getUserLeagueSummary = this.getUserLeagueSummary.bind(this);
    this.formatMoney = this.formatMoney.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_SIGNIN, this, this.loadLeagues);
    ns.addObserver(NOTIF_SIGNOUT, this, this.clearTables);
    ns.addObserver(NOTIF_LEAGUE_CREATED, this, this.loadLeagues);
    ns.addObserver(NOTIF_LEAGUE_JOINED, this, this.loadLeagues);

    // TODO: figure out how to call loadLeagues() upon rerender without a notification
    // The below works only because on the first load, the auth service is slower in loggin in
    if (authService.getUser() != null) {
      this.loadLeagues(); 
    }
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
    ns.removeObserver(this, NOTIF_LEAGUE_CREATED);
    ns.removeObserver(this, NOTIF_LEAGUE_JOINED);
  }

  loadLeagues() {
    // TODO: move this to DataService (maybe)

    var self = this;
    var sourceData = this.state.tableDataSource; // Determines which leagues to fetch from the database
    var user = authService.getUser();
    var uid = user.uid;
    var leagues = [];

    ds.getDataSnapshot('/leagues').then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var id = childSnapshot.key;
        var league = childSnapshot.val();
        league['key'] = id;
        var members = childSnapshot.child('members').val();
        var leagueStatus = childSnapshot.child('status').val();

        if (members[uid] && leagueStatus == self.state.tableDataSource) {
          leagues.push(league);
        }
      });
      self.setState({leagues: leagues});
      console.log('loadLeagues updated state');
    });
  }

  clearTables() {
    this.setState({leagues: []});
  }

  getUserLeagueSummary = (league) => {
    var user = authService.getUser();
    var uid = user.uid;
    var buyIn = 0;
    var payout = 0;
    var netReturn = 0;

    var teams = (league.teams != null ? league.teams : []);

    for (const [key, value] of Object.entries(teams)) {
      if (value.owner == uid) {
        buyIn += value.price;
        payout += value.return;
      }
    }

    netReturn = payout - buyIn;

    return [buyIn, payout, netReturn];
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

  leagueList = () => {
    if (this.state.leagues.length) {
      const list = this.state.leagues.map((league) => {
        var buyIn = this.formatMoney(this.getUserLeagueSummary(league)[0]);
        var payout = this.formatMoney(this.getUserLeagueSummary(league)[1]);
        var netReturn = this.formatMoney(this.getUserLeagueSummary(league)[2]);
  
        var netReturnNegativeClass = this.getUserLeagueSummary(league)[2] < 0 ? 'col col-md-2 text-danger' : 'col col-md-2';
  
        return (
            <LeagueRow id={league.key} key={league.key} name={league.name} buyIn={buyIn} payout={payout} netReturn={netReturn} netReturnClass={netReturnNegativeClass} />
        );
        
      });

      return (list);
    } else {
      var userSignedIn = authService.getUser() != null;
      var tableText = userSignedIn ? '**Create or Join a League**' : '**Please Log In to View Your Leagues**';
      return (
        <tr className='d-flex'>
          <td className='col-md' colSpan='4'>{tableText}</td>
        </tr>
      );
    }
  }
  
  render() {
    return(
      <div className='row justify-content-md-center'>
        <table className={this.props.className}>
          <thead>
            <tr className='d-flex'>
              <th className='col col-md-6'>League Name</th>
              <th className='col col-md-2'>Buy In</th>
              <th className='col col-md-2'>Current Payout</th>
              <th className='col col-md-2'>Net Return</th>
            </tr>
          </thead>
          <tbody>
            {this.leagueList()}
          </tbody>
        </table>
      </div>
    );
  }
}

export default withRouter(LeagueTable);