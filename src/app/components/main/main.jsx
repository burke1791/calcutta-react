import React, { Component } from 'react';
import { NavLink, Switch, Route } from 'react-router-dom';
import './main.css';
import Leagues from '../leagues/leagues';
import LeagueHome from '../leagueHome/leagueHome';

class Main extends Component {


  render() {
    return (
      <Switch>
        <Route exact path='/' component={ () => (
          <Leagues timestamp={new Date().toString()} />
        )}></Route>
        <Route exact path='/league-home' component={LeagueHome}></Route>
      </Switch>
    );
  }
}

export default Main;