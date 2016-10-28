'use strict';

// Note: Not using ES6

// JS files
const Vue = require('vue/dist/vue.min.js');

var app = new Vue({
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
  created: function () {
    console.info('Vue JS app created')
  },
  methods: {
    auth: function (immediate) {
      console.info('Start oauth...');
      gapi.auth.authorize(
        {
          'client_id': app.config.oauth.clientID,
          'scope': app.config.oauth.scopes.join(' '),
          'immediate': (typeof immediate == 'undefined')
        }, app.handleAuthResult);
    },
    handleAuthResult: function (authResult) {
      if (authResult && !authResult.error) {
        console.info('User is authenticated');
        app.state.showAuthCard = false;
        app.state.isLoading = true;
        app.getUserInfo();
      } else {
        console.info('User is not authenticated');
        app.state.showAuthCard = true;
        app.state.isLoading = false;
      }
    },
    getUserInfo: function () {
      gapi.client.load('plus', 'v1', function () {
        gapi.client.plus.people.get({
          'userId': 'me'
        }).execute(function (response) {
          console.info('Got user info');
          app.updateUserInfo(response);
          app.loadSheetAPI();
        });
      });
    },
    updateUserInfo: function (response) {
      console.info('Updating user info...');
      if (typeof response === 'undefined') {
        console.error('Unable to load user info');
        app.makeAlert('danger', 'Unable to load user information, try again');
        return false;
      }
      var nameParts = response.emails[0].value.split('@')[0].split('.');
      app.userInfo = {
        email: response.emails[0].value,
        image: response.image.url.split('?sz=')[0] + '?sz=150',
        name: nameParts[0] + ' ' + nameParts[1]
      };
      app.state.hideUserCard = true;
    },
    loadSheetAPI: function () {
      console.info('Loading sheet api...');
      gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4')
        .then(app.getAllSheets, function (resp) {
          console.error('Unable to load sheet api')
        });
    },
    getAllSheets: function () {
      console.info('Fetching sheet list ...');
      gapi.client.sheets.spreadsheets.get({
        spreadsheetId: app.config.spreadsheetId
      }).then(function (response) {
        app.checkIfSheetExist(response);
      }, function (response) {
        console.error('Unable to fetch sheet list');
      });
    },
    checkIfSheetExist: function (response) {
      var sheetName = app.currentSheet;
      if (response.result && response.result.sheets) {
        var found = response.result.sheets.filter(function (sheet) {
          return (sheet.properties.title == sheetName);
        });
        if (found != false) {
          console.info('Sheet exists already');
          app.canOrderToday(false);
        } else {
          app.createNewSheet(sheetName);
        }
      } else {
        console.error('Invalid sheet response');
      }
    },
    createNewSheet: function (sheetName) {
      console.info('Creating new sheet...');

      gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: app.config.spreadsheetId,
        requests: [{
          duplicateSheet: {
            "sourceSheetId": app.config.templateSheetID,
            "newSheetName": sheetName
          }
        }]
      }).then(function (response) {
        console.info('New sheet created- ' + sheetName);
        app.state.isLoading = false;
        app.state.canOrder = true;
      }, function (response) {
        console.error('Sheet was not created');
        app.state.isLoading = false;
      })
    },
    canOrderToday: function (email) {
      console.info('Get records from this month sheet....');

      gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: app.config.spreadsheetId,
        range: app.currentSheet + '!A2:C'
      }).then(function (response) {
        app.state.isLoading = false;
        console.info('Got rows from this months sheet');
        var data = response.result;

        if (data.values && data.values.length > 0) {
          var found = data.values.filter(function (row) {
            if (row[0] == app.today) {
              if (row[1] == app.userInfo.email) {
                return row;
              }
            }
          });
          if (found != false) {
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
      }, function (response) {
        app.state.isLoading = false;
        console.error('Unable to fetch rows from sheet- ' + app.currentSheet);
        return false;
      });
    },
    placeOrder: function () {
      app.state.canOrder = false;
      console.info('Saving new order...');

      gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: app.config.spreadsheetId,
        range: app.currentSheet + '!A2:C2',
        valueInputOption: 'USER_ENTERED',
        majorDimension: 'ROWS',
        values: [[app.today, app.userInfo.email, new Date().toLocaleString('en-IN')]]
      }).then(function (response) {
        app.makeAlert('success', 'Your order has been placed');
        console.info('New order has been placed');
      }, function (response) {
        app.makeAlert('danger', 'Unable to place order');
        console.error('Unable to place order');
      });

    },
    makeAlert: function (type, message) {
      app.alert = {
        type: 'alert-' + type,
        message: message
      }
    }
  },
  computed: {
    currentSheet: function () {
      return 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',')[new Date().getMonth()]
    },
    today: function () {
      var today = new Date();
      return today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();
    }
  }
});


// Expose global function
window.onSheetApiLoaded = app.auth;

