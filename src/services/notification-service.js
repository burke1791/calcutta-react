export const NOTIF_MODAL_TOGGLE = 'notif_modal_toggle';
export const NOTIF_AUTH_SUBMIT = 'notif_auth_submit';
export const NOTIF_SIGNIN = 'notif_signin';
export const NOTIF_SIGNOUT = 'notif_signout';
export const NOTIF_LEAGUE_SUBMIT = 'notif_league_submit';
export const NOTIF_MODAL_TYPE_CHANGE = 'notif_modal_type_change';
export const NOTIF_LEAGUE_JOINED = 'notif_league_joined';
export const NOTIF_LEAGUE_CREATED = 'notif_league_created';
export const NOTIF_AUCTION_CHANGE = 'notif_auction_change';
export const NOTIF_AUCTION_START_CLOCK = 'notif_auction_start_clock';
export const NOTIF_AUCTION_RESTART_CLOCK = 'notif_auction_restart_clock';
export const NOTIF_AUCTION_ITEM_COMPLETE = 'notif_auction_item_complete';

var observers = {};
let instance = null;

class NotificationService {
  constructor() {
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  removeObserver = (observer, notifName) => {
    var obs = observers[notifName];

    if (obs) {
      for (var x = 0; x < obs.length; x++) {
        if (observer === obs[x].observer) {
          obs.splice(x, 1);
          observers[notifName] = obs;
          break;
        }
      }
    }
  }

  addObserver = (notifName, observer, callBack) => {
    let obs = observers[notifName];

    if (!obs) {
      observers[notifName] = [];
    }

    let obj = {observer: observer, callBack: callBack};
    observers[notifName].push(obj);
  }

  postNotification = (notifName, data) => {
    console.log('notification: ' + notifName);
    let obs = observers[notifName];
    if (obs.length) {
      for (var x = 0; x < obs.length; x++) {
        var obj = obs[x];
        obj.callBack(data);
      }
    }
  }
}

export default NotificationService;
