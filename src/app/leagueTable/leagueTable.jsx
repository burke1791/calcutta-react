import React, { Component } from 'react';
import './leagueTable.css';
import { auth, database } from '../../services/fire';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT } from '../../services/notification-service';

let ns = new NotificationService();

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

  componentWillMount() {
    ns.addObserver(NOTIF_SIGNIN, this, this.loadLeagues);
    ns.addObserver(NOTIF_SIGNOUT, this, this.clearTables);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  loadLeagues() {
    console.log('loadLeagues called');
    var self = this;
    var sourceData = this.state.tableDataSource; // Determines which leagues to fetch from the database
    var uid = auth.currentUser.uid;
    var leagues = [];
    database.ref('/leagues/').once('value').then(function(snapshot) {
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
    });
  }

  clearTables() {
    this.setState({leagues: []});
  }

  getUserLeagueSummary = (league) => {
    var uid = auth.currentUser.uid;
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
    // will need to provide a "key" for each "league" in the "leagues" array
    if (this.state.leagues.length) {
      const list = this.state.leagues.map((league) => {
        var buyIn = this.formatMoney(this.getUserLeagueSummary(league)[0]);
        var payout = this.formatMoney(this.getUserLeagueSummary(league)[1]);
        var netReturn = this.formatMoney(this.getUserLeagueSummary(league)[2]);
  
        var netReturnNegativeClass = this.getUserLeagueSummary(league)[2] < 0 ? ' text-danger' : '';
  
        return (
          <tr className='d-flex' key={league.key}>
            <td className='col col-md-6'>{league.name}</td>
            <td className='col col-md-2'>{this.formatMoney(this.getUserLeagueSummary(league)[0])}</td>
            <td className='col col-md-2'>{this.formatMoney(this.getUserLeagueSummary(league)[1])}</td>
            <td className={'col col-md-2' + netReturnNegativeClass}>{this.formatMoney(this.getUserLeagueSummary(league)[2])}</td>
          </tr>
        );
        
      });

      return (list);
    } else {
      var tableText = auth.currentUser != null ? '**Create or Join a League**' : '**Please Log In to View Your Leagues**';
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

export default LeagueTable;