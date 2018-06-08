import React, {Component} from 'react';
import './leagueForm.css';
import NotificationService, { NOTIF_LEAGUE_SUBMIT, NOTIF_MODAL_TYPE_CHANGE, NOTIF_LEAGUE_JOINED, NOTIF_LEAGUE_CREATED } from '../../services/notification-service';
import AuthenticationService from '../../services/authentication-service';
import Button from '../button/button';
import { auth, database } from '../../services/fire';

let ns = new NotificationService();
let authService = new AuthenticationService();

class LeagueForm extends Component {

  constructor(props) {
    super(props);

    this.state = {
      leagueType: props.leagueType,
      submitBtnText: props.leagueType == 'join' ? 'Join' : 'Create',
      leagueNameVal: '',
      leaguePassVal: '',
      leagueSportVal: 'ncaa-mens'
    };

    this.leagueSubmission = this.leagueSubmission.bind(this);
    this.onLeagueNameChange = this.onLeagueNameChange.bind(this);
    this.onLeaguePassChange = this.onLeaguePassChange.bind(this);
    this.onLeagueSportChange = this.onLeagueSportChange.bind(this);
    this.joinRadioClicked = this.joinRadioClicked.bind(this);
    this.createRadioClicked = this.createRadioClicked.bind(this);
    this.generateFormContents = this.generateFormContents.bind(this);
  }

  componentWillMount() {
    ns.addObserver(NOTIF_LEAGUE_SUBMIT, this, this.leagueSubmission);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_LEAGUE_SUBMIT);
  }

  leagueSubmission(event) {
    event.preventDefault();

    var uid = auth.currentUser.uid;
    var self = this;

    if (this.state.leagueNameVal == '' || this.state.leaguePassVal == '') {
      alert('Please enter a league name and password');
    } else if (this.state.leagueType == 'join') {
      // TODO: check if user is already a member
      // TODO: check for multiple leagues using the same name and password before adding user to members list
      database.ref('/leagues').once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var leagueName = childSnapshot.child('name').val();
          var leaguePass = childSnapshot.child('password').val();
          var leagueStatus = childSnapshot.child('status').val();
          var leagueMembers = childSnapshot.child('members').val();
          var key = childSnapshot.key;

          if (leagueStatus != 'pending') {
            if (leagueName === self.state.leagueNameVal && leaguePass === self.state.leaguePassVal) {
              if (!leagueMembers[uid]) {
                database.ref('/leagues/' + key + '/members/' + uid).set(true);
                ns.postNotification(NOTIF_LEAGUE_JOINED, null);
              }
            }
          }
        });
      });
    } else if (this.state.leagueType == 'create') {
      var league = {
        'status' : 'pending',
        'creator' : uid,
        'members' : {
          [uid] : true
        },
        'name' : this.state.leagueNameVal,
        'password' : this.state.leaguePassVal,
        'sport' : this.state.leagueSportVal
      };

      database.ref('/leagues').push(league);
      ns.postNotification(NOTIF_LEAGUE_CREATED, null);
      // redirect to new league page to complete setup information
    }
    // this will need to be moved - in some cases the modal will need to display an error message
    this.props.submitHandler();
  }

  onLeagueNameChange(event) {
    this.setState({leagueNameVal: event.target.value});
  }

  onLeaguePassChange(event) {
    this.setState({leaguePassVal: event.target.value});
  }

  onLeagueSportChange(event) {
    this.setState({leagueSportVal: event.target.value});
  }

  joinRadioClicked(event) {
    this.setState({
      leagueType: 'join',
      submitBtnText: 'Join'
    });
    ns.postNotification(NOTIF_MODAL_TYPE_CHANGE, 'join');
  }

  createRadioClicked(event) {
    this.setState({
      leagueType: 'create',
      submitBtnText: 'Create'
    });
    ns.postNotification(NOTIF_MODAL_TYPE_CHANGE, 'create');
  }

  generateFormContents = () => {
    if (this.state.leagueType == 'join') {
      return (
        <div className='join-form'>
          <div className='form-group'>
            <label><strong>League Name</strong></label>
            <input type='text' className='form-control' value={this.state.leagueNameVal} onChange={this.onLeagueNameChange} placeholder='' />
          </div>
          <div className='form-group'>
            <label><strong>League Password</strong></label>
            <input type='text' className='form-control' value={this.state.leaguePassVal} onChange={this.onLeaguePassChange} placeholder='' />
          </div>
        </div>
      );
    } else {
      return (
        <div className='create-form'>
          <div className='form-group'>
            <label><strong>League Sport</strong></label>
            <select className='custom-select' value={this.state.leagueSportVal} onChange={this.onLeagueSportChange}>
              <option value='ncaa-mens'>NCAA Men's Basketball</option>
            </select>
          </div>
          <div className='form-group'>
            <label><strong>League Name</strong></label>
            <input type='text' className='form-control' value={this.state.leagueNameVal} onChange={this.onLeagueNameChange} placeholder='' />
          </div>
          <div className='form-group'>
            <label><strong>League Password</strong></label>
            <input type='text' className='form-control' value={this.state.leaguePassVal} onChange={this.onLeaguePassChange} placeholder='' />
          </div>
        </div>
      );
    }
  }

  render() {
    var joinChecked = false;
    var createChecked = false;

    if (this.state.leagueType == 'join') {
      joinChecked = true;
    } else if (this.state.leagueType == 'create') {
      createChecked = true;
    }

    return (
      <div className='league-form'>
        <form>
          <div className='form-check form-check-inline'>
            <input className='form-check-input' type='radio' name='league-type' onClick={this.joinRadioClicked} defaultChecked={joinChecked} />
            <label className='form-check-label'>Join</label>
          </div>
          <div className='form-check form-check-inline'>
            <input className='form-check-input' type='radio' name='league-type' onClick={this.createRadioClicked} defaultChecked={createChecked} />
            <label className='form-check-label'>Create</label>
          </div>
          {this.generateFormContents()}
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <Button btnType='submit' btnClass='btn btn-primary btn-block' onClick={this.leagueSubmission} btnValue={this.state.submitBtnText} />
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default LeagueForm;