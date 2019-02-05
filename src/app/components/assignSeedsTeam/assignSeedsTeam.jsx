import React, { Component } from 'react';
import './assignSeedsTeam.css';

import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_ASSIGN_SEEDS } from '../../../services/notification-service';

let ds = new DataService();
let ns = new NotificationService();

class AssignSeedsTeam extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      assignSeedRequested: false,
      assignSeedSucceeded: false
    }

    // bind functions
    this.onSeedChanged = this.onSeedChanged.bind(this);
    this.getTeamName = this.getTeamName.bind(this);
    this.getSeedValue = this.getSeedValue.bind(this);
    this.assignSeeds = this.assignSeeds.bind(this);
  }

  componentDidMount() {
    this.getTeamName();
    this.getSeedValue();

    ns.addObserver(NOTIF_ASSIGN_SEEDS, this, this.assignSeeds);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_ASSIGN_SEEDS);
  }

  onSeedChanged(event) {
    this.props.onSeedChange(this.props.teamId, event.target.value);
  }

  getTeamName() {
    var self = this;
    ds.getTeamNameFromId(this.props.teamId, this.props.teamInfoNode).then(function(teamName) {
      self.setState({name: teamName});
    });
  }

  getSeedValue() {
    var self = this;
    
    ds.getTournamentSeeds(this.props.sportId, this.props.year, this.props.teamId).then(function(snapshot) {
      var seed = snapshot.match(/[0-9]{1,}/g);
      seed = Number(seed);

      self.props.onSeedChange(self.props.teamId, seed);
    });
  }

  assignSeeds() {
    var self = this;

    this.setState({assignSeedRequested: true});

    ds.assignSeedByTeamId(this.props.teamId, this.props.sportId, this.props.year, this.props.seed).then(function() {
      self.setState({assignSeedSucceeded: true});
    });
  }

  render() {
    var inputColorClass = '';

    if (this.state.assignSeedSucceeded) {
      inputColorClass = 'bg-success';
    } else if (this.state.assignSeedRequested) {
      inputColorClass = 'bg-warning';
    }

    return (
      <div className='row'>
        <div className='col-2'>
          <label>{this.state.name}</label>
        </div>
        <div className='col-2'>
          <input type='number' value={this.props.seed} className={inputColorClass} onChange={this.onSeedChanged} />
        </div>
      </div>
    );
  }
}

export default AssignSeedsTeam;