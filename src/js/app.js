'use strict';

const Vue = require('vue/dist/vue.min.js');
const config = API_CONFIG;// this will be auto injected by webpack DefinePlugin

let app = new Vue({
  el: '#lunch-app',
  data: {
    user: {
      name: '',
      email: '',
      src: ''
    },
    alert: false, //alert.type, alert.message
    isLoading: true,
    showAuthCard: false,
    hideUserCard: false,
    canOrder: false

  },
  mounted() {
    console.info('Vue JS app mounted')
  },
  created() {
    console.info('Vue JS app created')
  },
  methods: {
    auth (immediate) {
      console.info('Start oauth...');
      gapi.auth.authorize(
        {
          'client_id': config.oauth.clientID,
          'scope': config.oauth.scopes.join(' '),
          'immediate': (typeof immediate === 'undefined')
        }, this.handleAuthResult);
    },
    handleAuthResult (authResult) {
      if (authResult && !authResult.error) {
        console.info('User is authenticated');
        this.showAuthCard = false;
        this.isLoading = true;
        this.getUser();
      } else {
        console.info('User is not authenticated');
        this.showAuthCard = true;
        this.isLoading = false;
      }
    },
    getUser () {
      gapi.client.load('plus', 'v1', () => {
        gapi.client.plus.people.get({
          'userId': 'me'
        }).execute((response) => {
          console.info('Got user info');
          this.updateUser(response);
          this.loadSheetAPI();
        });
      });
    },
    updateUser(response) {
      console.info('Updating user info...');
      if (typeof response === 'undefined') {
        console.error('Unable to load user info');
        this.makeAlert('danger', 'Unable to load user information, try again');
        return false;
      }
      // Assuming that email address have a dot
      let nameParts = response.emails[0].value.split('@')[0].split('.');
      this.user = {
        email: response.emails[0].value,
        image: response.image.url.split('?sz=')[0] + '?sz=150',
        name: nameParts[0] + ' ' + nameParts[1]
      };
      this.hideUserCard = true;
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
        spreadsheetId: config.spreadsheetId
      }).then((response) => {
        this.checkIfSheetExist(response);
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
        spreadsheetId: config.spreadsheetId,
        requests: [{
          duplicateSheet: {
            "sourceSheetId": config.templateSheetID,
            "newSheetName": sheetName
          }
        }]
      }).then((response) => {
        console.info('New sheet created- ' + sheetName);
        this.isLoading = false;
        this.canOrder = true;
      }, (response) => {
        console.error('Sheet was not created');
        this.isLoading = false;
      })
    },
    canOrderToday (email) {
      console.info('Get records from this month sheet....');

      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: this.currentSheet + '!A2:C'
      }).then((response) => {
        this.isLoading = false;
        console.info('Got rows from this months sheet');
        let data = response.result;

        if (data.values && data.values.length > 0) {
          let found = data.values.filter((row) => {
            if (row[0] === this.today) {
              if (row[1] === this.user.email) {
                return row;
              }
            }
          });
          if (found.length !== 0) {
            this.makeAlert('info', 'You have already ordered for today');
            console.info('You have already ordered for today');
            this.canOrder = false;
            return false;
          }
        } else {
          console.info('No data/row found in sheet- ' + this.currentSheet);
        }
        this.canOrder = true;
        return true;
      }, (response) => {
        this.isLoading = false;
        console.error('Unable to fetch rows from sheet- ' + this.currentSheet);
        return false;
      });
    },
    placeOrder() {
      this.canOrder = false;
      console.info('Saving new order...');

      gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: config.spreadsheetId,
        range: this.currentSheet + '!A2:C2',
        valueInputOption: 'USER_ENTERED',
        majorDimension: 'ROWS',
        values: [[this.today, this.user.email, new Date().toLocaleString('en-IN')]]
      }).then((response) => {
        this.makeAlert('success', 'Your order has been placed');
        console.info('New order has been placed');
      }, (response) => {
        this.makeAlert('danger', 'Unable to place order');
        console.error('Unable to place order');
      });

    },
    makeAlert (type, message) {
      this.alert = {
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

