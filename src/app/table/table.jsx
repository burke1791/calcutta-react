import React, { Component } from 'react';
import './table.css';

class Table extends Component {
  render() {
    return(
      <div className='table-info'>
        <table className={this.props.className}>
          <thead>
          
          </thead>
          <tbody>

          </tbody>
        </table>
      </div>
    );
  }
}

export default Table;