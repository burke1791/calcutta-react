import React, { Component } from 'react';
import './auctionMain.css';
import AuctionTeam from '../auctionTeam/auctionTeam';
import AuctionBid from '../auctionBid/auctionBid';
import AuctionItemHistory from '../auctionItemHistory/auctionItemHistory';

class AuctionMain extends Component {
  constructor(props) {
    super(props);

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