# Lunch Order App

> This is a Single Page Application, powered by Vue JS and Google Spreadsheet.

> This app allows users to record their lunch orders in a Google Spreadsheet.

### Prerequisites
* node js >=6.9.1
* npm >=3.10.8
* Google API Web Client ID, [create here](https://console.developers.google.com/)
    * Enable Google Sheets API
    * Enable Google+ API
    * White list ```http://localhost:9000```
* A Google Spreadsheet to use as database (see config.example.js)
* Users should have write permission on spreadsheet

### Run on localhost
* Create a new [Google Spreadsheet](https://sheets.google.com)
* Create a empty sheet within this spreadsheet, name it ```Template```, see template format below
* Clone this repo
* Create ```config.js``` file on project root, copy from ```config.example.js```
* Fill valid details in config.js file
```
# Install dependencies
npm install

# Run local server at localhost:9000
npm run dev
```
* Generate dist (production ready) folder
```
npm run build
```

### How it works
* As soon as app is initialized it loads Google API which checks if user is authenticated, if not it ask for authentication
* If user is authenticated then it loads user email and avatar, on the same time
* It loads the Google Sheet API, upon loading Sheep API
* It checks if current month sheet exists, if not, it creates a new sheet from the template sheet, if sheet exists
* It fetch all records from current sheet and check whether logged-in user has already placed order for today or not, if not
* It allows user to place his order for today


### Google SpreadSheet template format

| **ForDate**   | **ForEmail**      | **OrderedAt**       |
| ------------- |:-------------:    | ------------------: |
| 28/10/2016    | test.user@example.com  | 28/10/2016, 9:51:47 AM |
| 29/10/2016    | user.name@example.com  | 29/10/2016, 10:51:47 AM |


### Resources
* [Google Sheep JS API](https://developers.google.com/sheets/quickstart/js)
* [Vue.js](https://vuejs.org/)
* [Webpack](https://github.com/webpack/webpack)

### TODOs
* Implement policies and restrictions
* Allow cancel today order
* Show today records in table

### License
MIT License
