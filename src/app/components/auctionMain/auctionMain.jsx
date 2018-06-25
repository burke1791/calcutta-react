import React, { Component } from 'react';
import './auctionMain.css';
import AuctionTeam from '../auctionTeam/auctionTeam';
import AuctionBid from '../auctionBid/auctionBid';
import AuctionItemHistory from '../auctionItemHistory/auctionItemHistory';

import DataService from '../../../services/data-service';

let ds = new DataService();

class AuctionMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
      teams: []
    }

    // Bind functions
    this.fetchTeams = this.fetchTeams.bind(this);
  }

  componentDidMount() {
    this.fetchTeams();
  }

  fetchTeams() {
    
  }

  render() {
    return (
      <div className='container auction-main'>
        <div className='row'>
          <AuctionTeam teamName='Stl. Cardinals' /> 
          <AuctionBid leagueId={this.props.match.params.id} />
        </div>
        <div className='row'>
          <AuctionItemHistory />
        </div>
      </div>
    );
  }
}

export default AuctionMain;