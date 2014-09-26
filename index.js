/*
 * store original global keys
 */

var blacklist = Object.keys(global);
blacklist.push('constructor');

/*
 * simple jsdom integration.
 * You can pass jsdom options in, too:
 *
 *     require('./support/jsdom')({
 *       src: [jquery]
 *     });
 */

module.exports = function (options) {
  if (!options) options = {};

  var keys = [];

  var html = options.html ||
    "<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>";

  var useConsole = options.console;
  if (typeof console === 'undefined') console = true;

  /*
   * register jsdom before the entire test suite
   */

  global.before(function (next) {
    require('jsdom').env({
      html: html,
      scripts: options.scripts,
      src: options.src,
      done: done
    });

    function done (errors, window) {
      propagateToGlobal(window);
      if (useConsole) window.console = global.console;
      if (errors) return rethrow(errors);
      next(null);
    }
  });

  /*
   * undo keys from being propagated to global after the test suite
   */

  global.after(function () {
    keys.forEach(function (key) {
      delete global[key];
    });
  });

  /*
   * propagate keys from `window` to `global`
   */

  function propagateToGlobal (window) {
    for (var key in window) {
      if (!window.hasOwnProperty(key)) continue;
      if (~blacklist.indexOf(key)) continue;
      if (key in global) {
        console.warn("[jsdom] Warning: skipping global['"+key+"']");
        continue;
      }

      keys.push(key);
      global[key] = window[key];
    }
  }

  /*
   * re-throw
   */

  function rethrow (errors) {
    var data = errors[0].data;
    var err = data.error;
    err.message = err.message + " [jsdom]";
    throw err;
  }

};
