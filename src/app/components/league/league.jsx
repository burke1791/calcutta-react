import React, { Component } from 'react';
import './league.css';
import { Switch, Route, withRouter } from 'react-router-dom';
import LeagueHome from '../leagueHome/leagueHome';
import AuctionMain from '../auctionMain/auctionMain';
import MemberPage from '../memberPage/memberPage';
import LeagueHeader from '../leagueHeader/leagueHeader';
import LeagueNav from '../leagueNav/leagueNav';
import LeagueSettings from '../leagueSettings/leagueSettings';

import DataService from '../../../services/data-service';

let ds = new DataService();

class League extends Component {
  constructor(props) {
    super(props);

    this.state = {
      leagueName: '',
      currentPage: 'home'
    }

    // bind functions
    
  }

  render() {
    var leagueHomeNavClass = 'nav-item';
    var auctionNavClass = 'nav-item';
    var myTeamNavClass = 'nav-item';
    var leagueSettingsNavClass = 'nav=item';

    if (this.state.currentPage === 'home') {
      leagueHomeNavClass = 'nav-item active';
    } else if (this.state.currentPage === 'myTeam') {
      myTeamNavClass = 'nav-item active';
    } else if (this.state.currentPage === 'auction') {
      auctionNavClass = 'nav-item active';
    } else if (this.state.currentPage === 'settings') {
      leagueSettingsNavClass = 'nav-item active';
    }

    return (
      <div className='league'>
        <div className='league-header mr-auto'>
          <LeagueHeader leagueId={this.props.match.params.id} />
        </div>
        <div className='league-nav'>
          <LeagueNav leagueId={this.props.match.params.id} />
        </div>
        <Switch>
          <Route exact path='/league-home/:id' component={LeagueHome}></Route>
          <Route exact path='/league-home/:id/auction/' component={AuctionMain}></Route>
          <Route exact path='/league-home/:id/member/:uid' component={MemberPage}></Route>
          <Route exact path='/league-home/:id/settings' component={LeagueSettings}></Route>
        </Switch>
      </div>
    );
  }
}

export default withRouter(League);