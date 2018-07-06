import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import './main.css';
import Leagues from '../leagues/leagues';
import LeagueHome from '../leagueHome/leagueHome';
import AuctionMain from '../auctionMain/auctionMain';

class Main extends Component {


  render() {
    return (
      <Switch>
        <Route exact path='/' component={Leagues}></Route>
        <Route exact path='/league-home/:id' component={LeagueHome}></Route>
        <Route path='/league-home/:id/auction/:auctionId' component={AuctionMain}></Route>
      </Switch>
    );
  }
}

export default Main;