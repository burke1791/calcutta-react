import React, { Component } from 'react';
import './resultsTable.css';
import ResultsRow from '../resultsRow/resultsRow';

import NotificationService, { NOTIF_AUCTION_ITEM_SOLD, NOTIF_AUCTION_TOTAL_UPDATED } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class ResultsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      teams: {},
      teamKeys: [],
      teamNames: {},
      teamNamesDownloaded: false,
      participants: [],
      users: {},
      usersDownloaded: false,
      prizePool: {}
    }

    // bind functions
    this.fetchUsers = this.fetchUsers.bind(this);
    this.fetchParticipants = this.fetchParticipants.bind(this);
    this.fetchTeamNames = this.fetchTeamNames.bind(this);
    this.newItemSold = this.newItemSold.bind(this);
    this.auctionTotalUpdated = this.auctionTotalUpdated.bind(this);
    this.generateResultsRows = this.generateResultsRows.bind(this);
  }

  componentDidMount() {
    ds.attachLeagueBiddingListener(this.props.leagueId);
    ns.addObserver(NOTIF_AUCTION_ITEM_SOLD, this, this.newItemSold);
    ns.addObserver(NOTIF_AUCTION_TOTAL_UPDATED, this, this.auctionTotalUpdated);

    this.fetchUsers();
    this.fetchParticipants();
  }

  componentWillUnmount() {
    ds.detatchLeagueBiddingListener(this.props.leagueId);
    ns.removeObserver(this, NOTIF_AUCTION_ITEM_SOLD);
    ns.removeObserver(this, NOTIF_AUCTION_TOTAL_UPDATED);
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
      var uids = participants;
      self.setState({
        participants: uids
      });
    });
  }

  fetchTeamNames() {
    // Potential suggestion is to add the team name to firebase the first time they are downloaded for any user, then subsequent users would have a shorter load time...
    if (this.props.resultType === 'team' && this.state.teamKeys.length) {
      var self = this;
      let teamIds = this.state.teamKeys;
      ds.getDataSnapshot('/leagues/' + this.props.leagueId + '/sport').then(sportCode => {
        ds.getAllTeamNamesInLeagueById(teamIds, sportCode.val()).then(teamNames => {
          self.setState(prevState => ({
            teamNames: teamNames,
            teamNamesDownloaded: true
          }));
        });
      });
    }
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

  auctionTotalUpdated(prizePool) {
    this.setState({prizePool: prizePool});
  }

  generateResultsHeader = (resultType) => {
    if (resultType === 'team') {
      return (
        <tr className='d-flex orange'>
          <th className='col col-md-1'>#</th>
          <th className='col col-md-4'>Name</th>
          <th className='col col-md-4'>Winner</th>
          <th className='col col-md-3'>Selling Price</th>
        </tr>
      );
    } else if (resultType === 'user') {
      return (
        <tr className='d-flex orange'>
          <th className='col col-md-6'>Name</th>
          <th className='col col-md-6'>Total</th>
        </tr>
      );
    }
  }

  generateResultsRows = (resultType) => {
    var numTeams = this.state.teamKeys.length;
    if (resultType === 'team') {
      if (numTeams > 0) {
        const list = this.state.teamKeys.map((key, index) => {
          var num = index + 1;
          var uid = this.state.teams[key]['owner'];
          
          if (uid === '(unclaimed)') {
            var winner = '(unclaimed)';
          } else {
            var winner = this.state.users[uid] !== null ? this.state.users[uid] : ' '
          }
          
          var teamName;
          if (this.state.teams[key]['seed-value'] !== undefined) {
            teamName = '(' + this.state.teams[key]['seed-value'] + ') ' + this.state.teams[key]['name'];
          } else {
            teamName = this.state.teams[key]['name'];
          }

          var sellingPrice = this.state.teams[key]['price'] > 0 ? '$ ' + this.state.teams[key]['price'] : ' ';

          var colored = sellingPrice !== ' ' ? true : false;
          var unclaimed = winner === '(unclaimed)' ? true : false;
  
          return (
            <ResultsRow resultType={this.props.resultType} colored={colored} unclaimed={unclaimed} num={num} name={teamName} winner={winner} sellingPrice={sellingPrice} id={key} key={key} />
          ); 
        });
        return (list);
      }
    } else if (resultType === 'user') {
      if (numTeams > 0) {
        const list = this.state.participants.map((key, index) => {
          // key is the user's uid
          var num = index + 1;
          var username = this.state.users[key];
          var totalBids;
          var totalTax;

          if (this.state.prizePool !== {}) {
            if (this.state.prizePool['use-tax'] !== undefined) {
              if (this.state.prizePool['use-tax'][key] !== undefined && this.state.prizePool.bids[key] !== undefined) {
                totalBids = this.state.prizePool.bids[key];
                totalTax = this.state.prizePool['use-tax'][key];
              } else if (this.state.prizePool.bids[key] !== undefined) {
                totalBids = this.state.prizePool.bids[key];
                totalTax = 0;
              } else {
                totalBids = 0;
                totalTax = 0;
              }
            } else if (this.state.prizePool.bids !== undefined) {
              totalTax = 0;
              if (this.state.prizePool.bids[key] !== undefined) {
                totalBids = this.state.prizePool.bids[key];
              } else {
                totalBids = 0;
              }
            }
          } else {
            totalBids = 0;
            totalTax = 0;
            for (var team in this.state.teams) {
              if (key === this.state.teams[team]['owner']) {
                totalBids += this.state.teams[team]['price'];
              }
            }
          }

          var totalTaxString = 'n/a';
          if (totalTax !== 0) {
            totalTaxString = ds.formatMoney(totalTax);
          }
          var totalBidString = ds.formatMoney(totalBids);

          return (
            <ResultsRow resultType={this.props.resultType} num={num} username={username} totalBids={totalBidString} totalTax={totalTaxString} id={key} key={key} />
          )
        });
        return (list);
      }
    }
  }

  render() {
    return (
      <div className='row justify-content-md-center'>
        <table className='table table-sm'>
          <thead>
            {this.generateResultsHeader(this.props.resultType)}
          </thead>
          <tbody>
            {this.generateResultsRows(this.props.resultType)}
          </tbody>
        </table>
      </div>
    );
  }
}

export default ResultsTable;