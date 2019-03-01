import React, { Component } from 'react';
import './auctionTeam.css';
import AuctionClock from '../auctionClock/auctionClock';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_AUCTION_CHANGE, NOTIF_AUCTION_ITEM_SOLD, NOTIF_SIGNIN, NOTIF_AUCTION_TOTAL_UPDATED } from '../../../services/notification-service';

let authService = new AuthenticationService();
let ds = new DataService();
let ns = new NotificationService();

class AuctionTeam extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentBid: 'Bid: $0',
      currentWinner: 'High Bid: ',
      myBidTotal: 0,
      myTaxTotal: 0,
      auctionTotal: 0,
      uid: '',
      interval: 15
    }

    this.userSignedIn = this.userSignedIn.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
    this.auctionTotalUpdated = this.auctionTotalUpdated.bind(this);
    this.generatePotInfo = this.generatePotInfo.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
    ns.addObserver(NOTIF_AUCTION_TOTAL_UPDATED, this, this.auctionTotalUpdated);
    ns.addObserver(NOTIF_SIGNIN, this, this.userSignedIn);
    
    if (authService.getUser()) {
      this.setState({
        uid: authService.getUser().uid
      });
    }

    ds.attachLeagueTotalsListener(this.props.leagueId);
    var self = this;
    ds.fetchSettings(this.props.leagueId).then(settings => {
      if (settings['auction-interval'] !== undefined) {
        self.setState({interval: settings['auction-interval']});
      }
    });
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
    ns.removeObserver(this, NOTIF_AUCTION_TOTAL_UPDATED);
    ns.removeObserver(this, NOTIF_SIGNIN);

    ds.detatchLeagueTotalsListener(this.props.leagueId);
  }

  userSignedIn() {
    let uid = authService.getUser().uid;

    if (this.state.uid !== uid) {
      this.setState({
        uid: uid
      });
    }
  }

  newAuctionData(newData) {
    var currentBid = newData['current-item']['current-bid'];
    var currentWinner = newData['current-item']['current-winner'];

    this.setState({
      currentBid: 'Bid: $' + currentBid,
      currentWinner: 'High Bid: ' + currentWinner
    });
  }

  auctionTotalUpdated(prizePool) {
    if (this.state.uid !== '') {
      var myBidTotal = 0;
      var myTaxTotal = 0;
      var auctionTotal = 0;

      if (prizePool) {
        auctionTotal = prizePool['total'];
        if (prizePool['bids'] && prizePool['bids'][this.state.uid]) {
          myBidTotal += Number(prizePool['bids'][this.state.uid]);
        }

        if (prizePool['use-tax'] && prizePool['use-tax'][this.state.uid]) {
          myTaxTotal += Number(prizePool['use-tax'][this.state.uid]);
        }
      }
      

      this.setState({
        myBidTotal: myBidTotal,
        myTaxTotal: myTaxTotal,
        auctionTotal: auctionTotal
      });
    }
  }

  generatePotInfo = () => { 
    // fetch auction history from database
    let myBidTotal = ds.formatMoney(this.state.myBidTotal);
    let myTaxTotal = ds.formatMoney(this.state.myTaxTotal);
    let auctionTotal = ds.formatMoney(this.state.auctionTotal);

    if (this.state.myTaxTotal) {
      return (
        <div className='auction-totals'>
          <p>
            <strong>My Purchases: </strong>{myBidTotal}
          </p>
          <p className='text-danger'>
            <strong>My Taxes: </strong>{myTaxTotal}
          </p>
          <p>
            <strong>Prize Pool: </strong>{auctionTotal}
          </p>
        </div>
      );
    } else {
      return (
        <div className='auction-totals'>
          <p>
            <strong>My Purchases: </strong>{myBidTotal}
          </p>
          <p>
            <strong>Prize Pool: </strong>{auctionTotal}
          </p>
        </div>
      );
    }
    
  }

  render() {
    if (this.props.currentItem == null) {
      return (
        <div className='card auction-team mx-2'>
          <h3>...</h3>
          <h5>Bid:</h5>
          <div className='auction-clock'> 
            <AuctionClock  interval={this.state.interval} currentBid={this.state.currentBid} />
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
        <div className='card auction-team p-2 mx-2'>
          <h3>{this.props.currentItem['name']}</h3>
          <h5>{'Bid: $' + this.props.currentItem['current-bid']}</h5>
          <div className='auction-clock'>
            <AuctionClock  interval={this.state.interval} currentBid={this.state.currentBid} />
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