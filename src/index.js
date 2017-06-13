'use strict';

// JS
require('tether');
window.$ = window.jQuery = require('jquery');
require('bootstrap');

// Styles
require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');
require('./css/app.css');

// Init app on document ready event
document.addEventListener("DOMContentLoaded", function () {
  require('./js/app.js');
});
