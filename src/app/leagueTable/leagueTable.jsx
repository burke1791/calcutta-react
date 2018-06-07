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

  leagueList = () => {
    // tr data will eventually be the <LeagueRow /> component
    const list = this.state.leagues.map((league) =>
      <tr>
        <td>{league.name}</td>
        <td>$0.00</td>
        <td>$0.00</td>
        <td>$0.00</td>
      </tr>
    );

    return (list);
  }
  
  render() {
    return(
      <div className='table-info'>
        <button onClick={this.loadLeagues} />
        <table className={this.props.className}>
          <thead>
            <tr>
              <td>League Name</td>
              <td>Buy In</td>
              <td>Current Payout</td>
              <td>Net Return</td>
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