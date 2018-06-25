import React, { Component } from 'react';
import './auctionMain.css';
import AuctionTeam from '../auctionTeam/auctionTeam';

class AuctionMain extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='container auction-main'>
        <AuctionTeam teamName='Stl. Cardinals' /> 
        { /* AuctionBidActions component */ }
        { /* ItemBidHistory component */ }
      </div>
    );
  }
}

export default AuctionMain;