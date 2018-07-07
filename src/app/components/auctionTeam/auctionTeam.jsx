import React, { Component } from 'react';
import './auctionTeam.css';
import AuctionClock from '../auctionClock/auctionClock';
import NotificationService, { NOTIF_AUCTION_CHANGE } from '../../../services/notification-service';

let ns = new NotificationService();

class AuctionTeam extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentBid: 'Bid: $0',
      currentWinner: 'High Bid: ',
    }

    this.generatePotInfo = this.generatePotInfo.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
    // attach listener to auction node in firebase
  }

  generatePotInfo() { 
    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
    // fetch auction history from database
    
  }

  newAuctionData(newData) {
    var currentBid = newData['current-item']['current-bid'];
    var currentWinner = newData['current-item']['current-winner'];

    this.setState({
      currentBid: 'Bid: $' + currentBid,
      currentWinner: 'High Bid: ' + currentWinner
    });
  }

  render() {
    if (this.props.currentItem == null) {
      return (
        <div className='card auction-team'>
          <h3>...</h3>
          <h5>Bid:</h5>
          <div className='auction-clock'>
            <AuctionClock  interval={20} currentBid={this.state.currentBid} />
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
            <AuctionClock  interval={20} currentBid={this.state.currentBid} />
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