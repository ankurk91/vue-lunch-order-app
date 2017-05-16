'use strict';

const Vue = require('vue/dist/vue.min.js');

let app = new Vue({
  el: '#lunch-app',
  data: {
    config: API_CONFIG,// this will be auto injected by webpack DefinePlugin
    userInfo: {
      name: '',
      email: '',
      src: ''
    },
    alert: false, //alert.type, alert.message
    state: {
      isLoading: true,
      showAuthCard: false,
      hideUserCard: false,
      canOrder: false
    }
  },
  mounted() {

  },
  created() {
    console.info('Vue JS app created')
  },
  methods: {
    auth (immediate) {
      console.info('Start oauth...');
      gapi.auth.authorize(
        {
          'client_id': this.config.oauth.clientID,
          'scope': this.config.oauth.scopes.join(' '),
          'immediate': (typeof immediate === 'undefined')
        }, this.handleAuthResult);
    },
    handleAuthResult (authResult) {
      if (authResult && !authResult.error) {
        console.info('User is authenticated');
        this.state.showAuthCard = false;
        this.state.isLoading = true;
        this.getUserInfo();
      } else {
        console.info('User is not authenticated');
        this.state.showAuthCard = true;
        this.state.isLoading = false;
      }
    },
    getUserInfo () {
      gapi.client.load('plus', 'v1', () => {
        gapi.client.plus.people.get({
          'userId': 'me'
        }).execute((response) => {
          console.info('Got user info');
          this.updateUserInfo(response);
          this.loadSheetAPI();
        });
      });
    },
    updateUserInfo(response) {
      console.info('Updating user info...');
      if (typeof response === 'undefined') {
        console.error('Unable to load user info');
        this.makeAlert('danger', 'Unable to load user information, try again');
        return false;
      }
      // Assuming that email address have a dot
      let nameParts = response.emails[0].value.split('@')[0].split('.');
      this.userInfo = {
        email: response.emails[0].value,
        image: response.image.url.split('?sz=')[0] + '?sz=150',
        name: nameParts[0] + ' ' + nameParts[1]
      };
      this.state.hideUserCard = true;
    },
    loadSheetAPI () {
      console.info('Loading sheet api...');
      gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4')
        .then(this.getAllSheets, (resp) => {
          console.error('Unable to load sheet api')
        });
    },
    getAllSheets () {
      console.info('Fetching sheet list ...');
      gapi.client.sheets.spreadsheets.get({
        spreadsheetId: app.config.spreadsheetId
      }).then((response) => {
        app.checkIfSheetExist(response);
      }, function (response) {
        console.error('Unable to fetch sheet list');
      });
    },
    checkIfSheetExist (response) {
      let sheetName = this.currentSheet;
      if (response.result && response.result.sheets) {
        console.log('Lets find sheet with name - ' + sheetName);
        let found = response.result.sheets.filter((sheet) => {
          console.log('Found sheet - ' + sheet.properties.title);
          return (sheet.properties.title === sheetName);
        });
        console.log(found);
        if (found.length !== 0) {
          console.info('Sheet exists already');
          this.canOrderToday(false);
        } else {
          this.createNewSheet(sheetName);
        }
      } else {
        console.error('Invalid sheet response');
      }
    },
    createNewSheet (sheetName) {
      console.info('Creating new sheet...');

      gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        requests: [{
          duplicateSheet: {
            "sourceSheetId": this.config.templateSheetID,
            "newSheetName": sheetName
          }
        }]
      }).then((response) => {
        console.info('New sheet created- ' + sheetName);
        app.state.isLoading = false;
        app.state.canOrder = true;
      }, (response) => {
        console.error('Sheet was not created');
        app.state.isLoading = false;
      })
    },
    canOrderToday (email) {
      console.info('Get records from this month sheet....');

      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: app.currentSheet + '!A2:C'
      }).then((response) => {
        app.state.isLoading = false;
        console.info('Got rows from this months sheet');
        let data = response.result;

        if (data.values && data.values.length > 0) {
          let found = data.values.filter((row) => {
            if (row[0] === app.today) {
              if (row[1] === app.userInfo.email) {
                return row;
              }
            }
          });
          if (found.length !== 0) {
            app.makeAlert('info', 'You have already ordered for today');
            console.info('You have already ordered for today');
            app.state.canOrder = false;
            return false;
          }
        } else {
          console.info('No data/row found in sheet- ' + app.currentSheet);
        }
        app.state.canOrder = true;
        return true;
      }, (response) => {
        app.state.isLoading = false;
        console.error('Unable to fetch rows from sheet- ' + app.currentSheet);
        return false;
      });
    },
    placeOrder() {
      app.state.canOrder = false;
      console.info('Saving new order...');

      gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: app.config.spreadsheetId,
        range: app.currentSheet + '!A2:C2',
        valueInputOption: 'USER_ENTERED',
        majorDimension: 'ROWS',
        values: [[app.today, app.userInfo.email, new Date().toLocaleString('en-IN')]]
      }).then((response) => {
        app.makeAlert('success', 'Your order has been placed');
        console.info('New order has been placed');
      }, (response) => {
        app.makeAlert('danger', 'Unable to place order');
        console.error('Unable to place order');
      });

    },
    makeAlert (type, message) {
      app.alert = {
        type: 'alert-' + type,
        message: message
      }
    }
  },
  computed: {
    currentSheet () {
      return 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',')[new Date().getMonth()]
    },
    today () {
      let today = new Date();
      return today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();
    }
  }
});


// Expose global function
window.onSheetApiLoaded = app.auth;

