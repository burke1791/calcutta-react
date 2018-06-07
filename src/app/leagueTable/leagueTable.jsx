import React, { Component } from 'react';
import './leagueTable.css';
import LeagueRow from '../leagueRow/leagueRow';
import { auth, database } from '../../services/fire';

class LeagueTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      leagues: []
    }

    // Bind functions
    this.loadLeagues = this.loadLeagues.bind(this);
  }

  loadLeagues = () => {
    var self = this;
    var uid = auth.currentUser.uid;
    var leagues = [];
    console.log('loadLeagues uid: ' + uid);
    database.ref('/leagues/').once('value').then(function(snapshot) {
      console.log('snapshot keys: ' + Object.keys(snapshot.val()));
      snapshot.forEach(function(childSnapshot) {
        var league = childSnapshot.val();
        console.log(league);
        if (uid == childSnapshot.uid) {
          leagues.push(league);
        }
      });
      self.setState({leagues: leagues});
    });
  }

  leagueList = () => {
    const list = this.state.leagues.map((league) => {
      <div className='' key={league.id}>
        
      </div>
    });
  }
  
  render() {
    return(
      <div className='table-info'>
        <button onClick={this.loadLeagues} />
        <table className={this.props.className}>
          <thead>
          
          </thead>
          <tbody>

          </tbody>
        </table>
      </div>
    );
  }
}

export default LeagueTable;