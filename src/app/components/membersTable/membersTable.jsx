import React, { Component } from 'react';
import './membersTable.css';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();
let authService = new AuthenticationService();

class MembersTable extends Component {
  // TODO: Refactor leagueTable.jsx to accomodate a members list

  construtcor(props) {
    super(props);

    this.state = {
      members: []
    };

    // Bind functions
    this.loadMembers = this.loadMembers.bind(this);
    this.membersList = this.membersList.bind(this);
    this.clearTable = this.clearTable.bind(this);
  }

  componentWillMount() {
    ns.addObserver(NOTIF_SIGNIN, this, this.loadMembers);
    ns.addObserver(NOTIF_SIGNOUT, this, this.clearTable);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  loadMembers() {
    console.log('TEST: loadMembers called');
    
  }

  clearTable() {
    this.setState({members: []});
  }

  membersList = () => {
    return (
      <tr className='d-flex'>
        <td className='col col-md-6'>Burke</td>
        <td className='col col-md-2'>$ 81.00</td>
        <td className='col col-md-2'>$ 99.00</td>
        <td className='col col-md-2'>$ 18.00</td>
      </tr>
    );
  }

  render() {
    return (
      <div className='members-table'>
        <table className={this.props.className}>
          <thead>
            <tr className='d-flex'>
              <th className='col col-md-6'>Name</th>
              <th className='col col-md-2'>Buy In</th>
              <th className='col col-md-2'>Current Payout</th>
              <th className='col col-md-2'>Net Return</th>
            </tr>
          </thead>
          <tbody>
            {this.membersList()}
          </tbody>
        </table>
      </div>
    );
  }

}

export default MembersTable;