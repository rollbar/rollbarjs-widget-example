var rollbar = require('rollbar');

var globalsetup = require('./rollbar/browser/globalSetup.js');

var rollbar = require('rollbar/dist/rollbar.noconflict.umd');
var Rollbar = new rollbar({
    accessToken: "POST_CLIENT_ITEM_ACCESS_TOKEN",
    captureUncaught: false,
    captureUnhandledRejections: true,
    payload: {
        environment: "prod"
    },
    // Example checkIgnore to ignore uncaught errors that don't have at least one
    // frame on our domain
    checkIgnore: function(isUncaught, args, payload) {
      if (isUncaught && payload.body.trace) {
        // if we have a stack trace, ensure at least one filename contains 'localhost'
        return !payload.body.trace.frames.some(function(elem, index, arr) {
          return elem.filename.indexOf("localhost") !== -1;
        });
      }
      // if no trace, don't ignore
      return false;
    }
});

/* begin code copied from rollbar/browser/globalSetup.js */

function captureUncaughtExceptions(window, handler, shim) {
  if (!window) { return; }
  var oldOnError;

  if (typeof handler._rollbarOldOnError === 'function') {
    oldOnError = handler._rollbarOldOnError;
  } else if (window.onerror && !window.onerror.belongsToShim) {
    oldOnError = window.onerror;
    handler._rollbarOldOnError = oldOnError;
  }

  var fn = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    _rollbarWindowOnError(window, handler, oldOnError, args);
  };
  fn.belongsToShim = shim;
  window.onerror = fn;
}

function _rollbarWindowOnError(window, r, old, args) {
  if (window._rollbarWrappedError) {
    if (!args[4]) {
      args[4] = window._rollbarWrappedError;
    }
    if (!args[5]) {
      args[5] = window._rollbarWrappedError._rollbarContext;
    }
    window._rollbarWrappedError = null;
  }

  r.handleUncaughtException.apply(r, args);
  if (old) {
    old.apply(window, args);
  }
}

/* end copied code */

// instrument uncaught error handler
captureUncaughtExceptions(window, Rollbar);
