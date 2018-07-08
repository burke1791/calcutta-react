import React, { Component } from 'react';
import './auctionMain.css';
import AuctionTeam from '../auctionTeam/auctionTeam';
import AuctionBid from '../auctionBid/auctionBid';
import AuctionItemHistory from '../auctionItemHistory/auctionItemHistory';
import AuctionAdmin from '../auctionAdmin/auctionAdmin';

import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';
import NotificationService, { NOTIF_AUCTION_CHANGE } from '../../../services/notification-service';

let ds = new DataService();
let ns = new NotificationService();
let authService = new AuthenticationService();

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

    console.log('in-progress: ' + this.state.auctionStarted);
    console.log('current Item: ' + this.state.currentItem['current-bid']);
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
    var uid = authService.getUser() != null ? authService.getUser().uid : null;

    if (uid != null && uid === this.state.owner) {
      return (
        <AuctionAdmin auctionStarted={this.state.auctionStarted} leagueId={this.state.leagueId} />
      );
    } else {
      return (
        <div className='normal-header' >
          <h4>**NEED STANDARD HEADER**</h4>
        </div>
      );
    }
  }

  render() {
    console.log('owner: ' + this.state.owner);

    return (
      <div className='container'>
        <div className='container auction-header'>
          {this.generateAuctionHeader()}
        </div>
        <div className='container auction-main'>
          <div className='row'>
            <AuctionTeam currentItem={this.state.currentItem} leagueId={this.state.leagueId} /> 
            <AuctionBid leagueId={this.state.leagueId} />
          </div>
          <div className='row'>
            <AuctionItemHistory leagueId={this.state.leagueId} />
          </div>
        </div>
      </div>
      
    );
  }
}
 
export default AuctionMain;