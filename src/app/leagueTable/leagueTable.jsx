import React, { Component } from 'react';
import './leagueTable.css';
import LeagueRow from '../leagueRow/leagueRow';
import { auth, database } from '../../services/fire';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT } from '../../services/notification-service';

let ns = new NotificationService();

class LeagueTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      leagues: []
    }

    // Bind functions
    this.loadLeagues = this.loadLeagues.bind(this);
    this.leagueList = this.leagueList.bind(this);
    this.clearTables = this.clearTables.bind(this);
    this.getUserLeagueSummary = this.getUserLeagueSummary.bind(this);
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
    var uid = auth.currentUser.uid;
    var leagues = [];
    database.ref('/leagues/').once('value').then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var league = childSnapshot.val();
        var members = childSnapshot.child('members').val();

        if (members[uid]) {
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

  leagueList = () => {
    // tr data will eventually be the <LeagueRow /> component - or perhaps not..?
    // and will need to provide a "key" for each "league" in the "leagues" array
    const list = this.state.leagues.map((league) =>
      <tr>
        <td className='col col-md-4'>{league.name}</td>
        <td className='col col-md-2'>{this.getUserLeagueSummary(league)[0]}</td>
        <td className='col col-md-2'>{this.getUserLeagueSummary(league)[1]}</td>
        <td className='col col-md-2'>{this.getUserLeagueSummary(league)[2]}</td>
      </tr>
    );

    return (list);
  }
  
  render() {
    return(
      <div className='row justify-content-md-center'>
        <button onClick={this.loadLeagues} />
        <table className={this.props.className}>
          <thead>
            <tr>
              <th className='col col-md-4'>League Name</th>
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