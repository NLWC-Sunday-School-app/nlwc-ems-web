const api = process.env.API_URL ?? "http://localhost:4000";

export default {
  transpilePackages: ["@nlwc/ui", "@nlwc/domain"],
  // The browser only ever talks to this origin, so the API's session cookie is first-party and the CSRF double-submit
  // works without CORS. In production put both behind one host and keep the same /api/v1 prefix.
  // The Children page became the Dependants section of the profile.
  async redirects() {
    return [{ source: "/children", destination: "/profile#pf-kids", permanent: true }];
  },
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
};
