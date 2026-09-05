// Paste the Google Apps Script web app URL here after you deploy sheet-backend.gs
const FORM_URL = "https://script.google.com/macros/s/AKfycbzu-qa0mw3w8RlMPt9iKWoCcJlfHe86aGqd89THY-5JOu_ZF25GvfHlsUeaKr7Vyembcw/exec";

(function () {
  const frame = document.querySelector(".form-frame");
  const forms = document.querySelectorAll(".invite-block");
  var pending = null;

  function markSent(form) {
    form.classList.add("is-sent");
    form.querySelectorAll("button[type='submit']").forEach(function (btn) {
      btn.disabled = true;
    });
  }

  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      const honey = form.querySelector(".hp");
      if (honey && honey.value) {
        event.preventDefault();
        markSent(form);
        return;
      }
      if (!FORM_URL) {
        event.preventDefault();
        return;
      }
      form.action = FORM_URL;
      pending = form;
    });
  });

  frame.addEventListener("load", function () {
    if (!pending) return;
    markSent(pending);
    pending.reset();
    pending = null;
  });
})();
