import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import './leagueTable.css';
import LeagueRow from '../leagueRow/leagueRow';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT, NOTIF_LEAGUE_CREATED, NOTIF_LEAGUE_JOINED } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let authService = new AuthenticationService();
let ds = new DataService();

class LeagueTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: true,
      uid: '',
      leagues: [],
      tableDataSource: this.props.tableSource // Can be one of three values: 'in-progress', 'complete', or 'pending'
    }

    // Bind functions
    this.loadLeagues = this.loadLeagues.bind(this);
    this.leagueList = this.leagueList.bind(this);
    this.onSignIn = this.onSignIn.bind(this);
    this.onSignOut = this.onSignOut.bind(this);
    this.clearTables = this.clearTables.bind(this);
    this.getUserLeagueSummary = this.getUserLeagueSummary.bind(this);
    this.formatMoney = this.formatMoney.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_SIGNIN, this, this.onSignIn);
    ns.addObserver(NOTIF_SIGNOUT, this, this.onSignOut);
    ns.addObserver(NOTIF_LEAGUE_CREATED, this, this.loadLeagues);
    ns.addObserver(NOTIF_LEAGUE_JOINED, this, this.loadLeagues);

    if (authService.getUser() !== null) {
      var uid = authService.getUser().uid;
      this.onSignIn(uid);
    }
    // TODO: figure out how to call loadLeagues() upon rerender without a notification
    // The below works only on the first load, the auth service is slower in logging in
    /*
    if (this.state.isAuthenticated) {
      this.loadLeagues(); 
    }
    */
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
    ns.removeObserver(this, NOTIF_LEAGUE_CREATED);
    ns.removeObserver(this, NOTIF_LEAGUE_JOINED);

    console.log('leagueTable unmounted');
  }

  loadLeagues(uid) {
    // TODO: move this to DataService (maybe)

    if (uid !== null) {
      var self = this;
      var sourceData = this.state.tableDataSource; // Determines which leagues to fetch from the database
      var leagues = [];

      ds.getDataSnapshot('/leagues').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var id = childSnapshot.key;
          var league = childSnapshot.val();
          league['key'] = id;
          var members = childSnapshot.child('members').val();
          var leagueStatus = childSnapshot.child('status').val();

          if (members[uid] && leagueStatus === sourceData) {
            leagues.push(league);
          }
        });
        self.setState({leagues: leagues});
      });
    }
  }

  onSignIn(newUser) {
    var uid = newUser !== null ? newUser : null;
    console.log('notif user: ' + newUser);

    this.setState({
      isAuthenticated: true,
      uid: uid
    });

    this.loadLeagues(uid);
  }

  onSignOut() {
    this.setState({
      isAuthenticated: false,
      leagues: []
    });
  }

  clearTables() {
    this.setState({leagues: []});
  }

  getUserLeagueSummary = (league) => {
    var buyIn = 0;
    var payout = 0;
    var netReturn = 0;

    var teams = (league.teams !== undefined ? league.teams : []);

    let prizePool = league['prize-pool'] !== undefined ? league['prize-pool'] : null;

    console.log(prizePool);

    if (prizePool !== null) {
      if (prizePool['use-tax'] !== undefined) {
        if (prizePool['use-tax'][this.state.uid] !== undefined) {
          buyIn += Number(prizePool['use-tax'][this.state.uid]);
        }

        if (prizePool.bids !== undefined) {
          if (prizePool.bids[this.state.uid] !== undefined) {
            buyIn += Number(prizePool.bids[this.state.uid]);
          }
        }
      } else if (prizePool.bids !== undefined) {
        if (prizePool.bids[this.state.uid] !== undefined) {
          buyIn += Number(prizePool.bids[this.state.uid]);
        }
      }
    } else {
      for (const [key, value] of Object.entries(teams)) {
        if (value.owner === this.state.uid) {
          buyIn += Number(value.price);
          // payout += Number(value.return);
        }
      }
    }

    for (const [key, value] of Object.entries(teams)) {
      if (value.owner === this.state.uid) {
        payout += Number(value.return);
      }
    }
    

    netReturn = payout - buyIn;

    return [buyIn, payout, netReturn];
  }

  formatMoney = (value) => {
    // TODO: move to DataService
    var currencyString = '';

    var s = '';
    var sym = '$';
    
    if (value < 0) {
      s = '-';
    }
    currencyString = s + sym + ' ' + Math.abs(value).toFixed(2);
    return (currencyString);
  }

  leagueList = () => {
    if (this.state.leagues.length) {
      const list = this.state.leagues.map((league) => {
        var buyIn = this.formatMoney(this.getUserLeagueSummary(league)[0]);
        var payout = this.formatMoney(this.getUserLeagueSummary(league)[1]);
        var netReturn = this.formatMoney(this.getUserLeagueSummary(league)[2]);
  
        var netReturnNegativeClass = this.getUserLeagueSummary(league)[2] < 0 ? 'col col-md-2 text-danger' : 'col col-md-2';
  
        return (
            <LeagueRow id={league.key} key={league.key} name={league.name} buyIn={buyIn} payout={payout} netReturn={netReturn} netReturnClass={netReturnNegativeClass} />
        );
        
      });

      return (list);
    } else {
      var userSignedIn = authService.getUser() != null;
      var tableText = userSignedIn ? '**Create or Join a League**' : '**Please Log In to View Your Leagues**';
      return (
        <tr className='d-flex'>
          <td className='col-md' colSpan='4'>{tableText}</td>
        </tr>
      );
    }
  } 
  
  render() {
    return(
      <div className='row justify-content-md-center'>
        <table className={this.props.className}>
          <thead>
            <tr className='d-flex'>
              <th className='col col-md-6'>League Name</th>
              <th className='col col-md-2'>Buy In</th>
              <th className='col col-md-2'>Current Payout</th>
              <th className='col col-md-2'>Net Return</th>
            </tr>
          </thead>
          <tbody>
            {this.leagueList()}
          </tbody>
        </table>
      </div>
    );
  }
}

export default withRouter(LeagueTable);