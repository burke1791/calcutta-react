import React, { Component } from 'react';
import './auctionTeam.css';
import AuctionClock from '../auctionClock/auctionClock';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_AUCTION_CHANGE, NOTIF_AUCTION_ITEM_SOLD, NOTIF_SIGNIN } from '../../../services/notification-service';

let authService = new AuthenticationService();
let ds = new DataService();
let ns = new NotificationService();

class AuctionTeam extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentBid: 'Bid: $0',
      currentWinner: 'High Bid: ',
      myTotal: 0,
      auctionTotal: 0,
      uid: ''
    }

    this.userSignedIn = this.userSignedIn.bind(this);
    this.generatePotInfo = this.generatePotInfo.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
    this.newItemSold = this.newItemSold.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
    ns.addObserver(NOTIF_AUCTION_ITEM_SOLD, this, this.newItemSold);
    ns.addObserver(NOTIF_SIGNIN, this, this.userSignedIn);
    
    if (authService.getUser()) {
      this.setState({
        uid: authService.getUser().uid
      });
    }
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
    ns.removeObserver(this, NOTIF_AUCTION_ITEM_SOLD);
    ns.removeObserver(this, NOTIF_SIGNIN);
  }

  userSignedIn() {
    let uid = authService.getUser().uid;

    if (this.state.uid !== uid) {
      this.setState({
        uid: uid
      });
    }
  }

  generatePotInfo = () => { 
    // fetch auction history from database
    let myTotal = ds.formatMoney(this.state.myTotal);
    let auctionTotal = ds.formatMoney(this.state.auctionTotal);

    return (
      <p>
        <strong>My Purchases: </strong>({myTotal}) - <strong>Total: </strong>({auctionTotal})
      </p>
    );
  }

  newAuctionData(newData) {
    var currentBid = newData['current-item']['current-bid'];
    var currentWinner = newData['current-item']['current-winner'];

    this.setState({
      currentBid: 'Bid: $' + currentBid,
      currentWinner: 'High Bid: ' + currentWinner
    });
  }

  newItemSold(leagueTeams) {
    var self = this;
    if (this.state.uid !== '') {
      ds.getTotalPrizePoolByLeagueId(this.props.leagueId, this.state.uid).then(prizePool => {
        var auctionTotal = Number(prizePool['total']);
        var myTotal = 0;

        let bids = prizePool['bids'];
        let tax = prizePool['use-tax'];

        if (bids && bids[this.state.uid]) {
          myTotal += Number(bids[this.state.uid]);
        }

        if (tax && tax[this.state.uid]) {
          myTotal += Number(tax[this.state.uid]);
        }

        self.setState({
          myTotal: myTotal,
          auctionTotal: auctionTotal
        });
      });
    }
  }

  render() {
    if (this.props.currentItem == null) {
      return (
        <div className='card auction-team mx-2'>
          <h3>...</h3>
          <h5>Bid:</h5>
          <div className='auction-clock'> 
            <AuctionClock  interval={10} currentBid={this.state.currentBid} />
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
            <AuctionClock  interval={10} currentBid={this.state.currentBid} />
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