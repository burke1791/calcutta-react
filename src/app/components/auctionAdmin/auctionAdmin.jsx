import React, { Component } from 'react';
import './auctionAdmin.css';
import Button from '../button/button';

import NotificationService, { NOTIF_AUCTION_RESTART_CLOCK, NOTIF_AUCTION_START_CLOCK } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class AuctionAdmin extends Component {

  constructor(props) {
    super(props);

    this.state = {
      auctionStarted: this.props.auctionStarted,
      leagueId: this.props.leagueId
    }

    // bind functions
    this.startAuction = this.startAuction.bind(this);
    this.nextItem = this.nextItem.bind(this);
    this.restartClcok = this.restartClcok.bind(this);
    this.undoLastBid = this.undoLastBid.bind(this);
    this.endAuction = this.endAuction.bind(this);
    this.generateAdminHeader = this.generateAdminHeader.bind(this);
  }

  componentDidMount() {
    var self = this;
    ds.getDataSnapshot('/auctions/' + this.state.leagueId + '/in-progress').then(function(auctionStarted) {
      self.setState({auctionStarted: auctionStarted});
    });
  }

  componentWillUnmount() {

  }

  startAuction() {
    
  }

  nextItem() {
    // Test
    ns.postNotification(NOTIF_AUCTION_START_CLOCK, null);
  }

  restartClcok() {
    ds.restartAuctionClock(this.state.leagueId);
  }

  undoLastBid() {

  }

  endAuction() {

  }

  generateAdminHeader = () => {
    if (this.state.auctionStarted) {
      return (
          <div className='btn-toolbar'>
            <div className='btn-group m-2'>
              <Button btnType='button' btnClass='btn btn-secondary' btnValue='Start Next Item' onClick={this.nextItem} />
            </div>
            <div className='btn-group m-2'>
              <Button btnType='button' btnClass='btn btn-secondary' btnValue='Restart Clock' onClick={this.restartClcok} />
            </div>
            <div className='btn-group m-2'>
              <Button btnType='button' btnClass='btn btn-secondary' btnValue='Undo Last Bid' onClick={this.undoLastBid} />
            </div>
            <div className='btn-group m-2'>
              <Button btnType='button' btnClass='btn btn-secondary' btnValue='End Auction' onClick={this.endAuction} />
            </div>
          </div>
      );
    } else {
      return (
        <div className='btn-toolbar'>
          <div className='btn-group m-2'>
            <Button btnType='button' btnClass='btn btn-primary' btnValue='Start Auction' onClick={this.startAuction} />
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <div className='admin-header'>
        {this.generateAdminHeader()}
      </div>
    );
  }

}

export default AuctionAdmin;