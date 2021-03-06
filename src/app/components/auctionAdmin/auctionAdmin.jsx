import React, { Component } from 'react';
import './auctionAdmin.css';
import Button from '../button/button';

import NotificationService, { NOTIF_AUCTION_ITEM_COMPLETE } from '../../../services/notification-service';
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
      randomize: true,
      unclaimed: false,
      interval: 15
    }

    // bind functions
    this.fetchLeagueSettings = this.fetchLeagueSettings.bind(this);
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
    this.fetchLeagueSettings();

    var self = this;
    ds.getDataSnapshot('/auctions/' + this.state.leagueId + '/in-progress').then(function(auctionStarted) {
      self.setState({auctionStarted: auctionStarted.val()});
    });

    ns.addObserver(NOTIF_AUCTION_ITEM_COMPLETE, this, this.itemComplete);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_AUCTION_ITEM_COMPLETE);
  }

  fetchLeagueSettings() {
    var self = this;
    ds.fetchSettings(this.props.leagueId).then(function(settings) {
      if (settings) {
        self.setState({
          unclaimed: settings['unclaimed']
        });
      } else {
        self.setState({
          unclaimed: true
        });
      }
    });
  }

  fetchTeamCodes() {
    var self = this;
    ds.getTeamCodes(this.state.leagueId).then(function(teams) {
      var codes = Object.keys(teams);

      self.setState({teamCodes: codes});
    });
  }

  startAuction() {
    var self = this;
    ds.getDataSnapshot('/leagues/' + this.state.leagueId + '/auction-status').then(auctionStatusSnapshot => {
      let status = auctionStatusSnapshot.val();
      if (!status) {
        
        self.setState({auctionStarted: true}, self.loadNewItem);
      } else {
        alert('All Items Have Been Auctioned Off');
      }
    });
    
  }

  nextItem() {
    this.logResults();
  }

  logResults(endAuction = false) {
    var self = this;
    if (endAuction) {
      ds.logAuctionItemResult(this.state.leagueId, this.state.unclaimed).then((oldCode) => {
        // do nothing
      }, function(error) {
        // future error handling
      });
    } else {
      ds.logAuctionItemResult(this.state.leagueId, this.state.unclaimed).then((oldCode) => {
        if (oldCode === '') {
          alert('All Items Have Been Auctioned Off');
        } else {

          self.loadNewItem(oldCode);
        }
      }, function(error) {
        // future error handling
      });
    }
    
  }

  loadNewItem(oldCode) {
    var self = this;
    var codes = this.state.teamCodes;

    if (!this.state.auctionStarted) {
      alert('Auction Is Not Active');
    } else if (!oldCode) {
      // called when Start Auction is pressed
      if (this.state.randomize) {
        var newCode = codes[Math.floor(Math.random() * codes.length)];
      } else {
        var newCode = codes[0];
      }

      var interval = 15;
      if (this.state.interval !== undefined) {
        interval = this.state.interval;
      }
      ds.loadNextItem(newCode, this.state.leagueId, interval);
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
            
            var interval = 15;
            if (this.state.interval !== undefined) {
              interval = this.state.interval;
            }
            ds.loadNextItem(newCode, this.state.leagueId, interval).then((test) => {
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
    this.setState({
      auctionStarted: false
    });
    this.logResults(true);
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