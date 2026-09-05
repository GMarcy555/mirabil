// Másold ezt a Google Táblázatba: Bővítmények → Apps Script
// 1. Első sor a táblázatban: Idő | Típus | Sztori | Email
// 2. Mentés, majd Deploy → New deployment → Web app
//    Execute as: Me
//    Who has access: Anyone
// 3. A kapott URL-t illeszd a forms.js FORM_URL mezőjébe

function doPost(e) {
  var params = (e && e.parameter) || {};
  if (params.website) {
    return ContentService.createTextOutput("ok");
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([
    new Date(),
    params.kind || "",
    params.story || "",
    params.email || "",
  ]);
  return ContentService.createTextOutput("ok");
}

function doGet() {
  return ContentService.createTextOutput("ok");
}
