import React, { Component } from 'react';
import { NavLink, Switch, Route } from 'react-router-dom';
import './main.css';
import Leagues from '../leagues/leagues';
import LeagueHome from '../leagueHome/leagueHome';

class Main extends Component {


  render() {
    return (
      <Switch>
        <Route exact path='/' Component={Leagues}></Route>
        <Route exact path='/league-home' Component={LeagueHome}></Route>
      </Switch>
    );
  }
}

export default Main;