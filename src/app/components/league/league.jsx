import React, { Component } from 'react';
import './league.css';
import { Switch, Route, withRouter } from 'react-router-dom';
import LeagueHome from '../leagueHome/leagueHome';
import AuctionMain from '../auctionMain/auctionMain';
import MemberPage from '../memberPage/memberPage';

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
    this.getLeagueName = this.getLeagueName.bind(this);
  }

  getLeagueName() {
    var self = this;
    ds.getLeagueName(this.props.match.params.id).then(function(name) {
      self.setState({leagueName: name});
    });
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
        <div className='league-name'>
          <div className='container'>
            <div className='row justify-content-md-center'>
              <h1>{this.state.leagueName}</h1>
            </div>
            <div className='row'>
              <div className='col'>
                <nav className='navbar navbar-expand-lg'>
                  <button className='navbar-toggler' type='button' data-toggle='collapse' data-target='#navbarNav' aria-controls='navbarNav' aria-expanded='false'>
                    <span className='navbar-toggler-icon'></span>
                  </button>
                  <div className='collapse navbar-collapse' id='navbarNav'>
                    <ul className='league-nav'>
                      <li className={leagueHomeNavClass}>
                        <a className='nav-link' onClick={this.leagueHomeClicked}>League Home</a>
                      </li>
                      <li className={myTeamNavClass}>
                        <a className='nav-link' onClick={this.myTeamClicked}>My Team</a>
                      </li>
                      <li className={auctionNavClass}>
                        <a className='nav-link' onClick={this.auctionClicked}>Auction Room</a>
                      </li>
                      <li className={leagueSettingsNavClass}>
                        <a className='nav-link' onClick={this.leagueSettingsClicked}>League Settings</a>
                      </li>
                    </ul>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
        <Switch>
          <Route exact path='/league-home/:id' component={LeagueHome}></Route>
          <Route exact path='/league-home/:id/auction/' component={AuctionMain}></Route>
          <Route exact path='/league-home/:id/member/:uid' component={MemberPage}></Route>
        </Switch>
      </div>
    );
  }
}

export default withRouter(League);