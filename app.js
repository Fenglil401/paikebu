'use strict';

/* ============================================================
   榴莲私教 · 私教课表与课时台账
   纯前端 · localStorage · 单教练 / 单门店
   ============================================================ */

const STORAGE_KEY = 'paikebu-v1';
const VIEW_KEY = 'paikebu-view';
const SLOT_FROM = 8 * 60;    // 最早 08:00
const SLOT_TO = 22 * 60;     // 最晚 22:00 结束
const HOUR_H = 54;           // 周视图每小时高度

const STATUS = {
  booked: { label: '待上', cls: 'booked' },
  done: { label: '已上', cls: 'done' },
  noshow: { label: '未到', cls: 'noshow' },
  cancel: { label: '取消', cls: 'cancel' },
};

const COLORS = ['#E8532D', '#2E6FE0', '#7A4FE0', '#C2410C', '#0E8A5F', '#DB2777', '#475569', '#65A30D'];

const ICONS = {
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8.5" r="3.3"/><path d="M3.2 19.5c0-3.1 2.6-5.2 5.8-5.2s5.8 2.1 5.8 5.2"/><path d="M16.2 5.6a3 3 0 0 1 0 5.6M17.3 19.5c0-2.2-.7-3.8-1.8-4.8 2.9-.4 5.3 1.6 5.3 4.8"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19.5V13M9.3 19.5V6.5M14.7 19.5v-8M20 19.5V4"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.2 4.2"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  download: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M8 11l4 4 4-4M5 20h14"/></svg>',
  gear: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9.2a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6.5 4.5h3l1.2 3.4-2 1.3a10.5 10.5 0 0 0 6.1 6.1l1.3-2 3.4 1.2v3a1.8 1.8 0 0 1-2 1.8C11 18.6 5.4 13 4.7 6.5a1.8 1.8 0 0 1 1.8-2Z"/></svg>',
};

const icon = (n) => ICONS[n] || '';

/* ------------------------------ 工具 ------------------------------ */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (y, m, d) => y + '-' + pad(m) + '-' + pad(d);

function toISO(d) { return isoOf(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
function todayISO() { return toISO(new Date()); }
function parseISO(s) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
function startOfWeek(iso) { const d = parseISO(iso); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return toISO(d); }
function weekday(iso) { return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parseISO(iso).getDay()]; }
function weekdayShort(iso) { return ['日', '一', '二', '三', '四', '五', '六'][parseISO(iso).getDay()]; }
function dateCN(iso) { const d = parseISO(iso); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
function monthCN(iso) { const d = parseISO(iso); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月'; }
function toMin(t) { const p = t.split(':').map(Number); return p[0] * 60 + p[1]; }
function fromMin(n) { return pad(Math.floor(n / 60)) + ':' + pad(n % 60); }
function overlaps(s1, d1, s2, d2) { const a = toMin(s1), b = toMin(s2); return a < b + d2 && b < a + d1; }
function nowMin() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
function fmtHours(h) { const v = Math.round(h * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); }

function monthBounds(iso) {
  const d = parseISO(iso);
  const y = d.getFullYear(), m = d.getMonth() + 1;
  const last = new Date(y, m, 0).getDate();
  return { start: isoOf(y, m, 1), end: isoOf(y, m, last) };
}
function weekBounds(iso) {
  const s = startOfWeek(iso);
  return { start: s, end: addDays(s, 6) };
}
function yearBounds(iso) {
  const y = parseISO(iso).getFullYear();
  return { start: isoOf(y, 1, 1), end: isoOf(y, 12, 31) };
}

/* ------------------------------ 演示数据 ------------------------------ */
function seed() {
  const today = todayISO();
  const y = parseISO(today).getFullYear();
  const members = [
    { id: 'm1', name: '张伟', phone: '138 0013 8000', total: 0, adjust: 0, note: '减脂期，膝部旧伤', createdAt: addDays(today, -150) },
    { id: 'm2', name: '李娜', phone: '139 2233 4455', total: 0, adjust: 0, note: '备赛形体，重点臀腿', createdAt: addDays(today, -180) },
    { id: 'm3', name: '王强', phone: '137 8899 1020', total: 0, adjust: 0, note: '久坐腰劳损，先做核心激活', createdAt: addDays(today, -120) },
    { id: 'm4', name: '陈晨', phone: '158 6677 8899', total: 0, adjust: 0, note: '新会员，体态评估已完成', createdAt: addDays(today, -90) },
    { id: 'm5', name: '刘洋', phone: '186 5544 3322', total: 0, adjust: 0, note: '增肌期，训练后加拉伸', createdAt: addDays(today, -80) },
    { id: 'm6', name: '周琳', phone: '135 1122 3344', total: 0, adjust: 0, note: '课时已用完，待续课', createdAt: addDays(today, -60) },
  ];

  const plans = [
    { id: 'm1', days: [1, 4], start: '10:00', duration: 60 },
    { id: 'm2', days: [2, 5], start: '19:00', duration: 60 },
    { id: 'm3', days: [1, 3], start: '09:00', duration: 60 },
    { id: 'm4', days: [2, 6], start: '14:00', duration: 45 },
    { id: 'm5', days: [3, 5], start: '11:00', duration: 60 },
    { id: 'm6', days: [4], start: '16:00', duration: 60 },
  ];

  const courses = [];
  const notes = { m1: '深蹲 4×8，硬拉 3×6', m2: '臀桥 + 侧平举', m3: '核心激活 + 硬拉', m4: '体态评估复核', m5: '背阔 + 二头', m6: '下肢耐力' };

  for (let i = 100; i >= 2; i -= 1) {
    const date = addDays(today, -i);
    const wd = parseISO(date).getDay();
    plans.forEach((p) => {
      if (p.days.indexOf(wd) < 0) return;
      let status = 'done';
      if (i === 9 && p.id === 'm3') status = 'noshow';
      if (i === 16 && p.id === 'm5') status = 'cancel';
      courses.push({
        id: uid(), memberId: p.id, date, start: p.start, duration: p.duration,
        status, note: i % 7 === 0 ? (notes[p.id] || '') : '',
        createdAt: new Date().toISOString(),
      });
    });
  }

  // 今天：已结束的记为已上，未开始的记为待上
  [[10, 'm1', 60], [14, 'm4', 45], [19, 'm2', 60]].forEach((row) => {
    const end = row[0] * 60 + row[2];
    courses.push({
      id: uid(), memberId: row[1], date: today, start: pad(row[0]) + ':00', duration: row[2],
      status: end <= nowMin() ? 'done' : 'booked',
      note: row[1] === 'm1' ? '今天重点：下肢力量 + 核心' : '',
      createdAt: new Date().toISOString(),
    });
  });

  // 明天 / 后天：待上
  [[1, '09:00', 'm3', 60], [1, '15:00', 'm1', 60], [2, '11:00', 'm5', 60]].forEach((row) => {
    courses.push({
      id: uid(), memberId: row[2], date: addDays(today, row[0]), start: row[1], duration: row[3],
      status: 'booked', note: '', createdAt: new Date().toISOString(),
    });
  });

  const extra = { m1: 8, m2: 10, m3: 3, m4: 12, m5: 6, m6: 0 };
  members.forEach((m) => {
    const used = courses.filter((c) => c.memberId === m.id && (c.status === 'done' || c.status === 'noshow')).length;
    m.total = used + (extra[m.id] || 0);
  });
  members[2].adjust = 1;

  const logs = [{
    id: uid(), memberId: 'm3', type: 'adjust', delta: 1,
    reason: '上月考勤补录 1 节', date: addDays(today, -3), createdAt: new Date().toISOString(),
  }];

  return {
    version: 1,
    coach: { name: '林一', studio: '榴莲私教 · 静安店' },
    settings: { countNoShow: true },
    members,
    courses,
    logs,
    year: y,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.members) && Array.isArray(s.courses)) {
        if (!s.settings) s.settings = { countNoShow: true };
        if (!Array.isArray(s.logs)) s.logs = [];
        if (!s.coach) s.coach = { name: '教练', studio: '' };
        return s;
      }
    }
  } catch (err) { /* 损坏数据回落到演示数据 */ }
  const fresh = seed();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch (err) { /* 忽略 */ }
  return fresh;
}

let state = loadState();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* 忽略 */ }
}
function saveView() {
  try { localStorage.setItem(VIEW_KEY, ui.view); } catch (err) { /* 忽略 */ }
}
function loadView() {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === 'day' || v === 'week') return v;
  } catch (err) { /* 忽略 */ }
  return 'day';
}

/* ------------------------------ 界面状态 ------------------------------ */
const TABS = ['schedule', 'add', 'members', 'report'];

function tabFromHash() {
  const h = (location.hash || '').replace('#', '');
  return TABS.indexOf(h) >= 0 ? h : 'schedule';
}

function nextSlot() {
  const n = new Date();
  let m = Math.ceil((n.getHours() * 60 + n.getMinutes() + 15) / 30) * 30;
  m = Math.min(Math.max(m, SLOT_FROM), SLOT_TO - 60);
  return fromMin(m);
}

function newDraft(date) {
  const d = date || todayISO();
  const past = d < todayISO();
  return {
    id: null,
    memberId: null,
    date: d,
    start: past ? '10:00' : nextSlot(),
    duration: 60,
    status: past ? 'done' : 'booked',
    note: '',
  };
}

const ui = {
  tab: tabFromHash(),
  date: todayISO(),
  view: loadView(),
  reportMode: 'month',
  reportAnchor: todayISO(),
  draft: null,
  memberQuery: '',
  sheet: null,
  courseDraft: null,
  pending: null,
};

/* ------------------------------ 查询 / 统计 ------------------------------ */
const memberOf = (id) => state.members.find((m) => m.id === id);
const consumedCount = (id) => state.courses.filter((c) => c.memberId === id && (c.status === 'done' || (state.settings.countNoShow && c.status === 'noshow'))).length;
const remainingOf = (m) => m.total + (m.adjust || 0) - consumedCount(m.id);

function memberColor(m) {
  if (!m) return '#8A837A';
  let h = 0;
  for (let i = 0; i < m.id.length; i += 1) h = (h * 31 + m.id.charCodeAt(i)) % 997;
  return COLORS[h % COLORS.length];
}

function avatarHTML(m, cls) {
  const name = m ? m.name : '?';
  return '<span class="avatar ' + (cls || '') + '" style="--c:' + memberColor(m) + '">' + esc(name.slice(0, 1)) + '</span>';
}

function coursesOn(date) {
  return state.courses
    .filter((c) => c.date === date)
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}

function statsIn(memberId, start, end) {
  const list = state.courses.filter((c) => c.memberId === memberId && c.date >= start && c.date <= end);
  const out = { done: 0, noshow: 0, cancel: 0, booked: 0, minutes: 0, total: list.length };
  list.forEach((c) => {
    if (c.status === 'done') { out.done += 1; out.minutes += c.duration; }
    else if (c.status === 'noshow') { out.noshow += 1; if (state.settings.countNoShow) out.minutes += c.duration; }
    else if (c.status === 'cancel') out.cancel += 1;
    else out.booked += 1;
  });
  out.consumed = out.done + (state.settings.countNoShow ? out.noshow : 0);
  return out;
}

function findConflict(d) {
  return state.courses.find((c) => c.id !== d.id && c.status !== 'cancel' && c.date === d.date &&
    overlaps(c.start, c.duration, d.start, d.duration));
}

function validateDraft(d) {
  if (!d.memberId || !memberOf(d.memberId)) return '请先选择会员';
  if (!/^\d{2}:\d{2}$/.test(d.start || '')) return '请选择开始时间';
  if (!(d.duration >= 30 && d.duration <= 240)) return '时长请设置在 30–240 分钟';
  if (toMin(d.start) < SLOT_FROM) return '最早从 08:00 开始排课';
  if (toMin(d.start) + d.duration > SLOT_TO) return '课程结束时间不能晚于 22:00';
  if (findConflict(d)) return '这个时间段已经有课了';
  return null;
}

function currentPeriod() {
  const a = ui.reportAnchor;
  if (ui.reportMode === 'week') {
    const b = weekBounds(a);
    return { mode: 'week', start: b.start, end: b.end, label: dateCN(b.start) + ' – ' + dateCN(b.end) };
  }
  if (ui.reportMode === 'year') {
    const b = yearBounds(a);
    return { mode: 'year', start: b.start, end: b.end, label: parseISO(a).getFullYear() + '年' };
  }
  const b = monthBounds(a);
  return { mode: 'month', start: b.start, end: b.end, label: monthCN(a) };
}

function shiftPeriod(delta) {
  const a = ui.reportAnchor;
  if (ui.reportMode === 'week') {
    ui.reportAnchor = addDays(a, delta * 7);
  } else if (ui.reportMode === 'year') {
    const d = parseISO(a);
    ui.reportAnchor = isoOf(d.getFullYear() + delta, 1, 1);
  } else {
    const d = parseISO(a);
    const nd = new Date(d.getFullYear(), d.getMonth() + delta, 1);
    ui.reportAnchor = toISO(nd);
  }
}

function lastSixMonths(memberId) {
  const out = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear(), m = d.getMonth() + 1;
    const start = isoOf(y, m, 1);
    const end = isoOf(y, m, new Date(y, m, 0).getDate());
    out.push({ label: m + '月', count: state.courses.filter((c) => c.memberId === memberId && c.date >= start && c.date <= end && c.status === 'done').length });
  }
  return out;
}

/* ------------------------------ 顶栏 / 导航 ------------------------------ */
function topbarHTML() {
  return '<div class="brand"><span class="brand-mark">榴</span>' +
    '<div class="brand-text"><b>榴莲私教</b><i>私教课表 · 课时台账</i></div></div>' +
    '<button class="avatar" data-action="settings" style="--c:#25282D" aria-label="设置">' + esc(state.coach.name.slice(0, 1)) + '</button>';
}

function tabbarHTML() {
  const items = [['schedule', '课表', 'calendar'], ['add', '记课', 'plus'], ['members', '会员', 'users'], ['report', '报表', 'chart']];
  return items.map((it) => '<button class="tab ' + (ui.tab === it[0] ? 'active' : '') + '" data-action="tab" data-tab="' + it[0] + '">' +
    icon(it[2]) + '<span>' + it[1] + '</span></button>').join('');
}

/* ------------------------------ 课表 ------------------------------ */
function lessonHTML(c) {
  const m = memberOf(c.memberId);
  const st = STATUS[c.status] || STATUS.booked;
  const end = fromMin(toMin(c.start) + c.duration);
  const rem = m ? remainingOf(m) : 0;
  return '<button class="lesson ' + (c.status === 'cancel' ? 'is-cancel' : '') + '" data-action="course" data-id="' + c.id + '">' +
    '<span class="lesson-time"><b>' + c.start + '</b><span>' + end + '</span></span>' +
    '<span class="lesson-body">' +
      '<span class="lesson-top">' + avatarHTML(m, 'sm') +
        '<span class="lesson-name">' + esc(m ? m.name : '已删除会员') + '</span>' +
        '<span class="pill ' + st.cls + '">' + st.label + '</span></span>' +
      '<span class="lesson-meta">' + c.duration + ' 分钟 · ' + (m ? '剩余 ' + rem + ' 节' : '') + '</span>' +
      (c.note ? '<span class="lesson-note">' + esc(c.note) + '</span>' : '') +
    '</span></button>';
}

function dayStripHTML(days) {
  const today = todayISO();
  return '<div class="week-strip">' + days.map((d) => {
    const n = state.courses.filter((c) => c.date === d && c.status !== 'cancel').length;
    return '<button class="day-cell ' + (d === ui.date ? 'active' : '') + ' ' + (d === today ? 'today' : '') + '" data-action="pick-day" data-date="' + d + '">' +
      '<span>' + weekdayShort(d) + '</span><b>' + parseISO(d).getDate() + '</b><span class="n">' + (n || '') + '</span></button>';
  }).join('') + '</div>';
}

function agendaHTML(date) {
  const list = coursesOn(date);
  const live = list.filter((c) => c.status !== 'cancel');
  const hours = live.reduce((s, c) => s + c.duration, 0) / 60;
  const head = '<div class="agenda-head"><h2>' + dateCN(date) + ' ' + weekday(date) + '</h2>' +
    '<span>' + live.length + ' 节 · ' + fmtHours(hours) + ' 小时</span></div>';
  if (!list.length) {
    return head + '<div class="empty"><div class="empty-mark">' + icon('calendar') + '</div>' +
      '<h3>这天还没有课</h3><p>点右下角「+」记一节课，<br>或者把空档留给新会员。</p>' +
      '<button class="btn primary" data-action="new-lesson">记一节课</button></div>';
  }
  return head + list.map(lessonHTML).join('');
}

function blockHTML(c) {
  const m = memberOf(c.memberId);
  const top = (toMin(c.start) - SLOT_FROM) / 60 * HOUR_H;
  const h = Math.max(20, c.duration / 60 * HOUR_H - 3);
  const cls = c.status === 'booked' ? ' is-booked' : (c.status === 'noshow' ? ' is-noshow' : '');
  return '<button class="block' + cls + '" style="top:' + top + 'px;height:' + h + 'px;background:' + memberColor(m) + '" data-action="course" data-id="' + c.id + '">' +
    '<b>' + esc(m ? m.name.slice(0, 3) : '—') + '</b><span>' + c.start + '</span></button>';
}

function weekGridHTML(ws) {
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const inWeek = today >= ws && today <= addDays(ws, 6);
  const hours = [];
  for (let h = 9; h <= 21; h += 1) hours.push(h);
  const nowTop = (nowMin() - SLOT_FROM) / 60 * HOUR_H;

  return '<div class="grid-card">' +
    '<div class="grid-head"><span class="grid-gutter"></span>' + days.map((d) => {
      return '<button class="grid-day ' + (d === today ? 'is-today' : '') + '" data-action="open-day" data-date="' + d + '">' +
        '<span>' + weekdayShort(d) + '</span><b>' + parseISO(d).getDate() + '</b></button>';
    }).join('') + '</div>' +
    '<div class="grid-body">' +
      '<div class="grid-times">' + hours.map((h) => '<span style="top:' + ((h - 8) * HOUR_H) + 'px">' + pad(h) + ':00</span>').join('') + '</div>' +
      '<div class="grid-cols">' + days.map((d) => {
        const now = (d === today && inWeek && nowMin() >= SLOT_FROM && nowMin() <= SLOT_TO)
          ? '<span class="now-line" style="top:' + nowTop + 'px"></span>' : '';
        return '<div class="grid-col ' + (d === today ? 'is-today' : '') + '">' +
          state.courses.filter((c) => c.date === d && c.status !== 'cancel').map(blockHTML).join('') + now + '</div>';
      }).join('') + '</div>' +
    '</div></div>';
}

function viewSchedule() {
  const date = ui.date;
  const ws = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const weekLive = state.courses.filter((c) => c.date >= ws && c.date <= addDays(ws, 6) && c.status !== 'cancel');
  const todayLive = state.courses.filter((c) => c.date === todayISO() && c.status !== 'cancel');
  const weekWord = ws === startOfWeek(todayISO()) ? '本周' : '该周';

  return '<header class="page-head">' +
      '<div><span class="kicker">' + weekWord + ' ' + weekLive.length + ' 节 · 今天 ' + todayLive.length + ' 节</span><h1>课表</h1></div>' +
      '<div class="seg">' +
        '<button class="' + (ui.view === 'day' ? 'active' : '') + '" data-action="set-view" data-view="day">日</button>' +
        '<button class="' + (ui.view === 'week' ? 'active' : '') + '" data-action="set-view" data-view="week">周</button>' +
      '</div></header>' +
    '<div class="week-nav">' +
      '<button class="nav-btn" data-action="shift-week" data-delta="-7" aria-label="上一周">‹</button>' +
      '<span class="range">' + dateCN(ws) + ' – ' + dateCN(addDays(ws, 6)) + '</span>' +
      '<button class="nav-btn" data-action="shift-week" data-delta="7" aria-label="下一周">›</button>' +
      '<button class="today-btn" data-action="go-today">今天</button>' +
    '</div>' +
    (ui.view === 'week' ? '<p class="grid-hint">点色块看详情 · 点日期切到当天</p>' + weekGridHTML(ws) : dayStripHTML(days) + agendaHTML(date));
}

/* ------------------------------ 记课 ------------------------------ */
function viewAdd() {
  const d = ui.draft;
  const m = d.memberId ? memberOf(d.memberId) : null;
  const st = STATUS[d.status] || STATUS.booked;
  const today = todayISO();
  const dur = [45, 60, 90, 120];
  const statuses = [['booked', '待上'], ['done', '已上'], ['noshow', '未到'], ['cancel', '取消']];

  return '<h1 class="form-title">记一节课</h1>' +
    '<p class="form-sub">会员、日期、时间填好就能存，课表和统计会自动更新。</p>' +

    '<div class="field-block"><div class="field-label">会员 <em>' + state.members.length + ' 位</em></div>' +
      (state.members.length ? '<div class="member-picks">' + state.members.map((x) =>
        '<button class="pick-chip ' + (d.memberId === x.id ? 'active' : '') + '" data-action="pick-member" data-id="' + x.id + '">' +
          avatarHTML(x, 'sm') + '<span class="pick-text"><b>' + esc(x.name) + '</b><i>剩 ' + remainingOf(x) + ' 节</i></span>' +
        '</button>').join('') + '</div>'
        : '<div class="empty"><h3>先添加会员</h3><p>添加会员后才能记课。</p><button class="btn primary" data-action="add-member">添加会员</button></div>') +
    '</div>' +

    '<div class="field-block"><div class="field-label">日期 <em>' + weekday(d.date) + '</em></div>' +
      '<div class="quick-row">' +
        '<button class="qchip ' + (d.date === today ? 'active' : '') + '" data-action="pick-date" data-date="' + today + '">今天</button>' +
        '<button class="qchip ' + (d.date === addDays(today, 1) ? 'active' : '') + '" data-action="pick-date" data-date="' + addDays(today, 1) + '">明天</button>' +
        '<button class="qchip ' + (d.date === addDays(today, -1) ? 'active' : '') + '" data-action="pick-date" data-date="' + addDays(today, -1) + '">昨天</button>' +
        '<input class="date-field" type="date" id="addDate" value="' + d.date + '">' +
      '</div>' +
    '</div>' +

    '<div class="field-block"><div class="field-label">时间 <em>08:00 – 22:00</em></div>' +
      '<div class="time-row">' +
        '<label class="time-box"><span>开始时间</span><input type="time" id="addTime" step="900" min="08:00" max="21:00" value="' + d.start + '"></label>' +
        '<div class="time-box"><span>时长（分钟）</span><div class="dur-chips">' +
          dur.map((x) => '<button class="' + (d.duration === x ? 'active' : '') + '" data-action="set-duration" data-value="' + x + '">' + x + '</button>').join('') +
        '</div></div>' +
      '</div>' +
    '</div>' +

    '<div class="field-block"><div class="field-label">状态 <em>' + st.label + '</em></div>' +
      '<div class="status-seg">' + statuses.map((s) =>
        '<button class="' + (d.status === s[0] ? 'active' : '') + '" data-action="set-status" data-value="' + s[0] + '">' + s[1] + '</button>').join('') +
      '</div>' +
    '</div>' +

    '<div class="field-block"><div class="field-label">备注 <em>选填</em></div>' +
      '<textarea class="field" id="addNote" maxlength="80" placeholder="训练内容 / 注意事项">' + esc(d.note) + '</textarea>' +
    '</div>' +

    '<div class="save-bar"><div class="save-inner">' +
      '<div class="sum"><b>' + (m ? esc(m.name) : '未选择会员') + ' · ' + st.label +
        (m && remainingOf(m) <= 0 ? ' <i class="warn">课时不足</i>' : '') + '</b>' +
        '<span>' + dateCN(d.date) + ' ' + (d.start || '--:--') + ' · ' + d.duration + ' 分钟</span></div>' +
      '<button class="btn primary" data-action="save-lesson"' + (m ? '' : ' disabled') + '>保存</button>' +
    '</div></div>';
}

/* ------------------------------ 会员 ------------------------------ */
function memberRowHTML(m) {
  const rem = remainingOf(m);
  const cls = rem <= 0 ? 'none' : (rem <= 3 ? 'low' : '');
  const mb = monthBounds(todayISO());
  const st = statsIn(m.id, mb.start, mb.end);
  return '<button class="member-row" data-action="member" data-id="' + m.id + '" data-member-card data-search="' + esc((m.name + ' ' + (m.phone || '')).toLowerCase()) + '">' +
    avatarHTML(m) +
    '<span class="member-info"><span class="member-name">' + esc(m.name) + '</span>' +
      '<span class="member-meta">' + esc(m.phone || '未填手机号') + ' · 本月 ' + st.done + ' 节</span></span>' +
    '<span class="member-right"><b class="member-remain ' + cls + '">' + rem + '</b><small>剩余课时</small></span>' +
  '</button>';
}

function viewMembers() {
  return '<header class="page-head"><div><span class="kicker">共 ' + state.members.length + ' 位 · 余课 ' + state.members.reduce((s, m) => s + remainingOf(m), 0) + ' 节</span><h1>会员</h1></div>' +
      '<button class="btn ghost" data-action="add-member" style="padding:8px 12px">+ 添加</button></header>' +
    '<div class="search">' + icon('search') + '<input id="memberSearch" placeholder="搜索姓名 / 手机号" value="' + esc(ui.memberQuery) + '"></div>' +
    '<div class="section-title"><h2 id="memberCount">' + state.members.length + ' 位会员</h2></div>' +
    (state.members.length ? state.members.map(memberRowHTML).join('') : '<div class="empty"><h3>还没有会员</h3><p>先把常来的会员加进来，就可以记课和统计了。</p><button class="btn primary" data-action="add-member">添加第一个会员</button></div>') +
    '<div class="empty" id="searchEmpty" hidden><h3>没有找到</h3><p>换个姓名或手机号试试。</p></div>';
}

/* ------------------------------ 报表 ------------------------------ */
function viewReport() {
  const p = currentPeriod();
  const rows = state.members.map((m) => {
    const s = statsIn(m.id, p.start, p.end);
    return { m, s, rem: remainingOf(m) };
  }).sort((a, b) => (b.s.done - a.s.done) || (b.s.consumed - a.s.consumed) || a.m.name.localeCompare(b.m.name, 'zh'));

  const total = rows.reduce((acc, r) => {
    acc.done += r.s.done; acc.noshow += r.s.noshow; acc.consumed += r.s.consumed; acc.minutes += r.s.minutes; acc.booked += r.s.booked;
    return acc;
  }, { done: 0, noshow: 0, consumed: 0, minutes: 0, booked: 0 });
  const active = rows.filter((r) => r.s.done + r.s.noshow + r.s.booked + r.s.cancel > 0).length;

  return '<header class="page-head"><div><span class="kicker">周 / 月 / 年 课数一目了然</span><h1>报表</h1></div>' +
      '<button class="icon-btn" data-action="settings" aria-label="设置">' + icon('gear') + '</button></header>' +

    '<div class="seg" style="margin-top:10px;display:flex">' +
      [['week', '周'], ['month', '月'], ['year', '年']].map((x) =>
        '<button style="flex:1" class="' + (ui.reportMode === x[0] ? 'active' : '') + '" data-action="set-report-mode" data-mode="' + x[0] + '">' + x[1] + '</button>').join('') +
    '</div>' +

    '<div class="report-nav">' +
      '<button class="nav-btn" data-action="shift-period" data-delta="-1" aria-label="上一期">‹</button>' +
      '<span class="label">' + p.label + '</span>' +
      '<button class="nav-btn" data-action="shift-period" data-delta="1" aria-label="下一期">›</button>' +
    '</div>' +

    '<div class="summary"><div class="summary-head"><span>本期合计</span><em>' + p.start.replace(/-/g, '/') + ' – ' + p.end.replace(/-/g, '/') + '</em></div>' +
      '<div class="summary-grid">' +
        '<div><b>' + total.done + '</b><span>已上课数</span></div>' +
        '<div><b>' + total.consumed + '</b><span>消课节数</span></div>' +
        '<div><b>' + fmtHours(total.minutes / 60) + '<small>h</small></b><span>课时</span></div>' +
        '<div><b>' + active + '</b><span>上课会员</span></div>' +
      '</div></div>' +

    (state.members.length
      ? '<div class="report-grid">' + rows.map((r) => {
        const remCls = r.rem <= 0 ? 'over' : (r.rem <= 3 ? 'low' : '');
        const remText = r.rem < 0 ? '超课 ' + Math.abs(r.rem) + ' 节' : '剩余 ' + r.rem + ' 节';
        return '<button class="rc" data-action="reconcile" data-id="' + r.m.id + '">' +
          '<span class="rc-top">' + avatarHTML(r.m, 'sm') + '<span class="rc-name">' + esc(r.m.name) + '</span></span>' +
          '<span class="rc-count"><b>' + r.s.done + '</b><span>节已上</span></span>' +
          '<span class="rc-meta">未到 ' + r.s.noshow + ' · 待上 ' + r.s.booked + '</span>' +
          '<span class="rc-remain ' + remCls + '">' + remText + '</span>' +
        '</button>';
      }).join('') + '</div>'
      : '<div class="empty"><h3>还没有会员</h3><p>添加会员后，这里会显示每个人的周 / 月 / 年课数。</p><button class="btn primary" data-action="add-member">添加会员</button></div>') +

    '<div class="card export-card">' +
      '<button class="export-row" data-action="export-detail">' + icon('download') + '导出本期上课明细（CSV）<span class="chev">›</span></button>' +
      '<button class="export-row" data-action="export-summary">' + icon('download') + '导出会员课时汇总（CSV）<span class="chev">›</span></button>' +
    '</div>' +

    '<p class="report-foot">统计口径：<b>已上</b>计入课数；<b>未到</b>' + (state.settings.countNoShow ? '也扣课时' : '不扣课时') + '；<b>待上 / 取消</b>不计入。剩余课时 = 已购 + 校正 − 已消。月底对账时，点会员卡片可逐条核对每节课。</p>';
}

/* ------------------------------ 弹层：会员档案 ------------------------------ */
function memberSheetHTML(m) {
  const rem = remainingOf(m);
  const consumed = consumedCount(m.id);
  const wb = weekBounds(todayISO());
  const mb = monthBounds(todayISO());
  const yb = yearBounds(todayISO());
  const week = statsIn(m.id, wb.start, wb.end);
  const month = statsIn(m.id, mb.start, mb.end);
  const year = statsIn(m.id, yb.start, yb.end);
  const months = lastSixMonths(m.id);
  const maxMonth = Math.max(1, ...months.map((x) => x.count));
  const history = state.courses.filter((c) => c.memberId === m.id)
    .slice().sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)).slice(0, 10);
  const logs = state.logs.filter((l) => l.memberId === m.id)
    .slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 6);

  return '<div class="sheet-grip"></div>' +
    '<div class="sheet-head"><span class="sheet-title">会员档案</span><button class="icon-btn" data-action="close-sheet" aria-label="关闭">' + icon('close') + '</button></div>' +
    '<div class="profile">' + avatarHTML(m, 'lg') +
      '<div><h3>' + esc(m.name) + '</h3><p>' + esc(m.phone || '未填手机号') + ' · ' + esc(m.note || '还没有备注') + '</p></div></div>' +

    '<div class="balance"><div class="balance-main"><span>剩余课时</span><b>' + rem + '<small>节</small></b></div>' +
      '<div class="balance-side">已购 <b>' + m.total + '</b><br>校正 <b>' + (m.adjust > 0 ? '+' : '') + (m.adjust || 0) + '</b><br>已消 <b>' + consumed + '</b></div></div>' +

    '<div class="stat-tiles">' +
      '<div class="tile"><span>本周</span><b>' + week.done + '<em>节</em></b></div>' +
      '<div class="tile"><span>本月</span><b>' + month.done + '<em>节</em></b></div>' +
      '<div class="tile"><span>今年</span><b>' + year.done + '<em>节</em></b></div>' +
    '</div>' +

    '<div class="sheet-sub">近 6 个月 <span>已完成课程</span></div>' +
    '<div class="mini-chart">' + months.map((x, i) =>
      '<div class="mcol ' + (i === months.length - 1 ? 'now' : '') + '">' +
        '<span class="mbar" style="height:' + (x.count ? Math.max(5, Math.round(x.count / maxMonth * 54)) : 3) + 'px"></span>' +
        '<span class="mlabel">' + x.label + '</span></div>').join('') + '</div>' +

    '<div class="sheet-sub">上课记录 <span>最近 10 条</span></div>' +
    (history.length ? history.map((c) => {
      const st = STATUS[c.status] || STATUS.booked;
      return '<button class="history-row" data-action="course" data-id="' + c.id + '">' +
        '<span class="history-date">' + c.date.slice(5).replace('-', '/') + ' ' + c.start + '</span>' +
        '<span class="history-name">' + c.duration + ' 分钟' + (c.note ? ' · ' + esc(c.note) : '') + '</span>' +
        '<span class="pill ' + st.cls + '">' + st.label + '</span></button>';
    }).join('') : '<p class="note-line">还没有上课记录。</p>') +

    (logs.length ? '<div class="sheet-sub">课时变更 <span>' + logs.length + ' 条</span></div>' +
      logs.map((l) => '<div class="log-row"><b>' + (l.delta > 0 ? '+' : '') + l.delta + ' 节</b><span>' + esc(l.reason || (l.type === 'renew' ? '续课' : '课时校正')) + '</span>' +
        '<span style="margin-left:auto">' + l.date.slice(5).replace('-', '/') + '</span></div>').join('') : '') +

    '<div class="sheet-actions">' +
      '<button class="btn ghost" data-action="renew" data-id="' + m.id + '">续课</button>' +
      '<button class="btn ghost" data-action="adjust" data-id="' + m.id + '">校正</button>' +
      '<button class="btn dark" data-action="edit-member" data-id="' + m.id + '">编辑</button>' +
    '</div>' +
    '<button class="text-danger" data-action="delete-member" data-id="' + m.id + '">删除会员</button>';
}

/* ------------------------------ 弹层：课程 ------------------------------ */
function courseSheetHTML(c) {
  const m = memberOf(c.memberId);
  const st = STATUS[c.status] || STATUS.booked;
  const statuses = [['booked', '待上'], ['done', '已上'], ['noshow', '未到'], ['cancel', '取消']];
  const d = ui.courseDraft || { status: c.status };

  return '<div class="sheet-grip"></div>' +
    '<div class="sheet-head"><span class="sheet-title">课程详情</span><button class="icon-btn" data-action="close-sheet" aria-label="关闭">' + icon('close') + '</button></div>' +
    '<div class="course-hero"><div class="hero-top"><span class="pill ' + st.cls + '">' + st.label + '</span><span style="font-size:11px;color:rgba(255,255,255,.6)">' + dateCN(c.date) + ' ' + weekday(c.date) + '</span></div>' +
      '<h2>' + (m ? esc(m.name) : '已删除会员') + '</h2>' +
      '<p><b>' + c.start + '</b> – ' + fromMin(toMin(c.start) + c.duration) + ' · ' + c.duration + ' 分钟</p></div>' +

    '<div class="form">' +
      '<div class="form-row">' +
        '<label>日期<input class="field" type="date" id="editDate" value="' + c.date + '"></label>' +
        '<label>开始<input class="field" type="time" id="editStart" step="900" min="08:00" max="21:00" value="' + c.start + '"></label>' +
      '</div>' +
      '<label>时长<input class="field" type="number" id="editDuration" min="30" max="240" step="5" value="' + c.duration + '"></label>' +
      '<div><div class="field-label" style="margin:0 2px 7px">状态</div><div class="status-seg">' +
        statuses.map((s) => '<button class="' + (d.status === s[0] ? 'active' : '') + '" data-action="course-status" data-value="' + s[0] + '">' + s[1] + '</button>').join('') +
      '</div></div>' +
      '<label>备注<textarea class="field" id="editNote" maxlength="80">' + esc(c.note || '') + '</textarea></label>' +
    '</div>' +

    '<div class="sheet-actions"><button class="btn ghost" data-action="delete-course" data-id="' + c.id + '">删除</button>' +
      '<button class="btn primary" data-action="save-course" data-id="' + c.id + '">保存</button></div>';
}

/* ------------------------------ 弹层：新增 / 编辑会员 ------------------------------ */
function memberFormHTML(m) {
  return '<div class="sheet-grip"></div>' +
    '<div class="sheet-head"><span class="sheet-title">' + (m ? '编辑会员' : '添加会员') + '</span><button class="icon-btn" data-action="close-sheet" aria-label="关闭">' + icon('close') + '</button></div>' +
    '<div class="form">' +
      '<label>姓名<input class="field" id="mfName" maxlength="12" placeholder="会员姓名" value="' + esc(m ? m.name : '') + '"></label>' +
      '<label>手机号<input class="field" id="mfPhone" type="tel" maxlength="16" placeholder="选填" value="' + esc(m ? m.phone : '') + '"></label>' +
      (m ? '' : '<label>初始课时<input class="field" id="mfTotal" type="number" min="0" max="999" value="12"></label>') +
      '<label>备注<input class="field" id="mfNote" maxlength="60" placeholder="训练目标 / 伤病史（选填）" value="' + esc(m ? m.note : '') + '"></label>' +
    '</div>' +
    '<div class="sheet-actions"><button class="btn ghost" data-action="close-sheet">取消</button>' +
      '<button class="btn primary" data-action="save-member" data-id="' + (m ? m.id : '') + '">' + (m ? '保存' : '添加') + '</button></div>';
}

/* ------------------------------ 弹层：续课 / 校正 / 设置 / 确认 ------------------------------ */
function renewSheetHTML(m) {
  return '<div class="sheet-grip"></div>' +
    '<div class="sheet-head"><span class="sheet-title">给 ' + esc(m.name) + ' 续课</span><button class="icon-btn" data-action="close-sheet" aria-label="关闭">' + icon('close') + '</button></div>' +
    '<p class="note-line">当前剩余 ' + remainingOf(m) + ' 节，已购 ' + m.total + ' 节。</p>' +
    '<div class="form"><label>本次增加课时<input class="field" id="renewCount" type="number" min="1" max="200" value="10"></label>' +
      '<div class="chips">' + [10, 20, 30].map((n) => '<button class="chip" data-action="renew-preset" data-value="' + n + '">+ ' + n + ' 节</button>').join('') + '</div></div>' +
    '<div class="sheet-actions"><button class="btn ghost" data-action="close-sheet">取消</button>' +
      '<button class="btn primary" data-action="save-renew" data-id="' + m.id + '">确认续课</button></div>';
}

function adjustSheetHTML(m) {
  return '<div class="sheet-grip"></div>' +
    '<div class="sheet-head"><span class="sheet-title">校正 ' + esc(m.name) + ' 的课时</span><button class="icon-btn" data-action="close-sheet" aria-label="关闭">' + icon('close') + '</button></div>' +
    '<p class="note-line">课数对不上时用这里补记。正数增加剩余课时，负数减少。</p>' +
    '<div class="form"><label>调整节数<input class="field" id="adjustDelta" type="number" step="1" value="1"></label>' +
      '<label>原因<input class="field" id="adjustReason" maxlength="40" placeholder="例如：上月考勤补录"></label></div>' +
    '<div class="sheet-actions"><button class="btn ghost" data-action="close-sheet">取消</button>' +
      '<button class="btn primary" data-action="save-adjust" data-id="' + m.id + '">确认校正</button></div>';
}

function settingsSheetHTML() {
  return '<div class="sheet-grip"></div>' +
    '<div class="sheet-head"><span class="sheet-title">设置与数据</span><button class="icon-btn" data-action="close-sheet" aria-label="关闭">' + icon('close') + '</button></div>' +
    '<div class="form"><label>教练昵称<input class="field" id="coachName" maxlength="12" value="' + esc(state.coach.name) + '"></label>' +
      '<button class="btn ghost" data-action="save-coach">保存昵称</button></div>' +
    '<div class="switch-row"><div class="switch-text"><b>未到课扣课时</b><span>开启后，「未到」也计入消课与剩余课时</span></div>' +
      '<button class="switch ' + (state.settings.countNoShow ? 'on' : '') + '" data-action="toggle-noshow" role="switch" aria-checked="' + (state.settings.countNoShow ? 'true' : 'false') + '"></button></div>' +
    '<div class="card export-card" style="margin-top:8px;border:0;padding:0;box-shadow:none">' +
      '<button class="export-row" data-action="export-backup">' + icon('download') + '导出备份（JSON）<span class="chev">›</span></button>' +
      '<button class="export-row" data-action="pick-import">' + icon('download') + '导入备份<span class="chev">›</span></button>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
    '</div>' +
    '<button class="text-danger" data-action="clear-data">清空全部数据</button>' +
    '<p class="note-line">数据只保存在这台设备的浏览器里（localStorage）。换手机或清理浏览器前，请先导出备份。版本 v1.0</p>';
}

function confirmSheetHTML() {
  const s = ui.sheet || {};
  return '<div class="sheet-grip"></div>' +
    '<div class="sheet-head"><span class="sheet-title">' + esc(s.title || '确认') + '</span><button class="icon-btn" data-action="close-sheet" aria-label="关闭">' + icon('close') + '</button></div>' +
    '<p class="confirm-desc">' + esc(s.desc || '') + '</p>' +
    '<div class="sheet-actions"><button class="btn ghost" data-action="close-sheet">取消</button>' +
      '<button class="btn danger-solid" data-action="confirm-yes">' + esc(s.label || '确认') + '</button></div>';
}

/* ------------------------------ 弹层：本期对账 ------------------------------ */
function reconcileSheetHTML(m, period) {
  const p = period || currentPeriod();
  const list = state.courses.filter((c) => c.memberId === m.id && c.date >= p.start && c.date <= p.end)
    .slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const s = statsIn(m.id, p.start, p.end);
  const rem = remainingOf(m);

  return '<div class="sheet-grip"></div>' +
    '<div class="sheet-head"><span class="sheet-title">本期对账</span><button class="icon-btn" data-action="close-sheet" aria-label="关闭">' + icon('close') + '</button></div>' +
    '<div class="profile">' + avatarHTML(m, 'lg') +
      '<div><h3>' + esc(m.name) + '</h3><p>' + p.label + ' · 剩余 ' + rem + ' 节</p></div></div>' +
    '<div class="rec-sum">' +
      '<div><b>' + s.done + '</b><span>已上</span></div>' +
      '<div><b>' + s.noshow + '</b><span>未到</span></div>' +
      '<div><b>' + s.booked + '</b><span>待上</span></div>' +
      '<div><b>' + s.cancel + '</b><span>取消</span></div>' +
    '</div>' +
    '<div class="sheet-sub">本期明细 <span>共 ' + list.length + ' 条 · 点一条可改状态</span></div>' +
    (list.length ? list.map((c) => {
      const st = STATUS[c.status] || STATUS.booked;
      return '<button class="history-row" data-action="course" data-id="' + c.id + '">' +
        '<span class="history-date">' + c.date.slice(5).replace('-', '/') + ' ' + c.start + '</span>' +
        '<span class="history-name">' + weekday(c.date) + ' · ' + c.duration + ' 分钟' + (c.note ? ' · ' + esc(c.note) : '') + '</span>' +
        '<span class="pill ' + st.cls + '">' + st.label + '</span></button>';
    }).join('') : '<p class="note-line">这个周期还没有课程记录。</p>') +
    '<div class="sheet-actions">' +
      '<button class="btn ghost" data-action="close-sheet">关闭</button>' +
      '<button class="btn dark" data-action="member" data-id="' + m.id + '">会员档案</button>' +
    '</div>';
}

/* ------------------------------ 弹层渲染 ------------------------------ */
function sheetInner() {
  const s = ui.sheet;
  if (!s) return '';
  if (s.type === 'member') { const m = memberOf(s.id); return m ? memberSheetHTML(m) : ''; }
  if (s.type === 'reconcile') { const m = memberOf(s.id); return m ? reconcileSheetHTML(m, s.period) : ''; }
  if (s.type === 'course') { const c = state.courses.find((x) => x.id === s.id); return c ? courseSheetHTML(c) : ''; }
  if (s.type === 'memberForm') return memberFormHTML(s.id ? memberOf(s.id) : null);
  if (s.type === 'renew') { const m = memberOf(s.id); return m ? renewSheetHTML(m) : ''; }
  if (s.type === 'adjust') { const m = memberOf(s.id); return m ? adjustSheetHTML(m) : ''; }
  if (s.type === 'settings') return settingsSheetHTML();
  if (s.type === 'confirm') return confirmSheetHTML();
  return '';
}

function renderSheet() {
  const host = document.getElementById('sheetHost');
  if (!ui.sheet) {
    host.classList.remove('open');
    host.innerHTML = '';
    return;
  }
  const html = sheetInner();
  if (!html) {
    ui.sheet = null;
    host.classList.remove('open');
    host.innerHTML = '';
    return;
  }
  host.innerHTML = '<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet">' + html + '</div>';
  requestAnimationFrame(() => host.classList.add('open'));
}

/* ------------------------------ 渲染总控 ------------------------------ */
const views = { schedule: viewSchedule, add: viewAdd, members: viewMembers, report: viewReport };

function render(opts) {
  const o = opts || {};
  if (ui.tab === 'add' && !ui.draft) ui.draft = newDraft(todayISO());
  document.getElementById('topbar').innerHTML = topbarHTML();
  const main = document.getElementById('main');
  const scroll = o.top ? 0 : main.scrollTop;
  main.innerHTML = views[ui.tab]();
  main.scrollTop = o.top ? 0 : scroll;
  document.getElementById('tabbar').innerHTML = tabbarHTML();
  document.getElementById('fab').hidden = ui.tab !== 'schedule';
  if (ui.tab === 'members') applyMemberFilter();
  renderSheet();
}

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  const phone = document.getElementById('app');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (phone) phone.classList.add('is-toasting');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    if (phone) phone.classList.remove('is-toasting');
  }, 2200);
}

function applyMemberFilter() {
  const input = document.getElementById('memberSearch');
  const kw = (input ? input.value : ui.memberQuery).trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll('[data-member-card]').forEach((card) => {
    const hit = !kw || card.dataset.search.indexOf(kw) >= 0;
    card.hidden = !hit;
    if (hit) visible += 1;
  });
  const count = document.getElementById('memberCount');
  if (count) count.textContent = visible + ' 位会员';
  const empty = document.getElementById('searchEmpty');
  if (empty) empty.hidden = visible !== 0 || state.members.length === 0;
}

/* ------------------------------ 动作 ------------------------------ */
function switchTab(tab) {
  if (TABS.indexOf(tab) < 0) return;
  ui.tab = tab;
  ui.sheet = null;
  if (tab === 'add' && !ui.draft) ui.draft = newDraft(todayISO());
  try { history.replaceState(null, '', '#' + tab); } catch (err) { /* file:// 忽略 */ }
  render({ top: true });
}

function openAdd(date) {
  ui.draft = newDraft(date || (ui.tab === 'schedule' ? ui.date : todayISO()));
  switchTab('add');
}

function saveLesson() {
  const d = ui.draft;
  const err = validateDraft(d);
  if (err) { toast(err); return; }
  const m = memberOf(d.memberId);
  state.courses.push({
    id: uid(), memberId: d.memberId, date: d.date, start: d.start,
    duration: Number(d.duration), status: d.status, note: d.note.trim(),
    createdAt: new Date().toISOString(),
  });
  persist();
  ui.date = d.date;
  ui.view = 'day';
  saveView();
  ui.draft = null;
  ui.tab = 'schedule';
  render({ top: true });
  try { history.replaceState(null, '', '#schedule'); } catch (err) { /* 忽略 */ }
  toast('已记录：' + m.name + ' ' + dateCN(d.date) + ' ' + d.start);
}

function saveCourse(id) {
  const c = state.courses.find((x) => x.id === id);
  if (!c) return;
  const date = document.getElementById('editDate').value;
  const start = document.getElementById('editStart').value;
  const duration = Number(document.getElementById('editDuration').value);
  const note = document.getElementById('editNote').value;
  const status = (ui.courseDraft && ui.courseDraft.status) || c.status;
  const draft = { id, memberId: c.memberId, date, start, duration, status, note };
  const err = validateDraft(draft);
  if (err) { toast(err); return; }
  c.date = date; c.start = start; c.duration = duration; c.note = note.trim(); c.status = status;
  persist();
  ui.sheet = null;
  render();
  toast('已保存修改');
}

function createOrUpdateMember(id) {
  const name = document.getElementById('mfName').value.trim();
  if (!name) { toast('请填写会员姓名'); return; }
  const phone = document.getElementById('mfPhone').value.trim();
  const note = document.getElementById('mfNote').value.trim();
  if (id) {
    const m = memberOf(id);
    if (!m) return;
    m.name = name; m.phone = phone; m.note = note;
    persist();
    ui.sheet = null;
    render();
    toast('会员资料已更新');
    return;
  }
  const totalEl = document.getElementById('mfTotal');
  const total = Math.min(999, Math.max(0, Number(totalEl ? totalEl.value : 0) || 0));
  const m = { id: 'm' + Date.now().toString(36), name, phone, total, adjust: 0, note, createdAt: todayISO() };
  state.members.push(m);
  if (total > 0) state.logs.push({ id: uid(), memberId: m.id, type: 'renew', delta: total, reason: '开卡', date: todayISO(), createdAt: new Date().toISOString() });
  persist();
  ui.sheet = null;
  render();
  toast('已添加会员 ' + name);
}

function renewMember(id) {
  const m = memberOf(id);
  const input = document.getElementById('renewCount');
  const n = Math.min(200, Math.max(1, Number(input ? input.value : 10) || 0));
  if (!m) return;
  m.total += n;
  state.logs.push({ id: uid(), memberId: id, type: 'renew', delta: n, reason: '续课 ' + n + ' 节', date: todayISO(), createdAt: new Date().toISOString() });
  persist();
  ui.sheet = { type: 'member', id };
  render();
  toast('已续课 ' + n + ' 节');
}

function adjustMember(id) {
  const m = memberOf(id);
  const deltaEl = document.getElementById('adjustDelta');
  const reasonEl = document.getElementById('adjustReason');
  const delta = Number(deltaEl ? deltaEl.value : 0);
  if (!m || !Number.isFinite(delta) || delta === 0) { toast('请填写非 0 的调整节数'); return; }
  m.adjust = (m.adjust || 0) + delta;
  state.logs.push({ id: uid(), memberId: id, type: 'adjust', delta, reason: (reasonEl ? reasonEl.value.trim() : '') || '课时校正', date: todayISO(), createdAt: new Date().toISOString() });
  persist();
  ui.sheet = { type: 'member', id };
  render();
  toast('已校正 ' + (delta > 0 ? '+' : '') + delta + ' 节');
}

function removeMember(id) {
  const m = memberOf(id);
  if (!m) return;
  const count = state.courses.filter((c) => c.memberId === id).length;
  openConfirm('删除会员', '删除「' + m.name + '」后，TA 的 ' + count + ' 条上课记录和课时记录也会一并删除，且无法恢复。', '确认删除', () => {
    state.members = state.members.filter((x) => x.id !== id);
    state.courses = state.courses.filter((c) => c.memberId !== id);
    state.logs = state.logs.filter((l) => l.memberId !== id);
    persist();
    ui.sheet = null;
    render();
    toast('已删除会员');
  });
}

function removeCourse(id) {
  openConfirm('删除这条记录', '删除后这节课会从课表和统计中消失，剩余课时会自动恢复。', '确认删除', () => {
    state.courses = state.courses.filter((c) => c.id !== id);
    persist();
    ui.sheet = null;
    render();
    toast('已删除');
  });
}

function openConfirm(title, desc, label, fn) {
  ui.sheet = { type: 'confirm', title, desc, label };
  ui.pending = fn;
  render();
}

/* ------------------------------ CSV / 备份 ------------------------------ */
function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function download(name, text, type) {
  const isJson = (type || '').indexOf('json') >= 0;
  const blob = new Blob([isJson ? text : '\uFEFF' + text], { type: type || 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}
function periodTag(p) {
  if (p.mode === 'week') return p.start + '_' + p.end;
  if (p.mode === 'year') return p.start.slice(0, 4);
  return p.start.slice(0, 7);
}
function exportDetail() {
  const p = currentPeriod();
  const list = state.courses.filter((c) => c.date >= p.start && c.date <= p.end)
    .slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const rows = [['日期', '星期', '开始', '结束', '时长(分钟)', '会员', '状态', '备注']];
  list.forEach((c) => {
    const m = memberOf(c.memberId);
    rows.push([c.date, weekday(c.date), c.start, fromMin(toMin(c.start) + c.duration), c.duration, m ? m.name : '已删除会员', (STATUS[c.status] || STATUS.booked).label, c.note || '']);
  });
  download('排课明细-' + periodTag(p) + '.csv', rows.map((r) => r.map(csvCell).join(',')).join('\r\n'));
  toast('已导出 ' + list.length + ' 条记录');
}
function exportSummary() {
  const p = currentPeriod();
  const rows = [['会员', '手机号', '已上', '未到', '取消', '待上', '消课', '本期课时(h)', '已购', '校正', '剩余']];
  state.members.forEach((m) => {
    const s = statsIn(m.id, p.start, p.end);
    rows.push([m.name, m.phone || '', s.done, s.noshow, s.cancel, s.booked, s.consumed, fmtHours(s.minutes / 60), m.total, m.adjust || 0, remainingOf(m)]);
  });
  download('会员课时-' + periodTag(p) + '.csv', rows.map((r) => r.map(csvCell).join(',')).join('\r\n'));
  toast('已导出会员汇总');
}
function exportBackup() {
  download('榴莲私教备份-' + todayISO() + '.json', JSON.stringify(state, null, 2), 'application/json');
  toast('备份已导出，请保存到网盘或微信收藏');
}
function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const s = JSON.parse(String(reader.result));
      if (!s || !Array.isArray(s.members) || !Array.isArray(s.courses)) throw new Error('bad');
      if (!Array.isArray(s.logs)) s.logs = [];
      if (!s.settings) s.settings = { countNoShow: true };
      if (!s.coach) s.coach = { name: '教练', studio: '' };
      openConfirm('导入备份', '将用备份里的 ' + s.members.length + ' 位会员、' + s.courses.length + ' 条课程覆盖当前全部数据。建议先导出当前数据。', '确认导入', () => {
        state = s;
        persist();
        ui.sheet = null;
        ui.draft = null;
        render();
        toast('备份已恢复');
      });
    } catch (err) {
      toast('文件格式不对，导入失败');
    }
  };
  reader.readAsText(file);
}

/* ------------------------------ 事件 ------------------------------ */
document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  switch (action) {
    case 'tab':
      switchTab(el.dataset.tab);
      break;
    case 'new-lesson':
      openAdd();
      break;
    case 'pick-day':
      ui.date = el.dataset.date;
      ui.tab = 'schedule';
      render({ top: true });
      break;
    case 'shift-week':
      ui.date = addDays(ui.date, Number(el.dataset.delta));
      render({ top: true });
      break;
    case 'go-today':
      ui.date = todayISO();
      render({ top: true });
      break;
    case 'set-view':
      ui.view = el.dataset.view;
      saveView();
      render({ top: true });
      break;
    case 'open-day':
      ui.date = el.dataset.date;
      ui.view = 'day';
      saveView();
      render({ top: true });
      break;
    case 'pick-member':
      if (!ui.draft) ui.draft = newDraft(todayISO());
      ui.draft.memberId = ui.draft.memberId === id ? null : id;
      render();
      break;
    case 'pick-date':
      if (!ui.draft) ui.draft = newDraft(todayISO());
      ui.draft.date = el.dataset.date;
      render();
      break;
    case 'set-duration':
      ui.draft.duration = Number(el.dataset.value);
      render();
      break;
    case 'set-status':
      ui.draft.status = el.dataset.value;
      render();
      break;
    case 'save-lesson':
      saveLesson();
      break;
    case 'member':
      ui.sheet = { type: 'member', id };
      render();
      break;
    case 'reconcile': {
      const p = currentPeriod();
      ui.sheet = { type: 'reconcile', id, period: { start: p.start, end: p.end, label: p.label } };
      render();
      break;
    }
    case 'course': {
      const c = state.courses.find((x) => x.id === id);
      if (!c) return;
      ui.courseDraft = { id, status: c.status };
      ui.sheet = { type: 'course', id };
      render();
      break;
    }
    case 'add-member':
      ui.sheet = { type: 'memberForm', id: null };
      render();
      break;
    case 'edit-member':
      ui.sheet = { type: 'memberForm', id };
      render();
      break;
    case 'save-member':
      createOrUpdateMember(id);
      break;
    case 'delete-member':
      removeMember(id);
      break;
    case 'renew':
      ui.sheet = { type: 'renew', id };
      render();
      break;
    case 'adjust':
      ui.sheet = { type: 'adjust', id };
      render();
      break;
    case 'renew-preset': {
      const input = document.getElementById('renewCount');
      if (input) input.value = el.dataset.value;
      break;
    }
    case 'save-renew':
      renewMember(id);
      break;
    case 'save-adjust':
      adjustMember(id);
      break;
    case 'course-status':
      ui.courseDraft.status = el.dataset.value;
      document.querySelectorAll('[data-action="course-status"]').forEach((b) => {
        b.classList.toggle('active', b.dataset.value === ui.courseDraft.status);
      });
      break;
    case 'save-course':
      saveCourse(id);
      break;
    case 'delete-course':
      removeCourse(id);
      break;
    case 'settings':
      ui.sheet = { type: 'settings' };
      render();
      break;
    case 'toggle-noshow':
      state.settings.countNoShow = !state.settings.countNoShow;
      persist();
      render();
      break;
    case 'save-coach': {
      const input = document.getElementById('coachName');
      const name = input ? input.value.trim() : '';
      if (!name) { toast('昵称不能为空'); return; }
      state.coach.name = name;
      persist();
      render();
      toast('昵称已保存');
      break;
    }
    case 'export-backup':
      exportBackup();
      break;
    case 'pick-import': {
      const input = document.getElementById('importFile');
      if (input) input.click();
      break;
    }
    case 'clear-data':
      openConfirm('清空全部数据', '会员、课程和课时记录都会被删除，且无法恢复。建议先导出备份。', '确认清空', () => {
        state = { version: 1, coach: state.coach, settings: state.settings, members: [], courses: [], logs: [] };
        persist();
        ui.sheet = null;
        ui.draft = null;
        ui.tab = 'schedule';
        render({ top: true });
        toast('已清空，重新开始');
      });
      break;
    case 'confirm-yes': {
      const fn = ui.pending;
      ui.sheet = null;
      ui.pending = null;
      if (typeof fn === 'function') fn();
      else render();
      break;
    }
    case 'close-sheet':
      ui.sheet = null;
      ui.pending = null;
      render();
      break;
    case 'set-report-mode':
      ui.reportMode = el.dataset.mode;
      ui.reportAnchor = todayISO();
      render({ top: true });
      break;
    case 'shift-period':
      shiftPeriod(Number(el.dataset.delta));
      render();
      break;
    case 'export-detail':
      exportDetail();
      break;
    case 'export-summary':
      exportSummary();
      break;
    default:
      break;
  }
});

document.addEventListener('input', (event) => {
  const el = event.target;
  if (el.id === 'memberSearch') {
    ui.memberQuery = el.value;
    applyMemberFilter();
  } else if (el.id === 'addNote' && ui.draft) {
    ui.draft.note = el.value;
  }
});

document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.id === 'addDate' && ui.draft) {
    ui.draft.date = el.value || todayISO();
    render();
  } else if (el.id === 'addTime' && ui.draft) {
    ui.draft.start = el.value || ui.draft.start;
    render();
  } else if (el.id === 'importFile' && el.files && el.files[0]) {
    importBackup(el.files[0]);
    el.value = '';
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && ui.sheet) {
    ui.sheet = null;
    ui.pending = null;
    render();
  }
});

window.addEventListener('hashchange', () => {
  const tab = tabFromHash();
  if (tab !== ui.tab) {
    ui.tab = tab;
    ui.sheet = null;
    if (tab === 'add' && !ui.draft) ui.draft = newDraft(todayISO());
    render({ top: true });
  }
});

/* ------------------------------ 启动 ------------------------------ */
render({ top: true });

if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 离线能力可选 */ });
  });
}
