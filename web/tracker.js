/**
 * Deklara tracker — self-hosted, cookieless, ~1KB.
 *
 * Served from our own origin, so it is not on the ad-block lists that eat
 * roughly a fifth to a third of a crypto-literate audience when you load
 * plausible.io or google-analytics.com.
 *
 * Configure on the script tag:
 *   <script defer src="/tracker.js"
 *           data-api="https://api.kryptodeklara.ch"
 *           data-project="deklara"></script>
 *
 * Exposes window.track(name, props) and auto-sends one Pageview.
 */
(function () {
  'use strict';

  var script = document.currentScript ||
    document.querySelector('script[src*="tracker.js"]');
  var api = (script && script.dataset.api) || '';
  var project = (script && script.dataset.project) || 'deklara';

  if (!api) return; // nothing configured, stay silent rather than error

  var endpoint = api.replace(/\/+$/, '') + '/event';
  var lang = (document.documentElement.lang || '').slice(0, 2) || null;

  // Read campaign tags once. They only exist on the landing hit, so later
  // events in the same pageview still carry them.
  var params = new URLSearchParams(location.search);
  var utm = {
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
  };

  function send(name, props) {
    var payload = JSON.stringify({
      project: project,
      name: name,
      props: props || {},
      path: location.pathname,
      referrer: document.referrer || null,
      lang: lang,
      utm: utm,
    });

    // sendBeacon survives the page being closed mid-request, which a fetch
    // from a click handler does not.
    //
    // The blob MUST be text/plain. application/json is not a CORS-safelisted
    // content type, so it forces a preflight that a beacon cannot perform —
    // Chrome then drops the request silently while sendBeacon still returns
    // true, and every event disappears with no error anywhere. text/plain is
    // safelisted, so the beacon goes as a simple request. The server parses
    // the body as JSON regardless of the declared type.
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
        if (navigator.sendBeacon(endpoint, blob)) return;
      }
    } catch (e) {}

    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
        mode: 'cors',
      }).catch(function () {});
    } catch (e) {}
  }

  window.track = send;

  // Don't count our own visits while developing.
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    if (!params.has('force_track')) {
      window.track = function () {};
      return;
    }
  }

  send('Pageview');
})();
