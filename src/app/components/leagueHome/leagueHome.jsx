import React, { Component } from 'react';
import './leagueHome.css';
import { Redirect } from 'react-router-dom';
//import LeagueHeader from '../leagueHeader/leagueHeader';
import MembersTable from '../membersTable/membersTable';

import CanvasJSReact from '../../../canvas/canvasjs.react';

import NotificationService, { NOTIF_SIGNOUT } from '../../../services/notification-service';
import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';

var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

let ns = new NotificationService();
let ds = new DataService();
let authService = new AuthenticationService();

class LeagueHome extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: true,
      leagueName: '',
      auctionStatus: false,
      prizePool: {},
      options: {},
      users: {},
      members: {}
    }

    // Bind functions
    this.onSignOut = this.onSignOut.bind(this);
    this.getLeagueName = this.getLeagueName.bind(this);
    this.loadMembers = this.loadMembers.bind(this);
    this.loadUsers = this.loadUsers.bind(this);
    this.generatePieChart = this.generatePieChart.bind(this);
    this.goToAuction = this.goToAuction.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_SIGNOUT, this, this.onSignOut);
    this.getLeagueName();
    this.loadUsers();

    var self = this;
    ds.getDataSnapshot('/leagues/' + this.props.match.params.id + '/auction-status').then(auctionStatusSnapshot => {
      let auctionStatus = auctionStatusSnapshot.val()
      if (auctionStatusSnapshot !== null) {
        self.setState({auctionStatus: auctionStatus});
      }
    }, function(error) {
      console.log(error);
    });

    ds.getTotalPrizePoolByLeagueId(this.props.match.params.id).then(prizePool => {
      self.setState({prizePool: prizePool});
    }, function(error) {
      console.log(error);
    });
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  onSignOut() {
    this.setState({isAuthenticated: false});
  }

  getLeagueName() {
    var self = this;
    ds.getLeagueName(this.props.match.params.id).then(function(name) {
      self.setState({leagueName: name});
    });
  }

  // ***TEST*** Need to refactor this component and membersTable to make these functions not run quite as often
  loadUsers() {
    // TODO: move to DataService
    var self = this;
    var users = {};

    if (this.state.isAuthenticated) {
      ds.getDataSnapshot('/users').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var id = childSnapshot.key;
          var username = childSnapshot.child('username').val();
          users[id] = username;
        });
        self.setState({
          users: users,
          usersDownloaded: true
        });
        // Horrible place for this function call - will need a major refactor later on
        self.loadMembers();
      });
    }
  }

  loadMembers() {
    if (this.state.usersDownloaded) {
      var uid = authService.getUser() != null ? authService.getUser().uid : null;
      var self = this;
      var thisMembers = {};

      if (uid != null) { 
        ds.getLeagueUserInfo(this.props.match.params.id, uid).then(function(members) {
          thisMembers = members;

          self.setState({
            members: thisMembers,
          });
        });
      }
    }
  }
  // ***TEST***

  generatePieChart = () => {
    if (this.state.auctionStatus && this.state.prizePool !== {} && this.state.prizePool.total !== null) {
      const options = {
        exportEnabled: true,
        animationEnabled: true,
        title: {
          'text': 'Who Bid What'
        },
        data: [{
          type: 'pie',
          startAngle: 0,
          toolTipContent: '<b>{label}</b>: {y}',
          showInLegend: 'true',
          legendText: '{label}',
          indexLabelFontSize: 16,
          indexLabel: '{label} - {y}',
          yValueFormatString: '$###,###.00',
          dataPoints: []
        }]
      };
      
      var username;
      for (var uid in this.state.members) {
        if (this.state.members[uid]) {
          username = this.state.users[uid];
          
          if (this.state.prizePool['use-tax'] !== undefined) {
            if (this.state.prizePool.bids[uid] !== undefined && this.state.prizePool['use-tax'][uid] !== undefined) {
              var totalBid = this.state.prizePool.bids[uid] + this.state.prizePool['use-tax'][uid];
              let dataPoint = {y: totalBid, label: username};
              options.data[0].dataPoints.push(dataPoint);
            } else if (this.state.prizePool.bids[uid] !== undefined) {
              var totalBid = this.state.prizePool.bids[uid];
              let dataPoint = {y: totalBid, label: username};
              options.data[0].dataPoints.push(dataPoint);
            }
          } else if (this.state.prizePool.bids !== undefined) {
            if (this.state.prizePool.bids[uid] !== undefined) {
              var totalBid = this.state.prizePool.bids[uid];
              let dataPoint = {y: totalBid, label: username};
              options.data[0].dataPoints.push(dataPoint);
            }
          } 
        }
      }

      return (
        <div className='bid-totals-pie my-2'>
          <CanvasJSChart options={options} />
        </div>
      );
    } else {
      return null
    }
  }

  goToAuction() {
    this.props.history.push('/league-home/' + this.props.match.params.id + '/auction/');
  }

  render() {
    if (this.state.isAuthenticated) {
      return (
        <div className='container league-home'>
          <div className='card'>
            <MembersTable className='table table-striped table-hover table-sm' isAuthenticated={this.state.isAuthenticated} />
          </div>
          {this.generatePieChart()}
        </div>
      );
    } else {
      return (
        <Redirect to='/' />
      )
    }
    
  }

}

export default LeagueHome;