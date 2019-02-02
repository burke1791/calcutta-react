import React, { Component } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import './godMode.css';

import GodModeNav from '../godModeNav/godModeNav';
import GodModeAddSport from '../godModeAddSport/godModeAddSport';
import GodModeUpdateScores from '../godModeUpdateScores/godModeUpdateScores';

class GodMode extends Component {
  constructor(props) {
    super(props);


  }

  render() {
    var godModeRoot = '/god-mode/'

    return (
      <div className='god-mode'>
        <div className='god-mode-header mr-auto'>
          <h1>God Mode (Test)</h1>
        </div>
        <div className='god-mode-nav'>
          <GodModeNav />
        </div>
        <Switch>
          <Route exact path={godModeRoot + 'add-sport'} component={GodModeAddSport}></Route>
          <Route exact path={godModeRoot + 'update-scores'} component={GodModeUpdateScores}></Route>
        </Switch>
      </div>
    );
  }
}

export default withRouter(GodMode);