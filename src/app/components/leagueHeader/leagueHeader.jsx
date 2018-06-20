import React, { Component } from 'react';
import './leagueHeader.css';
import DataService from '../../../services/data-service';

let ds = new DataService();

class LeagueHeader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      leagueName: ''
    }

    this.getLeagueName = this.getLeagueName.bind(this);
  }

  componentWillMount() {
    this.getLeagueName();
  }

  getLeagueName = () => {
    var self = this;

    ds.getLeagueName(this.props.leagueId).then(function(leagueName) {
      self.setState({leagueName: leagueName});
    });
  }

  render() {
    return (
      <div className='league-header'>
        <h1>{this.state.leagueName}</h1>
      </div>
    );
  }
}

export default LeagueHeader;