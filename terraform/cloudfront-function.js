// CloudFront viewer-request function for explore.dig.net.
//
// The build prerenders every app detail page to dist/app/<slug>/index.html so crawlers and link
// unfurlers get per-app head tags from the INITIAL response. S3 origins don't resolve directory
// indexes, so this function maps:
//   /app/<slug>            -> /app/<slug>/index.html   (the canonical, extensionless form)
//   any path ending in "/" -> ...index.html            (directory index, incl. /app/<slug>/)
// Everything else passes through; a true miss falls back to /index.html via the distribution's
// custom error responses (SPA routing).
//
// CloudFront Functions runtime (cloudfront-js-2.0) — keep this file dependency-free.

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  } else if (/^\/app\/[a-z0-9-]+$/.test(uri)) {
    request.uri = uri + "/index.html";
  }

  return request;
}
