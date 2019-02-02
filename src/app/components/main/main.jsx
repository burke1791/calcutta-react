import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import './main.css';
import Leagues from '../leagues/leagues';
import League from '../league/league';
import GodMode from '../godMode/godMode';
/*
import LeagueHome from '../leagueHome/leagueHome';
import AuctionMain from '../auctionMain/auctionMain';
import MemberPage from '../memberPage/memberPage';
*/

import ReactGA from 'react-ga';
ReactGA.initialize('UA-122761218-1');
ReactGA.pageview(window.location.pathname + window.location.search);

class Main extends Component {

  render() {
    return (
      <Switch>
        <Route exact path='/' component={Leagues}></Route>
        <Route path='/league-home/:id' component={League}></Route>
        <Route path='/god-mode/' component={GodMode}></Route>
      </Switch>
    );
  }
}

export default Main;