"""Seeds a local API with a free, open Bible Bootcamp 2026 through the real staff endpoints (two bootstrap admins, so the
drafter and approver of the rate differ). Needs the API's env (see e2e/README.md) because it runs --bootstrap-admin."""
import json, hmac, hashlib, struct, time, base64, subprocess, os, sys, urllib.request, http.cookiejar, urllib.parse

API = os.environ.get("API_URL", "http://localhost:4010")
BASE = API + "/api/v1"
API_DLL = os.environ.get("API_DLL", "/tmp/nlwc-web-api/nlwc.ems.api.dll")
PG = os.environ.get("PG_CONTAINER", "nlwc-web-pg")   # the MySQL container
PG_DB = os.environ.get("PG_DB", "nlwc_web")
ORIGIN = "http://localhost:3000"

def totp(secret):
    key = base64.b32decode(secret + "=" * (-len(secret) % 8))
    counter = struct.pack(">Q", int(time.time()) // 30)
    h = hmac.new(key, counter, hashlib.sha1).digest()
    o = h[-1] & 15
    return "%06d" % ((struct.unpack(">I", h[o:o+4])[0] & 0x7fffffff) % 1000000)

class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
    def csrf(self):
        for c in self.jar:
            if c.name == "nlwc_csrf": return c.value
    def call(self, method, path, body=None):
        req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body if body is not None else {}).encode() if method != "GET" else None)
        req.add_header("Content-Type", "application/json"); req.add_header("Origin", ORIGIN)
        if self.csrf(): req.add_header("X-CSRF-Token", self.csrf())
        try:
            r = self.op.open(req); return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

def admin(email):
    c = Client()
    print(c.call("POST", "/auth/signup", {"email": email, "password": "correct horse battery", "givenName": "Admin", "familyName": email[:5]})[0])
    env = dict(os.environ)
    out = subprocess.run(["dotnet", API_DLL, "--no-launch-profile", "--bootstrap-admin", email], env=env, capture_output=True, text=True)
    print(out.stdout.strip()[-80:])
    s, d = c.call("POST", "/auth/login", {"email": email, "password": "correct horse battery", "surface": "Admin"}); assert s == 200, d
    s, d = c.call("POST", "/auth/mfa/enroll"); secret = urllib.parse.parse_qs(urllib.parse.urlparse(d["data"]["otpauthUri"]).query)["secret"][0]
    s, d = c.call("POST", "/auth/mfa/verify", {"code": totp(secret)}); assert s == 200, d
    return c

a = admin("seed-a@example.com"); b = admin("seed-b@example.com")
def account_id(c):
    return c.call("GET", "/auth/me")[1]["data"]["personId"]
import subprocess as sp
def sql(q): return sp.run(["docker","exec","-e","MYSQL_PWD=pw",PG,"mysql","-uroot","-N","-B",PG_DB,"-e",q],capture_output=True,text=True).stdout.strip()
aid = sql("select id from accounts where email='seed-a@example.com'"); bid = sql("select id from accounts where email='seed-b@example.com'")
print("grant", a.call("POST", "/rolegrant", {"accountId": aid, "role": "event_admin", "reason": "seed"})[0], a.call("POST", "/rolegrant", {"accountId": bid, "role": "finance_officer", "reason": "seed"})[0])
s, d = a.call("POST", "/edition", {"templateCode": "BB", "slug": "bible-bootcamp-2026", "code": "BB26", "name": "Bible Bootcamp 2026", "startsOn": "2026-12-21", "endsOn": "2026-12-23",
    "venueName": "Faith Plaza", "venueAddress": "Igbogunu Bus Stop, Bariga, Lagos", "campMinAge": 10, "campMaxAge": 16, "pickupWindowStart": "16:00:00", "pickupWindowEnd": "18:00:00"})
print("edition", s, d.get("message")); eid = d["data"]["id"]
s, d = a.call("POST", f"/edition/{eid}/rates", {"note": "Bootcamp 2026 is free", "rules": [{"ageMin": 3, "ageMax": 16, "kind": "Free"}, {"ageMin": 17, "kind": "Free"}]}); print("rates", s)
v = d["data"]["versionId"]
print("approve", b.call("POST", f"/edition/{eid}/rates/{v}/approve")[0], "publish", b.call("POST", f"/edition/{eid}/rates/{v}/publish")[0])
for stage in ["Preview", "RegistrationOpen"]:
    s, d = a.call("POST", f"/edition/{eid}/stage", {"to": stage, "reason": "seed"}); print(stage, s, d.get("message"))
print(a.call("PUT", f"/edition/{eid}/capability/StudioRequests", {"enabled": True, "reason": "seed"})[0])
print(json.dumps(Client().call("GET", "/public/edition/bible-bootcamp-2026")[1]["data"])[:400])
