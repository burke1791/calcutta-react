import React, { Component } from 'react';
import './updateScoresRow.css';

class UpdateScoresRow extends Component {
  constructor(props) {
    super(props);

    // bind functions
  }

  render() {
    return (
      <tr className='d-flex tr-hover'>
        <td className='col-2'></td>
        <td className='col-3'></td>
        <td className='col-3'></td>
        <td className='col-2'></td>
      </tr>
    );
  }
}

export default UpdateScoresRow;