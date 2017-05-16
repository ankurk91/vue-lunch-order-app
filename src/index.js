'use strict';

// JS
import 'tether';
import 'jquery';
import 'bootstrap';

// Styles
require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');
require('./css/app.css');

// Init app on document ready event
document.addEventListener("DOMContentLoaded", function () {
  require('./js/app.js');
});
