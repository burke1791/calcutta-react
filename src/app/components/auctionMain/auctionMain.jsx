import React, { Component } from 'react';
import './auctionMain.css';
import AuctionTeam from '../auctionTeam/auctionTeam';
import AuctionBid from '../auctionBid/auctionBid';
import AuctionItemHistory from '../auctionItemHistory/auctionItemHistory';
import AuctionAdmin from '../auctionAdmin/auctionAdmin';

import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';

let ds = new DataService();
let authService = new AuthenticationService();

class AuctionMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
      teams: [],
      owner: ''
    }

    // Bind functions
    this.fetchTeams = this.fetchTeams.bind(this);
    this.getLeagueOwner = this.getLeagueOwner.bind(this);
  }

  componentDidMount() {
    this.fetchTeams();
    this.getLeagueOwner();
  }

  fetchTeams() {
    
  }

  getLeagueOwner() {
    var self = this;

    ds.getLeagueOwner(this.props.match.params.id).then(function(owner) {
      self.setState({owner: owner});
    }); 
  }

  generateAuctionHeader = () => {
    var uid = authService.getUser() != null ? authService.getUser().uid : null;

    if (uid != null && uid === this.state.owner) {
      return (
        <AuctionAdmin />
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
            <AuctionTeam teamName='Stl. Cardinals' /> 
            <AuctionBid leagueId={this.props.match.params.id} />
          </div>
          <div className='row'>
            <AuctionItemHistory />
          </div>
        </div>
      </div>
      
    );
  }
}

export default AuctionMain;