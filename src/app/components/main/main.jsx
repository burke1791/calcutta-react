import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import './main.css';
import Leagues from '../leagues/leagues';
import LeagueHome from '../leagueHome/leagueHome';

class Main extends Component {


  render() {
    return (
      <Switch>
        <Route exact path='/' component={Leagues}></Route>
        <Route path='/league-home/:id' component={LeagueHome}></Route>
      </Switch>
    );
  }
}

export default Main;