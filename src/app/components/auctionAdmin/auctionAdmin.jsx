import React, { Component } from 'react';
import './auctionAdmin.css';
import Button from '../button/button';

import NotificationService, { NOTIF_AUCTION_RESTART_CLOCK, NOTIF_AUCTION_START_CLOCK, NOTIF_AUCTION_ITEM_COMPLETE } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class AuctionAdmin extends Component {

  constructor(props) {
    super(props);

    this.state = {
      auctionStarted: false,
      leagueId: this.props.leagueId,
      teamCodes: [],
      randomize: true
    }

    // bind functions
    this.fetchTeamCodes = this.fetchTeamCodes.bind(this);
    this.startAuction = this.startAuction.bind(this);
    this.nextItem = this.nextItem.bind(this);
    this.logResults = this.logResults.bind(this);
    this.loadNewItem = this.loadNewItem.bind(this);
    this.restartClcok = this.restartClcok.bind(this);
    this.undoLastBid = this.undoLastBid.bind(this);
    this.endAuction = this.endAuction.bind(this);
    this.itemComplete = this.itemComplete.bind(this);
    this.randomCheckboxChanged = this.randomCheckboxChanged.bind(this);
    this.generateAdminHeader = this.generateAdminHeader.bind(this);
  }

  componentDidMount() {
    this.fetchTeamCodes();

    var self = this;
    ds.getDataSnapshot('/auctions/' + this.state.leagueId + '/in-progress').then(function(auctionStarted) {
      self.setState({auctionStarted: auctionStarted.val()});
    });

    ns.addObserver(NOTIF_AUCTION_ITEM_COMPLETE, this, this.itemComplete);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_AUCTION_ITEM_COMPLETE);
  }

  fetchTeamCodes() {
    var self = this;
    ds.getTeamCodes(this.state.leagueId).then(function(teams) {
      var codes = Object.keys(teams);
      self.setState({teamCodes: codes});
    });
  }

  startAuction() {
    this.loadNewItem();
    this.setState({auctionStarted: true});
  }

  nextItem() {
    // Test
    // ns.postNotification(NOTIF_AUCTION_START_CLOCK, null);
    this.logResults();
  }

  logResults() {
    var self = this;
    ds.logAuctionItemResult(this.state.leagueId).then((oldCode) => {
      self.loadNewItem(oldCode);
    });
  }

  loadNewItem(oldCode) {
    var self = this;
    var codes = this.state.teamCodes;

    if (!oldCode) {
      var newCode = codes[0];
      ds.loadNextItem(newCode, this.state.leagueId);
    } else {
      if (codes.length > 1) {
        for (var x = 0; x < codes.length; x++) {
          if (codes[x] === oldCode) {
            codes.splice(x, 1);

            if (this.state.randomize) {
              var newCode = codes[Math.floor(Math.random() * codes.length)];
            } else {
              var newCode = codes[0];
            }
            
            ds.loadNextItem(newCode, this.state.leagueId).then(() => {
              self.setState({teamCodes: codes});
            });
            break;
          }
        }
      }
    }
  }

  randomCheckboxChanged(event) {
    this.setState({randomize: event.target.checked});
  }

  restartClcok() {
    ds.restartAuctionClock(this.state.leagueId);
  }

  undoLastBid() {
    
  }

  endAuction() {
    ds.endAuction(this.state.leagueId);
  }

  itemComplete() {
    ds.auctionItemComplete(this.state.leagueId);
  }

  generateAdminHeader = () => {
    if (this.state.auctionStarted) {
      return (
        <div className='auction-controls'>
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
          <div className='form-check'>
            <input className='form-check-input' type='checkbox' checked={this.state.randomize} onChange={this.randomCheckboxChanged} />
            <label className='form-check-label'>Randomize?</label>
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