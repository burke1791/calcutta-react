import React, { Component } from 'react';
import './resultsTable.css';
import ResultsRow from '../resultsRow/resultsRow';

import NotificationService, { NOTIF_AUCTION_ITEM_SOLD } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class ResultsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      teams: {},
      teamKeys: [],
      participants: [],
      users: {},
      usersDownloaded: false
    }

    // bind functions
    this.fetchUsers = this.fetchUsers.bind(this);
    this.fetchParticipants = this.fetchParticipants.bind(this);
    this.newItemSold = this.newItemSold.bind(this);
    this.generateResultsRows = this.generateResultsRows.bind(this);
  }

  componentDidMount() {
    ds.attachLeagueBiddingListener(this.props.leagueId);
    ns.addObserver(NOTIF_AUCTION_ITEM_SOLD, this, this.newItemSold);

    this.fetchUsers();
  }

  componentWillUnmount() {
    ds.detatchLeagueBiddingListener(this.props.leagueId);
    ns.removeObserver(this, NOTIF_AUCTION_ITEM_SOLD);
  }

  fetchUsers() {
    var self = this;
    var users = {};

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
    });
  }

  fetchParticipants() {
    var self = this;

    ds.getLeagueParticipants(this.props.leagueId).then(function(participants) {
      var uids = Object.keys(participants);
      self.setState({
        participants: uids
      });
    });
  }

  newItemSold(newData) {
    if (newData !== null) {
      var teams = newData;
      var keys = Object.keys(newData);

      this.setState({
        teams: teams,
        teamKeys: keys
      });
    }
  }

  generateResultsRows = () => {
    var numTeams = this.state.teamKeys.length;
    if (numTeams > 0) {
      const list = this.state.teamKeys.map((key, index) => {
        var num = index + 1;
        var uid = this.state.teams[key]['owner'];
        var winner = this.state.users[uid] !== null ? this.state.users[uid] : ' '
        var teamName = this.state.teams[key]['name'];
        var sellingPrice = this.state.teams[key]['price'] > 0 ? '$ ' + this.state.teams[key]['price'] : ' '

        return (
          <ResultsRow num={num} name={teamName} winner={winner} sellingPrice={sellingPrice} id={key} key={key} />
        );
      });
      return (list);
    }
  }

  render() {
    return (
      <div className='row justify-content-md-center'>
        <table className='table table-striped table-hover'>
          <thead>
            <tr className='d-flex'>
              <th className='col col-md-1'>#</th>
              <th className='col col-md-4'>Name</th>
              <th className='col col-md-4'>Winner</th>
              <th className='col col-md-3'>Selling Price</th>
            </tr>
          </thead>
          <tbody>
            {this.generateResultsRows()}
          </tbody>
        </table>
      </div>
    );
  }
}

export default ResultsTable;