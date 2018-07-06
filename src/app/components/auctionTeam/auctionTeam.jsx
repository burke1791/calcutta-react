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

  componentDidMount() {
    // attach listener to auction node in firebase
  }

  generatePotInfo() { 
    // fetch auction history from database
    
  }

  render() {
    if (this.props.currentItem == null) {
      return (
        <div className='card auction-team'>
          <h3>...</h3>
          <h5>Bid:</h5>
          <div className='auction-clock'>
            <AuctionClock  interval={20} />
          </div>
          <h5>Current Winner:</h5>
          <hr />
          <div>
            {this.generatePotInfo()}
          </div>
        </div>
      );
    } else {
      return (
        <div className='card auction-team'>
          <h3>{this.props.currentItem['name']}</h3>
          <h5>{'Bid: $' + this.props.currentItem['current-bid']}</h5>
          <div className='auction-clock'>
            <AuctionClock  interval={20} />
          </div>
          <h5>{'High Bid: ' + this.props.currentItem['current-winner']}</h5>
          <hr />
          <div>
            {this.generatePotInfo()}
          </div>
        </div>
      );
    }
  }
}

export default AuctionTeam;