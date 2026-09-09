/**
 * Corp Task Tracker — Apps Script backend
 *
 * Reads the team task sheet server-side, caches the result, and serves it
 * as JSON to the GitHub Pages frontend (index.html). A time-driven trigger
 * (installed once via setupTrigger) refreshes the cache every hour, so
 * doGet() never has to hit the Sheet directly on a visitor's request.
 *
 * Setup:
 *   1. Paste this file into an Apps Script project (Extensions > Apps
 *      Script from the Sheet, or a new project at script.google.com).
 *   2. Run `setupTrigger` once from the editor (▶ button) — authorize
 *      when prompted. This also runs refreshCache() immediately so the
 *      cache isn't empty before the first hourly tick.
 *   3. Deploy > New deployment > Web app.
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy the deployed /exec URL into APPS_SCRIPT_URL in index.html.
 */

var SHEET_ID = '1RB_CLpnvJeJXaS9LU3lKwEV-srS4Ha9MdiSBrOLTyr0';
var SHEET_TAB_NAME = 'ติดตามงาน'; // reads this tab only — the "ประวัติอัปเดตงาน" (update history) tab is not used yet
var CACHE_KEY = 'taskCache';
var CACHE_TS_KEY = 'taskCacheAt';
var CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // if the hourly trigger ever stops firing, refetch anyway after 2h

function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var cached = props.getProperty(CACHE_KEY);
  var cachedAt = Number(props.getProperty(CACHE_TS_KEY) || 0);
  var stale = !cached || (Date.now() - cachedAt) > CACHE_MAX_AGE_MS;

  var payload;
  if (stale) {
    payload = refreshCache();
  } else {
    payload = JSON.parse(cached);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Rebuilds the cache from the live sheet. Called by the hourly trigger and as a fallback from doGet. */
function refreshCache() {
  var sheet = getSheetByName_(SHEET_ID, SHEET_TAB_NAME);
  var values = sheet.getDataRange().getValues();
  var tasks = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = row[0];
    if (!/^\d+$/.test(String(id).trim())) continue; // only real task rows have a numeric id; skips title/instructions/header/example rows
    var title = String(row[1] || '').trim();
    if (!title) continue; // skip blank placeholder rows

    tasks.push({
      id: String(id),
      title: title,
      type: String(row[2] || ''),
      owner: String(row[3] || ''),
      addedDate: toISO_(row[4]),
      dueDate: toISO_(row[5]),
      priority: String(row[6] || ''),
      status: String(row[7] || ''),
      lastUpdateDate: toISO_(row[9]),
      lastUpdateNote: String(row[10] || ''),
      note: String(row[11] || '')
    });
  }

  var payload = { tasks: tasks, generatedAt: new Date().toISOString() };
  var props = PropertiesService.getScriptProperties();
  props.setProperty(CACHE_KEY, JSON.stringify(payload));
  props.setProperty(CACHE_TS_KEY, String(Date.now()));
  return payload;
}

/** One-off setup: run manually from the Apps Script editor. */
function setupTrigger() {
  // Clear any existing refreshCache triggers first so re-running this is safe.
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'refreshCache') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('refreshCache').timeBased().everyHours(1).create();
  refreshCache(); // warm the cache immediately
}

function toISO_(v) {
  if (!v) return null;
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return null;
}

function getSheetByName_(spreadsheetId, name) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('ไม่พบแท็บชื่อ "' + name + '" ในสเปรดชีต — ตรวจสอบชื่อแท็บให้ตรงกับตัวแปร SHEET_TAB_NAME');
  }
  return sheet;
}
