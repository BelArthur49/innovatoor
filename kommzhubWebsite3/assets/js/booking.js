/* ==========================================================
   BOOKING / ENQUIRY FORM
   The fields come from the "fields" list in the page's JSON file
   (or a standard set if none is given). Requests are sent straight
   to the inbox with FormSubmit (https://formsubmit.co). The first
   request ever sent triggers a one-time activation email to the
   receiving address: open it and click "Activate Form".
   If sending fails (or provider is "mailto"), the visitor's own
   email app opens with everything filled in.
   ========================================================== */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function today() {
    var d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  var DEFAULT_FIELDS = function (cfg) {
    return [
      { name: "request", label: cfg.requestLabel || "What do you need?", type: "select", options: cfg.requestOptions || [], required: true },
      { name: "name", label: "Full name", type: "text", required: true, half: true },
      { name: "email", label: "Email address", type: "email", required: true, half: true },
      { name: "phone", label: "Phone number", type: "tel", half: true },
      { name: "organisation", label: "Organisation", type: "text", half: true },
      { name: "preferred_date", label: "Preferred date", type: "date" },
      { name: "message", label: "Tell us more", type: "textarea", required: true, placeholder: "What are you working on, and when do you need it?" }
    ];
  };
  var AUTOCOMPLETE = { name: "name", email: "email", phone: "tel", organisation: "organization" };

  function fieldHTML(f) {
    var id = "bk-" + f.name;
    var req = f.required ? " required" : "";
    var opt = f.required ? "" : ' <span class="optional">(optional)</span>';
    var ac = AUTOCOMPLETE[f.name] ? ' autocomplete="' + AUTOCOMPLETE[f.name] + '"' : "";
    var control;
    if (f.type === "select") {
      control = '<select id="' + id + '" name="' + esc(f.name) + '"' + req + '>' +
        '<option value="">Choose one</option>' +
        (f.options || []).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join("") + '</select>';
    } else if (f.type === "textarea") {
      control = '<textarea id="' + id + '" name="' + esc(f.name) + '" rows="5"' + req +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + '></textarea>';
    } else {
      control = '<input id="' + id + '" name="' + esc(f.name) + '" type="' + esc(f.type || "text") + '"' + req + ac +
        (f.type === "date" ? ' min="' + today() + '"' : "") +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + '>';
    }
    return '<div class="field' + (f.half ? " field-half" : "") + '">' +
      '<label for="' + id + '">' + esc(f.label) + opt + '</label>' + control +
      '<p class="field-error" id="' + id + '-err" aria-live="polite"></p></div>';
  }

  function init(form, cfg, opts) {
    if (!form || !cfg) return;
    opts = opts || {};
    var to = (cfg.email || "info@kommzhub.com").trim();
    var btnClass = opts.buttonClass || "btn-dark";
    var fields = (Array.isArray(cfg.fields) && cfg.fields.length ? cfg.fields : DEFAULT_FIELDS(cfg))
      .filter(function (f) { return f && f.name; });
    var subjectField = cfg.subjectField || "request";

    form.innerHTML =
      fields.map(fieldHTML).join("") +
      '<div class="hp-field" aria-hidden="true"><label>Leave this empty <input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="form-actions">' +
        '<button type="submit" class="btn ' + btnClass + '">' + esc(cfg.buttonLabel || "Send request") + '</button>' +
      '</div>' +
      '<div class="form-status" role="status" aria-live="polite" hidden></div>';

    var status = form.querySelector(".form-status");
    var submit = form.querySelector('button[type="submit"]');

    function setError(name, msg) {
      var input = form.elements[name];
      var wrap = input.closest(".field");
      var err = form.querySelector("#bk-" + name + "-err");
      wrap.classList.toggle("has-error", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg) input.setAttribute("aria-describedby", "bk-" + name + "-err"); else input.removeAttribute("aria-describedby");
      err.textContent = msg || "";
    }
    function validate() {
      var ok = true, first = null;
      fields.forEach(function (f) {
        var v = (form.elements[f.name].value || "").trim(), msg = "";
        if (f.required && !v) msg = f.type === "select" ? "Choose an option." : "Please fill in this field.";
        else if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "Enter an email address like name@example.com.";
        setError(f.name, msg);
        if (msg) { ok = false; if (!first) first = form.elements[f.name]; }
      });
      if (first) first.focus();
      return ok;
    }
    function collect() {
      var d = {};
      fields.forEach(function (f) { d[f.name] = (form.elements[f.name].value || "").trim(); });
      return d;
    }
    function subject(d) {
      return (cfg.subject || "New enquiry") + (d[subjectField] ? ": " + d[subjectField] : "");
    }
    function mailtoLink(d) {
      var lines = fields.map(function (f) { return f.label + ": " + (d[f.name] || "-"); });
      lines.push("", "Sent from: " + (opts.siteName || document.title));
      return "mailto:" + to + "?subject=" + encodeURIComponent(subject(d)) + "&body=" + encodeURIComponent(lines.join("\n"));
    }
    function show(type, title, msg, link) {
      status.hidden = false;
      status.className = "form-status is-" + type;
      status.innerHTML = (title ? '<p class="form-status-title">' + esc(title) + '</p>' : "") + '<p>' + esc(msg) + '</p>' +
        (link ? '<a class="btn ' + btnClass + '" href="' + esc(link) + '">Open my email app</a>' : "");
      status.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    form.addEventListener("input", function (e) {
      if (e.target.closest(".field.has-error")) setError(e.target.name, "");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.hidden = true;
      if (form.elements._honey.value) return;
      if (!validate()) return;
      var d = collect();
      var link = mailtoLink(d);

      if ((cfg.provider || "formsubmit") === "mailto") {
        window.location.href = link;
        show("success", "", "Your email app should open with the message filled in. Press send there to finish.", link);
        return;
      }

      submit.classList.add("is-busy");
      submit.setAttribute("aria-busy", "true");
      var original = submit.textContent;
      submit.textContent = "Sending…";

      var payload = { _subject: subject(d), _template: "table", _captcha: "false", Website: opts.siteName || document.title };
      fields.forEach(function (f) {
        var key = f.type === "email" ? "email" : f.label;
        payload[key] = d[f.name] || "-";
      });

      fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!(res.ok && (res.j.success === true || res.j.success === "true"))) throw new Error();
          form.reset();
          show("success", cfg.successTitle || "", cfg.successMessage || "Request sent.");
        })
        .catch(function () { show("error", "", cfg.errorMessage || "The request could not be sent.", link); })
        .then(function () {
          submit.classList.remove("is-busy");
          submit.removeAttribute("aria-busy");
          submit.textContent = original;
        });
    });
  }

  function preselect(form, value) {
    if (!form || !value) return;
    var sel = form.querySelector("select");
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].text === value) { sel.selectedIndex = i; sel.dispatchEvent(new Event("input", { bubbles: true })); break; }
    }
  }

  window.Booking = { init: init, preselect: preselect };
})();
