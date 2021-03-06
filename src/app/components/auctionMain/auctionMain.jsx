import React, { Component } from 'react';
import './auctionMain.css';
import AuctionTeam from '../auctionTeam/auctionTeam';
import AuctionBid from '../auctionBid/auctionBid';
import AuctionItemHistory from '../auctionItemHistory/auctionItemHistory';
import AuctionAdmin from '../auctionAdmin/auctionAdmin';
import AuctionChat from '../auctionChat/auctionChat';
import ResultsTable from '../resultsTable/resultsTable';
import TotalsTable from '../totalsTable/totalsTable';

import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';
import NotificationService, { NOTIF_AUCTION_CHANGE } from '../../../services/notification-service';

let ds = new DataService();
let ns = new NotificationService();
let authService = new AuthenticationService();

// don't need this variable
let auctionListener = null;

class AuctionMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
      teams: [],
      owner: '',
      leagueId: this.props.match.params.id,
      currentItem: null,
      auctionStarted: false
    }

    // Bind functions
    this.fetchTeams = this.fetchTeams.bind(this);
    this.getLeagueOwner = this.getLeagueOwner.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
  }

  componentDidMount() {
    this.fetchTeams();
    this.getLeagueOwner();

    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);

    ds.attachAuctionListener(this.state.leagueId);
  }

  componentWillUnmount() {
    ds.detatchAuctionListener(this.state.leagueId);

    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
  }

  newAuctionData(newData) {
    this.setState({
      currentItem: newData['current-item'],
      auctionStarted: newData['in-progress']
    });
  }

  fetchTeams() {
    
  }

  getLeagueOwner() {
    var self = this;

    ds.getLeagueOwner(this.state.leagueId).then(function(owner) {
      self.setState({owner: owner});
    }); 
  }

  generateAuctionHeader = () => {
    // TODO: Add auth observer and use a state variable for the uid
    // pass uid variable to sub components
    var uid = authService.getUser() != null ? authService.getUser().uid : null;

    if (uid != null && uid === this.state.owner) {
      return (
        <AuctionAdmin auctionStarted={this.state.auctionStarted} leagueId={this.state.leagueId} />
      );
    } else {
      return (
        <div className='normal-header' >
          <h4>Auction Room</h4>
        </div>
      );
    }
  }

  render() {
    var uid = authService.getUser() != null ? authService.getUser().uid : null;

    return (
      <div className='container'>
        <div className='auction-header'>
          <div className='row justify-content-md-center'>
            {this.generateAuctionHeader()}
          </div>
        </div> 
        <div className='auction-main'>
          <div className='row justify-content-md-center'>
            <AuctionTeam currentItem={this.state.currentItem} leagueId={this.state.leagueId} /> 
            <AuctionBid leagueId={this.state.leagueId} />
          </div>
        </div>
        <div className='row justify-content-md-center'>
          <div className='col col-md-6'>
            <div className='card m-2'>
              <AuctionChat leagueId={this.state.leagueId} uid={uid} />
            </div>
          </div>
          <div className='col col-md-6'>
            <div className='card m-2'>
              <AuctionItemHistory className='table table-striped table-hover table-sm' leagueId={this.state.leagueId} />
            </div>
          </div>
        </div>
        <div className='container card my-4'>
          <ResultsTable leagueId={this.state.leagueId} resultType='team' />
        </div>
        <div className='container card my-4'>
          <ResultsTable leagueId={this.state.leagueId} resultType='user' myAuthObj={authService.getUser()} />
        </div>
      </div>
      
    );
  }
}
 
export default AuctionMain;