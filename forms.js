// Paste the Google Apps Script web app URL here after you deploy sheet-backend.gs
const FORM_URL = "https://script.google.com/macros/s/AKfycbzu-qa0mw3w8RlMPt9iKWoCcJlfHe86aGqd89THY-5JOu_ZF25GvfHlsUeaKr7Vyembcw/exec";

(function () {
  const forms = document.querySelectorAll(".invite-block");

  function markSending(form) {
    form.classList.add("is-sending");
    form.setAttribute("aria-busy", "true");
    form.querySelectorAll("textarea, input[type='email']").forEach(function (el) {
      el.readOnly = true;
    });
  }

  function markSent(form) {
    form.classList.remove("is-sending");
    form.classList.add("is-sent");
    form.removeAttribute("aria-busy");
    form.querySelectorAll("button[type='submit']").forEach(function (btn) {
      btn.disabled = true;
    });
  }

  forms.forEach(function (form) {
    const frame = document.querySelector('iframe[name="' + form.target + '"]');
    var pending = false;
    var failSafe = null;

    function finish() {
      if (!pending) return;
      pending = false;
      window.clearTimeout(failSafe);
      markSent(form);
      form.reset();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (form.classList.contains("is-sending") || form.classList.contains("is-sent")) {
        return;
      }

      const honey = form.querySelector(".hp");
      if (honey && honey.value) {
        markSent(form);
        return;
      }
      if (!FORM_URL) return;

      markSending(form);
      form.action = FORM_URL;
      pending = true;
      failSafe = window.setTimeout(finish, 10000);

      if (window.posthog) {
        var kind = form.querySelector("input[name='kind']");
        window.posthog.capture("form_submitted", { kind: kind ? kind.value : "unknown" });
      }

      window.setTimeout(function () {
        form.submit();
        form.querySelectorAll("button[type='submit']").forEach(function (btn) {
          btn.disabled = true;
        });
      }, 50);
    });

    if (!frame) return;

    frame.addEventListener("load", finish);
  });
})();
