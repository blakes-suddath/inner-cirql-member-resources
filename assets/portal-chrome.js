/* Inner Cirql portal chrome — a discreet "signed in / sign out" pill on gated pages.
   Non-critical enhancement: the auth gate itself lives inline in each page head. */
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  fetch("/.netlify/functions/me", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.authenticated) ready(function () { mount(d); }); })
    .catch(function () {});

  function mount(d) {
    if (document.getElementById("ic-portal-chrome")) return;
    var first = ((d.name || "Member").trim().split(/\s+/)[0]) || "Member";

    var css = document.createElement("style");
    css.textContent =
      "#ic-portal-chrome{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:10px;" +
      "background:#fff;border:1px solid rgba(26,26,26,0.10);border-radius:999px;padding:7px 8px 7px 14px;" +
      "box-shadow:0 2px 6px rgba(26,26,26,0.06),0 14px 30px -14px rgba(26,26,26,0.28);" +
      "font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}" +
      "#ic-portal-chrome .who{font-size:12px;color:rgba(26,26,26,0.62);font-weight:600;white-space:nowrap;}" +
      "#ic-portal-chrome .who b{color:#1a1a1a;font-weight:700;}" +
      "#ic-portal-chrome .dot{width:6px;height:6px;border-radius:50%;background:#3f9668;flex:0 0 auto;}" +
      "#ic-signout{border:0;cursor:pointer;background:#1a1a1a;color:#fff;border-radius:999px;padding:7px 13px;" +
      "font:inherit;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;transition:background .18s;}" +
      "#ic-signout:hover{background:#c9a96e;}" +
      "@media(max-width:560px){#ic-portal-chrome .who{display:none;}}";
    document.head.appendChild(css);

    var bar = document.createElement("div");
    bar.id = "ic-portal-chrome";
    bar.innerHTML =
      '<span class="dot"></span><span class="who">Signed in &middot; <b></b></span>' +
      '<button id="ic-signout" type="button">Sign out</button>';
    document.body.appendChild(bar);
    bar.querySelector(".who b").textContent = first;

    document.getElementById("ic-signout").addEventListener("click", function () {
      this.disabled = true; this.textContent = "…";
      fetch("/.netlify/functions/logout", { method: "POST", credentials: "same-origin" })
        .then(function () { location.replace("/login/"); })
        .catch(function () { location.replace("/login/"); });
    });
  }
})();
