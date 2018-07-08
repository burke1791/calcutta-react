import React, { Component } from 'react';
import './teamTable.css';
import { withRouter } from 'react-router-dom';
import TeamRow from '../teamRow/teamRow';

import DataService from '../../../services/data-service';

let ds = new DataService();

class TeamTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      teams: {},
      teamKeys: [],
      leagueId: this.props.match.params.id,
      uid: this.props.match.params.uid
    }

    // bind functions
    this.loadTeams = this.loadTeams.bind(this);
    this.teamList = this.teamList.bind(this);
  }

  componentDidMount() {
    // TODO: add auth checks
    this.loadTeams();
  }

  loadTeams() {
    var self = this;

    ds.getUserTeams(this.state.leagueId, this.state.uid).then(function(userTeams) {
      var teamKeys = [];
      var teams = {};

      console.log('userTeams: ' + userTeams);

      if (userTeams != null) {
        teamKeys = Object.keys(userTeams);
        teams = userTeams;

        self.setState({
          teams: teams,
          teamKeys: teamKeys
        });

      }
    });
  }

  teamList = () => {
    if (this.state.teamKeys.length) {
      const list = this.state.teamKeys.map((team) => {
        var name = this.state.teams[team].name;
        var price = ds.formatMoney(this.state.teams[team].price);
        var payout = ds.formatMoney(this.state.teams[team].payout);
        var netReturn = ds.formatMoney(this.state.teams[team].netReturn);

        var netReturnNegativeClass = this.state.teams[team].netReturn < 0 ? 'col col-md-2 text-danger' : 'col col-md-2';

        return (
          <TeamRow key={team} id={team} name={name} price={price} payout={payout} netReturn={netReturn} netReturnClass={netReturnNegativeClass} />
        );
      });

      return (list);
    }
  }

  render() {
    return (
      <div className='row justify-content-md-center'>
        <table className={this.props.className}>
          <thead>
            <tr className='d-flex'>
              <th className='col col-md-6'>Team Name</th>
              <th className='col col-md-2'>Price</th>
              <th className='col col-md-2'>Current Payout</th>
              <th className='col col-md-2'>Net Return</th>
            </tr>
          </thead>
          <tbody>
            {this.teamList()}
          </tbody>
        </table>
      </div>
    );
  }
}

export default withRouter(TeamTable);