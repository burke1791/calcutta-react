import React, { Component } from 'react';
import './auctionTeam.css';
import AuctionClock from '../auctionClock/auctionClock';

class AuctionTeam extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentBid: 'Bid: $0',
      currentWinner: 'High Bid: '
    }

    this.generatePotInfo = this.generatePotInfo.bind(this);
  }

  generatePotInfo() { 
    // fetch auction history from database
    
  }

  render() {
    return (
      <div className='card auction-team'>
        <h3>{this.props.teamName}</h3>
        <h5>{this.state.currentBid}</h5>
        <div className='auction-clock'>
          <AuctionClock  interval={20} />
        </div>
        <h5>{this.state.currentWinner}</h5>
        <hr />
        <div>
          {this.generatePotInfo()}
        </div>
      </div>
    );
  }
}

export default AuctionTeam;