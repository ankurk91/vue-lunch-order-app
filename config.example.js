// This file will be exposed to browser.
// Don't put any sensitive information here.
module.exports = {
  oauth: {
    clientID: 'CLIENT_ID_HERE', // get from here - https://console.developers.google.com
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/userinfo.email']
  },
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_FROM_HERE/edit
  spreadsheetId: 'SPREADSHEET_ID_HERE', // get spreadsheet id from spreadsheet url
  templateSheetID: 'TEMPLATE_SHEET_ID_HERE' // usually 0 for the first sheet, gid value from url
};
