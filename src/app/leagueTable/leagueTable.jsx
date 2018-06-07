import React, { Component } from 'react';
import './leagueTable.css';
import LeagueRow from '../leagueRow/leagueRow';

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
    const list = this.state.leagues.map((league) => {
      <div className='' key={league.id}>
        
      </div>
    });
  }
  
  render() {
    return(
      <div className='table-info'>
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