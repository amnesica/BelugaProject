(function(window) {
    window.env = window.env || {};
  
    // Environment variables
    window["env"]["baseUrl"] = "${PROD_BASE_URL_WEBAPP}";
  })(this);