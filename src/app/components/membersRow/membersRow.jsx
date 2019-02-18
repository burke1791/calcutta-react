import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

class MembersRow extends Component {

  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    event.preventDefault();

    this.props.history.push('/league-home/' + this.props.match.params.id + '/member/' + this.props.id);
  }

  render() {
    console.log('uid: ' + this.props.uid);
    var rowClass = 'd-flex tr-hover';
    if (this.props.uid === this.props.id) {
      rowClass = 'd-flex tr-hover table-primary';
    }
    return (
      <tr className={rowClass} key={this.props.id} onClick={this.handleClick}>
        <td className='col col-md-2'>{this.props.rank}</td>
        <td className='col col-md-4'>{this.props.name}</td>
        <td className='col col-md-2'>{this.props.buyIn}</td>
        <td className='col col-md-2'>{this.props.payout}</td>
        <td className={this.props.netReturnClass}>{this.props.netReturn}</td>
      </tr>
    );
  }
}

export default withRouter(MembersRow);