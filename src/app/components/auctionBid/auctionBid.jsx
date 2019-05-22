import React, { Component } from 'react';
import './auctionBid.css';
import Button from '../button/button';
import AuctionRules from '../auctionRules/auctionRules';

import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_AUCTION_CHANGE } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';

let ds = new DataService();
let ns = new NotificationService();
let authService = new AuthenticationService();

class AuctionBid extends Component {

  constructor(props) {
    super(props);

    this.enableBidding = null;

    this.state = {
      minBidAllowed: 1,
      minBid: 1,
      bid: 1,
      interval: 15,
      leagueId: this.props.leagueId,
      currentBid: 0,
      itemComplete: true,
      biddingDisabled: false
    }

    // Bind functions
    this.fetchLeagueSettings = this.fetchLeagueSettings.bind(this);
    this.placeBid = this.placeBid.bind(this);
    this.placeMinBid = this.placeMinBid.bind(this);
    this.disableBidding = this.disableBidding.bind(this);
    this.onBidChange = this.onBidChange.bind(this);
    this.incrementBid = this.incrementBid.bind(this);
    this.decrementBid = this.decrementBid.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);

    this.fetchLeagueSettings();
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);

    clearTimeout(this.enableBidding);
  }

  componentDidUpdate(nextProps, nextState) {
    if (nextState.biddingDisabled) {
      this.enableBidding = setTimeout(() => {
        this.setState(() => ({biddingDisabled: false}))
      }, 1000);
    }
  }

  fetchLeagueSettings() {
    var self = this;

    ds.fetchSettings(this.props.leagueId).then(function(settings) {
      if (settings) {
        if (settings['auction-interval'] !== undefined) {
          self.setState({
            minBidAllowed: settings['minBid'],
            minBid: settings['minBid'],
            interval: settings['auction-interval']
          });
        } else {
          self.setState({
            minBidAllowed: settings['minBid'],
            minBid: settings['minBid']
          });
        }
      } else {
        self.setState({
          minBidAllowed: 0,
          minBid: 0
        });
      }
    }, function(error) {
      console.log(error);
    });
  }

  placeMinBid() {
    //push bid amount to firebase
    var uid = authService.getUser().uid;
    var self = this;

    this.setState({biddingDisabled: true});
    
    // make the username a state value
    ds.getDisplayName(uid).then(function(username) {
      if (self.state.minBid > self.state.currentBid) {
        ds.placeBid(self.state.leagueId, uid, username, self.state.minBid, self.state.interval);
      }
    });
      
  }

  placeBid() {
    //push bid amount to firebase
    var uid = authService.getUser().uid;
    var self = this;

    this.setState({biddingDisabled: true});

    var bid = Math.ceil(this.state.bid);

    if (bid >= this.state.minBid) {
      ds.getDisplayName(uid).then(function(username) {
        ds.placeBid(self.state.leagueId, uid, username, bid, self.state.interval);
      });
    }
  }

  disableBidding() {
    this.setState({biddingDisabled: false});

  }

  onBidChange(event) {
    event.preventDefault();

    this.setState({bid: event.target.value});
  }

  incrementBid() {
    if (this.state.bid == '') {
      var newBid = 1;
      this.setState({bid: newBid});
    } else {
      var newBid = parseInt(this.state.bid) + 1;
      this.setState({bid: newBid});
    }
  }

  decrementBid() {
    if (this.state.bid == '') {
      var newBid = 0;
      this.setState({bid: 0});
    } else {
      var newBid = parseInt(this.state.bid) - 1;
      if (newBid < 0) {
        this.setState({bid: 0});
      } else {
        this.setState({bid: newBid});
      }
    }
  }

  newAuctionData(newData) {
    var currentBid = newData['current-item']['current-bid'];
    var itemComplete = newData['current-item']['complete'];

    // var minBid = Number(currentBid) <= Number(this.state.minBidAllowed) ? this.state.minBidAllowed : Number(currentBid) + 1;
    var minBid = Number(currentBid) + 1;

    this.setState({
      minBid: minBid,
      currentBid: currentBid,
      itemComplete: itemComplete
    });
  }

  render() {
    var bidBtnClass = 'btn btn-primary';
    var bidBtnDisabled = false;
    var disabled = false;

    if (parseInt(Math.ceil(this.state.bid)) < parseInt(this.state.minBid)) {
      bidBtnClass = 'btn btn-danger';
      bidBtnDisabled = true;
    }

    if (this.state.itemComplete) {
      disabled = true;
      bidBtnDisabled = true;
    }

    if (this.state.biddingDisabled) {
      disabled = true;
      bidBtnDisabled = true;
    }

    return (
      <div className='card justify-content-center bid-actions mx-2'>
        <AuctionRules leagueId={this.props.leagueId} />
        <Button btnType='button' btnClass='btn btn-primary my-1' btnValue={'Minimum Bid ($' + this.state.minBid + ')'} onClick={this.placeMinBid} disabled={disabled} />
        <div className='btn-group'>
          <Button btnType='button' btnClass='btn btn-secondary m-1' btnValue='-' onClick={this.decrementBid} disabled={disabled} />
          <input type='number' className='m-1' value={this.state.bid} onChange={this.onBidChange} disabled={disabled} />
          <Button btnType='button' btnClass='btn btn-secondary m-1' btnValue='+' onClick={this.incrementBid} disabled={disabled} />
          <Button btnType='button' btnClass={bidBtnClass + ' m-1'} btnValue={'Bid'} onClick={this.placeBid} disabled={bidBtnDisabled} />
        </div>
      </div>
    );
  }
}

export default AuctionBid;