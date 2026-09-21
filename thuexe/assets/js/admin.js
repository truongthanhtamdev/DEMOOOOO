/* ==========================================================================
   admin.js — hệ thống quản lý: xe, hợp đồng, thu tiền, nhắc hạn, yêu cầu, chi phí
   ========================================================================== */
(function () {
  'use strict';
  var S = window.Store;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = S.esc, fmtVND = S.fmtVND, fmtShort = S.fmtShort, fmtDate = S.fmtDate;


  /* ====================== bộ icon (SVG nội tuyến) ====================== */
  var SV = function (d, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + d + (extra || '') + '</svg>';
  };
  var ICON = {
    home: SV('<path d="M3 10.5L12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/>'),
    money: SV('<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>'),
    cars: SV('<path d="M5 17h14"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/><path d="M3 14l1.2-4.2A3 3 0 0 1 7.1 7h9.8a3 3 0 0 1 2.9 2.3L21 14v3H3z"/>'),
    contracts: SV('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
    alerts: SV('<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5z"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>'),
    leads: SV('<path d="M3 6.5h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l9 6.5L21 7"/>'),
    expenses: SV('<path d="M12 2v20"/><path d="M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.7 5 3.2 5 1.3 5 3.3-2.2 3.2-5 3.2-5-1.3-5-3.2"/>'),
    profit: SV('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3.5-4 3 2.4L20 7"/>'),
    customers: SV('<circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5S15 16.7 15 20"/><path d="M16 4.5a3.4 3.4 0 0 1 0 7M18 14.8c2.4.6 3.9 2.5 3.9 5.2"/>'),
    dot: SV('<circle cx="12" cy="12" r="8"/>'),
    clock: SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    wallet: SV('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1"/><path d="M3 7.5V17a2.5 2.5 0 0 0 2.5 2.5H19a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2H5.5"/><circle cx="16.5" cy="13.7" r="1.2"/>'),
    plus: SV('<path d="M12 5v14M5 12h14"/>'),
    download: SV('<path d="M12 3v12"/><path d="M7.5 11L12 15.5 16.5 11"/><path d="M4 19.5h16"/>'),
    upload: SV('<path d="M12 15.5V3.5"/><path d="M7.5 8L12 3.5 16.5 8"/><path d="M4 19.5h16"/>'),
    phone: SV('<path d="M21.5 16.9v2.6a2 2 0 0 1-2.2 2 19.5 19.5 0 0 1-8.5-3 19 19 0 0 1-5.9-5.9 19.5 19.5 0 0 1-3-8.6A2 2 0 0 1 3.9 2h2.6a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.6 9.7a15.5 15.5 0 0 0 5.9 5.9l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
    check: SV('<path d="M20 6.5L9.5 17 4.5 12"/>')
  };

  /* ====================== tiện ích UI ====================== */
  function toast(msg, kind) {
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    $('#toast').appendChild(el);
    setTimeout(function () { el.remove(); }, 3400);
  }
  /** Mở hộp thoại. opts: {title, body, ok, onOk(form, close), width} */
  function modal(opts) {
    var back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML =
      '<div class="modal" style="max-width:' + (opts.width || 620) + 'px">' +
      '<div class="modal-head"><h3>' + esc(opts.title) + '</h3><button class="x" data-close>&times;</button></div>' +
      '<form class="modal-body">' + opts.body + '</form>' +
      '<div class="modal-foot">' +
      '<button class="btn ghost" data-close>Đóng</button>' +
      (opts.ok === null ? '' : '<button class="btn" data-ok>' + esc(opts.ok || 'Lưu') + '</button>') +
      '</div></div>';
    function close() { back.remove(); }
    back.addEventListener('click', function (e) {
      if (e.target === back || e.target.closest('[data-close]')) close();
      if (e.target.closest('[data-ok]')) {
        var form = $('form', back);
        if (opts.onOk) opts.onOk(readForm(form), close, form);
      }
    });
    $('form', back).addEventListener('submit', function (e) { e.preventDefault(); });
    $('#modal-root').appendChild(back);
    var first = $('input:not([type=hidden]),select,textarea', back);
    if (first) first.focus();
    return { close: close, root: back };
  }
  function readForm(form) {
    var out = {};
    $$('[name]', form).forEach(function (el) {
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.dataset.num !== undefined) out[el.name] = el.value === '' ? null : Number(String(el.value).replace(/[^\d.-]/g, ''));
      else out[el.name] = el.value;
    });
    return out;
  }
  function confirmBox(msg, onYes) {
    modal({
      title: 'Xác nhận', width: 440, ok: 'Đồng ý',
      body: '<p style="margin:0">' + esc(msg) + '</p>',
      onOk: function (_, close) { close(); onYes(); }
    });
  }
  function fld(label, name, opts) {
    opts = opts || {};
    var attrs = 'name="' + name + '"' +
      (opts.type ? ' type="' + opts.type + '"' : '') +
      (opts.num ? ' data-num="1" inputmode="numeric"' : '') +
      (opts.value != null ? ' value="' + esc(opts.value) + '"' : '') +
      (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') +
      (opts.step ? ' step="' + opts.step + '"' : '');
    var input = opts.textarea ? '<textarea ' + attrs + '>' + esc(opts.value || '') + '</textarea>'
      : opts.options ? '<select name="' + name + '">' + opts.options + '</select>'
        : '<input ' + attrs + '>';
    return '<label class="f"><span>' + esc(label) + (opts.hint ? ' <i class="tiny muted">' + esc(opts.hint) + '</i>' : '') + '</span>' + input + '</label>';
  }
  function opts(list, value, mapper) {
    return list.map(function (x) {
      var o = mapper ? mapper(x) : x;
      return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(value) ? ' selected' : '') + '>' + esc(o.t) + '</option>';
    }).join('');
  }
  function carOpts(value, onlyAvailable) {
    var list = S.load().cars.filter(function (c) { return !onlyAvailable || c.status === 'available' || c.id === value; });
    return opts(list, value, function (c) {
      return { v: c.id, t: c.plate + ' · ' + c.name + (c.status === 'rented' ? ' (đang thuê)' : c.status === 'maintenance' ? ' (bảo dưỡng)' : '') };
    });
  }
  function custOpts(value) {
    return opts(S.load().customers, value, function (c) { return { v: c.id, t: c.name + ' · ' + c.phone }; });
  }
  function carLabel(id) {
    var c = S.car(id);
    return c ? c.plate + ' · ' + c.name : '—';
  }
  function custLabel(id) {
    var c = S.customer(id);
    return c ? c.name : '—';
  }
  function dl(name, text, mime) {
    var b = new Blob(['﻿' + text], { type: (mime || 'text/csv') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        c = c == null ? '' : String(c);
        return /[",;\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(';');
    }).join('\n');
  }

  /* ====================== nền sáng/tối, ngăn kéo menu ====================== */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('thuexe.theme', t); } catch (e) { }
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('thuexe.theme'); } catch (e) { }
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  $('#btn-theme').addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  function drawer(open) {
    $('#side').classList.toggle('open', open);
    $('#scrim').classList.toggle('on', open);
  }
  $('#btn-menu').addEventListener('click', function () {
    drawer(!$('#side').classList.contains('open'));
  });
  $('#scrim').addEventListener('click', function () { drawer(false); });

  /* ====================== phiên đăng nhập (demo) ====================== */
  var ME = { role: 'owner', name: 'Anh Tâm' };
  var ROLE_TEXT = { owner: 'Chủ xe — toàn quyền', staff: 'Nhân viên — hạn chế tài chính' };
  function isOwner() { return ME.role === 'owner'; }

  function login(role, name) {
    ME = { role: role, name: name || (role === 'owner' ? 'Chủ xe' : 'Nhân viên') };
    try { localStorage.setItem('thuexe.me', JSON.stringify(ME)); } catch (e) { }
    $('#gate').classList.add('hide');
    $('#me-name').textContent = ME.name;
    $('#me-role').textContent = ROLE_TEXT[ME.role];
    $('#me-av').textContent = ME.name.trim().slice(0, 1).toUpperCase();
    buildTabs();
    go(TAB_KEYS[0]);
  }
  $('#gate-in').addEventListener('click', function () {
    login($('#gate-role').value, $('#gate-name').value.trim());
  });
  $('#btn-logout').addEventListener('click', function () {
    try { localStorage.removeItem('thuexe.me'); } catch (e) { }
    $('#gate').classList.remove('hide');
  });

  /* ====================== tabs ====================== */
  var TABS = [
    { k: 'home', t: 'Tổng quan', r: renderHome },
    { k: 'money', t: 'Thu tiền', r: renderMoney, badge: function () { return S.overduePayments().length; } },
    { k: 'cars', t: 'Đội xe', r: renderCars },
    { k: 'contracts', t: 'Hợp đồng', r: renderContracts },
    { k: 'alerts', t: 'Nhắc hạn', r: renderAlerts, badge: function () { return S.reminders(15).length; } },
    { k: 'leads', t: 'Yêu cầu từ web', r: renderLeads, badge: function () { return S.load().leads.filter(function (l) { return l.status === 'new'; }).length; }, info: true },
    { k: 'expenses', t: 'Chi phí', r: renderExpenses },
    { k: 'profit', t: 'Lãi / lỗ từng xe', r: renderProfit, owner: true },
    { k: 'customers', t: 'Khách hàng', r: renderCustomers }
  ];
  var TAB_KEYS = [], current = 'home';
  var GROUPS = [
    ['Theo dõi hằng ngày', ['home', 'money', 'alerts']],
    ['Vận hành', ['cars', 'contracts', 'leads']],
    ['Sổ sách', ['expenses', 'profit', 'customers']]
  ];
  function visibleTabs() { return TABS.filter(function (t) { return !t.owner || isOwner(); }); }
  function buildTabs() {
    var list = visibleTabs();
    TAB_KEYS = list.map(function (t) { return t.k; });
    $('#tabs').innerHTML = GROUPS.map(function (g) {
      var items = list.filter(function (t) { return g[1].indexOf(t.k) >= 0; });
      if (!items.length) return '';
      return '<div class="grp">' + g[0] + '</div>' + items.map(function (t) {
        var n = t.badge ? t.badge() : 0;
        return '<button class="nav-item' + (t.k === current ? ' on' : '') + '" data-tab="' + t.k + '">' +
          '<span class="ic">' + ICON[t.k] + '</span>' + esc(t.t) +
          (n ? '<span class="dot' + (t.info ? ' info' : '') + '">' + n + '</span>' : '') + '</button>';
      }).join('');
    }).join('');
    var tab = TABS.filter(function (t) { return t.k === current; })[0];
    if (tab) $('#page-title').textContent = tab.t;
  }

  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (b) go(b.getAttribute('data-tab'));
  });
  function go(k) {
    current = k;
    var tab = TABS.filter(function (t) { return t.k === k; })[0] || TABS[0];
    buildTabs();
    drawer(false);
    $('#view').innerHTML = '';
    tab.r($('#view'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  /** Vẽ lại tab hiện tại (sau khi dữ liệu đổi). */
  function refresh(msg, kind) {
    if (msg) toast(msg, kind || 'ok');
    go(current);
  }

  /* ====================== TỔNG QUAN ====================== */
  function renderHome(root) {
    var d = S.load(), t = S.today(), ym = S.toISO(t).slice(0, 7);
    var od = S.overduePayments(), odSum = od.reduce(function (s, p) { return s + p.amount - (p.paidAmount || 0); }, 0);
    var due7 = S.upcomingPayments(7);
    var rev = S.revenueOfMonth(ym), exp = S.expenseOfMonth(ym);
    var rented = d.cars.filter(function (c) { return c.status === 'rented'; }).length;
    var free = d.cars.filter(function (c) { return c.status === 'available'; }).length;
    var maint = d.cars.filter(function (c) { return c.status === 'maintenance'; }).length;
    var alerts = S.reminders(30), ending = S.endingContracts(45);
    var newLeads = d.leads.filter(function (l) { return l.status === 'new'; });
    var loan = d.cars.reduce(function (s, c) { return s + (c.loanPerMonth || 0); }, 0);

    root.innerHTML =
      '<div class="view-head"><div>' +
      '<h2>Chào ' + esc(ME.name) + '</h2>' +
      '<p class="muted small" style="margin:0">Hôm nay ' + fmtDate(S.toISO(t)) + ' · ' + d.cars.length + ' xe · tỷ lệ khai thác ' +
      Math.round(rented / d.cars.length * 100) + '%</p></div>' +
      '<div class="btn-row">' +
      '<button class="btn" data-act="new-contract">' + ICON.plus + 'Hợp đồng mới</button>' +
      '<button class="btn ghost" data-act="new-car">' + ICON.cars + 'Thêm xe</button>' +
      '</div></div>' +

      '<div class="kpis">' +
      kpi('Công nợ quá hạn', S.fmtMil(odSum), od.length + ' kỳ chưa thu', od.length ? 'alert' : 'good', ICON.wallet) +
      kpi('Tới hạn 7 ngày', S.fmtMil(due7.reduce(function (s, p) { return s + p.amount; }, 0)), due7.length + ' kỳ cần nhắc', due7.length ? 'warn' : '', ICON.clock) +
      (isOwner() ? kpi('Đã thu tháng này', S.fmtMil(rev), 'Chi ' + fmtShort(exp) + '₫ · trả góp ' + fmtShort(loan) + '₫', 'good', ICON.profit) : '') +
      kpi('Đang cho thuê', rented + '/' + d.cars.length, free + ' trống · ' + maint + ' bảo dưỡng', free > 3 ? 'warn' : '', ICON.cars) +
      kpi('Nhắc hạn 30n', alerts.length, 'Đăng kiểm · bảo hiểm · bảo dưỡng', alerts.length ? 'warn' : 'good', ICON.alerts) +
      kpi('Yêu cầu mới', newLeads.length, newLeads.length ? 'Cần gọi lại' : 'Đã xử lý hết', newLeads.length ? 'alert' : 'good', ICON.leads) +
      '</div>' +

      '<div class="panel" style="margin-bottom:16px">' +
      '<header><h3>Lịch xe 6 tháng</h3>' +
      '<div class="tl-legend">' +
      '<span><i style="background:var(--brand)"></i>Đang thuê</span>' +
      '<span><i style="background:var(--warn)"></i>Hết hạn trong 30 ngày</span>' +
      '<span><i style="background:var(--ok-soft);border:1px dashed var(--ok)"></i>Xe trống</span>' +
      '<span><i style="background:var(--danger)"></i>Hôm nay</span>' +
      '</div></header>' +
      '<div class="card-pad">' + timeline() + '</div></div>' +

      '<div class="panels">' +
      panel('Cần thu tiền ngay', od.slice(0, 6).map(function (p) {
        var ct = S.contract(p.contractId);
        return li(custLabel(ct && ct.customerId) + ' · ' + S.fmtMil(p.amount),
          carLabel(ct && ct.carId) + ' · kỳ ' + S.fmtMonth(p.dueDate) + '<br>' +
          '<b style="color:var(--danger)">' + (p.lateDays > 0 ? 'Trễ ' + p.lateDays + ' ngày' : 'Đến hạn hôm nay') + '</b>',
          '<button class="btn sm" data-act="pay" data-id="' + p.id + '">Đã thu</button>');
      }), 'Không có ai nợ. Tuyệt vời!', 'money') +

      panel('Nhắc hạn gần nhất', alerts.slice(0, 6).map(function (a) {
        return li(a.kind + ' · ' + carLabel(a.carId),
          a.detail + '<br>' + (a.left < 0 ? '<b style="color:var(--danger)">Đã quá hạn</b>'
            : a.left <= 7 ? '<b style="color:var(--warn)">Còn ' + a.left + ' ngày</b>' : 'Còn ' + a.left + ' ngày'),
          '<button class="btn ghost sm" data-act="edit-car" data-id="' + a.carId + '">Mở xe</button>');
      }), 'Chưa có hạn nào tới trong 30 ngày.', 'alerts') +

      panel('Hợp đồng sắp hết hạn', ending.slice(0, 6).map(function (c) {
        return li(custLabel(c.customerId) + ' · ' + c.code,
          carLabel(c.carId) + ' · hết hạn ' + fmtDate(c.endDate) + ' · ' + (c.left < 0 ? 'đã quá hạn' : 'còn ' + c.left + ' ngày'),
          '<button class="btn ghost sm" data-act="view-contract" data-id="' + c.id + '">Xem</button>');
      }), 'Không có hợp đồng nào sắp hết hạn.', 'contracts') +

      panel('Yêu cầu thuê mới', newLeads.slice(0, 6).map(function (l) {
        return li(l.name + ' · ' + l.phone,
          (l.carId ? carLabel(l.carId) : 'Chưa chọn xe') + ' · ' + l.months + ' tháng · gửi ' + fmtDate(l.createdAt),
          '<a class="btn ghost sm" href="tel:' + esc(l.phone.replace(/\s/g, '')) + '">Gọi</a>');
      }), 'Chưa có yêu cầu mới.', 'leads') +
      '</div>';
  }
  function kpi(lbl, val, sub, cls, icon) {
    return '<div class="kpi ' + (cls || '') + '">' +
      '<div class="top"><span class="ic">' + (icon || ICON.dot) + '</span>' +
      '<span class="lbl">' + esc(lbl) + '</span></div>' +
      '<div class="val">' + val + '</div><div class="sub">' + (sub || '') + '</div></div>';
  }
  function li(title, sub, right) {
    return '<li><div class="grow"><b>' + title + '</b><span>' + sub + '</span></div>' + (right || '') + '</li>';
  }
  function panel(title, items, emptyText, tabKey) {
    return '<div class="panel"><header><h3>' + esc(title) + '</h3>' +
      (tabKey ? '<button class="btn ghost sm" data-tab-jump="' + tabKey + '">Xem tất cả</button>' : '') + '</header>' +
      (items.length ? '<ul class="list">' + items.join('') + '</ul>' : '<div class="empty">' + esc(emptyText) + '</div>') +
      '</div>';
  }

  /** Thanh thời gian 6 tháng: mỗi xe 1 dòng. */
  function timeline() {
    var d = S.load(), t = S.today();
    var from = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    var to = new Date(t.getFullYear(), t.getMonth() + 5, 1);
    var span = to - from;
    function pct(dt) { return Math.max(0, Math.min(100, (dt - from) / span * 100)); }

    var months = [];
    for (var i = 0; i < 6; i++) {
      var m = new Date(from.getFullYear(), from.getMonth() + i, 1);
      months.push('<span>T' + (m.getMonth() + 1) + '</span>');
    }
    var head = '<div class="tl-months"><div></div><div class="cols">' + months.join('') + '</div></div>';
    var gridCells = '<div class="tl-grid"><span></span><span></span><span></span><span></span><span></span><span></span></div>';

    var rows = d.cars.map(function (c) {
      var ct = S.activeContractOfCar(c.id), bar;
      if (ct) {
        var s = S.parseDate(ct.startDate), e = S.parseDate(ct.endDate);
        var left = pct(s), right = pct(e);
        var soon = S.fromToday(ct.endDate) <= 30;
        bar = '<div class="tl-bar' + (soon ? ' soon' : '') + '" style="left:' + left + '%;width:' + Math.max(4, right - left) + '%" ' +
          'title="' + esc(custLabel(ct.customerId) + ' · ' + fmtDate(ct.startDate) + ' → ' + fmtDate(ct.endDate)) + '">' +
          esc(custLabel(ct.customerId)) + ' → ' + fmtDate(ct.endDate) + '</div>';
      } else if (c.status === 'maintenance') {
        bar = '<div class="tl-bar maint" style="left:0;width:100%">Đang bảo dưỡng</div>';
      } else {
        bar = '<div class="tl-bar free" style="left:0;width:100%">Trống — cần tìm khách</div>';
      }
      return '<div class="tl-row"><div class="tl-name" title="' + esc(c.name) + '"><b>' + esc(c.plate) + '</b> · ' + esc(c.name) + '</div>' +
        '<div class="tl-track">' + gridCells + bar + '<div class="tl-today" style="left:' + pct(t) + '%"></div></div></div>';
    }).join('');
    return '<div class="timeline">' + head + rows + '</div>';
  }

  /* ====================== THU TIỀN ====================== */
  var moneyFilter = 'overdue';
  function renderMoney(root) {
    var d = S.load(), t = S.today();
    var rows = d.payments.map(function (p) {
      var ct = S.contract(p.contractId) || {};
      var left = S.fromToday(p.dueDate);
      return {
        p: p, ct: ct, left: left,
        // kỳ đến hạn đúng hôm nay tính là "cần thu ngay", khớp với số liệu ở Tổng quan
        state: p.paidDate ? 'paid' : left <= 0 ? 'overdue' : left <= 7 ? 'soon' : 'future'
      };
    });
    var counts = { overdue: 0, soon: 0, future: 0, paid: 0 };
    rows.forEach(function (r) { counts[r.state]++; });
    var shown = rows.filter(function (r) { return moneyFilter === 'all' || r.state === moneyFilter; })
      .sort(function (a, b) { return a.p.dueDate < b.p.dueDate ? -1 : 1; });
    var sum = shown.reduce(function (s, r) { return s + r.p.amount; }, 0);

    root.innerHTML =
      '<div class="view-head"><div><h2>Thu tiền theo kỳ</h2>' +
      '<p class="muted small" style="margin:0">Mỗi hợp đồng tự sinh các kỳ thu theo tháng. Đánh dấu “Đã thu” là hết nợ kỳ đó.</p></div>' +
      '<div class="btn-row"><button class="btn ghost" data-act="export-money">' + ICON.download + 'Xuất Excel (CSV)</button></div></div>' +

      '<div class="toolbar"><div class="seg">' +
      ['overdue|Cần thu ngay (' + counts.overdue + ')', 'soon|Tới hạn 7 ngày (' + counts.soon + ')',
      'future|Kỳ sau (' + counts.future + ')', 'paid|Đã thu (' + counts.paid + ')', 'all|Tất cả'].map(function (x) {
        var a = x.split('|');
        return '<button data-money="' + a[0] + '"' + (moneyFilter === a[0] ? ' class="on"' : '') + '>' + a[1] + '</button>';
      }).join('') + '</div>' +
      '<span class="badge ' + (moneyFilter === 'overdue' && sum ? 'danger' : 'info') + '">Tổng: ' + fmtVND(sum) + '</span></div>' +

      '<div class="card table-scroll"><table class="tbl"><thead><tr>' +
      '<th>Kỳ</th><th>Khách</th><th>Xe</th><th>Hạn đóng</th><th class="right">Số tiền</th><th>Tình trạng</th><th></th>' +
      '</tr></thead><tbody>' +
      (shown.length ? shown.map(function (r) {
        var p = r.p, cls = r.state === 'overdue' ? ' class="row-danger"' : r.state === 'soon' ? ' class="row-warn"' : '';
        var st = r.state === 'paid' ? '<span class="badge ok">Đã thu ' + fmtDate(p.paidDate) + '</span>'
          : r.state === 'overdue' ? '<span class="badge danger">' + (r.left < 0 ? 'Trễ ' + (-r.left) + ' ngày' : 'Đến hạn hôm nay') + '</span>'
            : r.state === 'soon' ? '<span class="badge warn">Còn ' + r.left + ' ngày</span>'
              : '<span class="badge">Chưa tới hạn</span>';
        return '<tr' + cls + '><td class="nowrap">' + S.fmtMonth(p.dueDate) + '<div class="tiny muted">' + esc(r.ct.code || '') + '</div></td>' +
          '<td>' + esc(custLabel(r.ct.customerId)) + '<div class="tiny muted">' + esc((S.customer(r.ct.customerId) || {}).phone || '') + '</div></td>' +
          '<td class="small">' + esc(carLabel(r.ct.carId)) + '</td>' +
          '<td class="nowrap">' + fmtDate(p.dueDate) + '</td>' +
          '<td class="right mono">' + fmtVND(p.amount) + '</td>' +
          '<td>' + st + '</td>' +
          '<td class="right nowrap">' + (p.paidDate
            ? '<button class="btn ghost sm" data-act="unpay" data-id="' + p.id + '">Hoàn tác</button>'
            : '<button class="btn sm" data-act="pay" data-id="' + p.id + '">Đã thu</button>' +
            ' <a class="btn ghost sm" href="sms:' + esc(((S.customer(r.ct.customerId) || {}).phone || '').replace(/\s/g, '')) +
            '?body=' + encodeURIComponent(nudgeText(r)) + '">Nhắc</a>') + '</td></tr>';
      }).join('') : '<tr class="empty-row"><td colspan="7">Không có kỳ nào trong nhóm này.</td></tr>') +
      '</tbody></table></div>';
  }
  function nudgeText(r) {
    return 'Chào ' + custLabel(r.ct.customerId) + ', tiền thuê xe ' + carLabel(r.ct.carId) +
      ' kỳ ' + S.fmtMonth(r.p.dueDate) + ' là ' + fmtVND(r.p.amount) +
      ', hạn ' + fmtDate(r.p.dueDate) + '. Anh/chị chuyển giúp em nhé. Cảm ơn ạ!';
  }
  function payDialog(id) {
    var p = S.load().payments.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var ct = S.contract(p.contractId) || {};
    modal({
      title: 'Ghi nhận đã thu tiền', ok: 'Lưu', width: 520,
      body: '<p class="small muted">' + esc(custLabel(ct.customerId)) + ' · ' + esc(carLabel(ct.carId)) +
        ' · kỳ ' + S.fmtMonth(p.dueDate) + '</p><div class="form-grid">' +
        fld('Số tiền thu (₫)', 'amount', { num: true, value: p.amount }) +
        fld('Ngày thu', 'date', { type: 'date', value: S.toISO(S.today()) }) +
        '</div>' + fld('Hình thức', 'method', { options: opts([{ v: 'ck', t: 'Chuyển khoản' }, { v: 'cash', t: 'Tiền mặt' }, { v: 'momo', t: 'Ví điện tử' }]) }),
      onOk: function (v, close) {
        S.markPaid(id, v.amount, v.date);
        close();
        refresh('Đã ghi nhận ' + fmtVND(v.amount));
      }
    });
  }

  /* ====================== ĐỘI XE ====================== */
  var carView = 'grid', carQ = '', carStatus = '';
  function renderCars(root) {
    var d = S.load();
    var list = d.cars.filter(function (c) {
      if (carStatus && c.status !== carStatus) return false;
      if (carQ && (c.name + ' ' + c.plate + ' ' + c.brand).toLowerCase().indexOf(carQ.toLowerCase()) < 0) return false;
      return true;
    });
    root.innerHTML =
      '<div class="view-head"><div><h2>Đội xe (' + d.cars.length + ')</h2>' +
      '<p class="muted small" style="margin:0">Ảnh đang là ảnh tạm tự sinh. Dán link ảnh thật vào ô “Link ảnh” là website hiện ngay.</p></div>' +
      '<div class="btn-row"><button class="btn" data-act="new-car">' + ICON.plus + 'Thêm xe</button>' +
      '<button class="btn ghost" data-act="export-cars">' + ICON.download + 'Xuất CSV</button>' +
      '<button class="btn ghost" data-act="import-cars">' + ICON.upload + 'Nạp từ Excel</button></div></div>' +

      '<div class="toolbar">' +
      '<input id="car-q" placeholder="Tìm biển số / tên xe…" value="' + esc(carQ) + '">' +
      '<select id="car-status">' + opts([{ v: '', t: 'Mọi tình trạng' }, { v: 'available', t: 'Đang trống' },
      { v: 'rented', t: 'Đang cho thuê' }, { v: 'maintenance', t: 'Đang bảo dưỡng' }], carStatus) + '</select>' +
      '<div class="seg"><button data-carview="grid"' + (carView === 'grid' ? ' class="on"' : '') + '>Thẻ</button>' +
      '<button data-carview="table"' + (carView === 'table' ? ' class="on"' : '') + '>Bảng</button></div>' +
      '<span class="muted small">' + list.length + ' xe</span></div>' +
      (carView === 'grid' ? carGrid(list) : carTable(list));
  }
  function carStatusBadge(c) {
    var m = { available: ['ok', 'Trống'], rented: ['warn', 'Đang thuê'], maintenance: ['danger', 'Bảo dưỡng'] }[c.status] || ['', c.status];
    return '<span class="badge ' + m[0] + '">' + m[1] + '</span>';
  }
  function carGrid(list) {
    if (!list.length) return '<p class="muted center" style="padding:30px">Không có xe khớp điều kiện.</p>';
    return '<div class="fleet">' + list.map(function (c) {
      var ct = S.activeContractOfCar(c.id);
      var insp = S.fromToday(c.inspectionDue), ins = S.fromToday(c.insuranceDue);
      return '<div class="fcard">' +
        '<div class="ph"><img src="' + S.photoOf(c) + '" alt="" loading="lazy">' +
        carStatusBadge(c) + '<span class="plate">' + esc(c.plate) + '</span></div>' +
        '<div class="b"><h4>' + esc(c.name) + '</h4>' +
        '<div class="tiny muted">' + c.year + ' · ' + c.seats + ' chỗ · ' + (c.gearbox === 'AT' ? 'số tự động' : 'số sàn') + '</div>' +
        '<div class="kv"><span>Giá tháng</span><b>' + S.fmtMil(c.pricePerMonth) + '</b></div>' +
        '<div class="kv"><span>' + (ct ? 'Khách thuê' : 'Tình trạng') + '</span><b>' + esc(ct ? custLabel(ct.customerId) : c.status === 'maintenance' ? 'Đang ở garage' : 'Chưa có khách') + '</b></div>' +
        (ct ? '<div class="kv"><span>Hết hạn</span><b>' + fmtDate(ct.endDate) + '</b></div>' : '') +
        '<div class="kv"><span>ODO</span><b>' + (c.odo || 0).toLocaleString('vi-VN') + ' km</b></div>' +
        '<div class="kv"><span>Đăng kiểm</span><b style="' + dueStyle(insp) + '">' + fmtDate(c.inspectionDue) + '</b></div>' +
        '<div class="kv"><span>Bảo hiểm</span><b style="' + dueStyle(ins) + '">' + fmtDate(c.insuranceDue) + '</b></div>' +
        '<div class="btn-row" style="margin-top:6px">' +
        '<button class="btn ghost sm" data-act="edit-car" data-id="' + c.id + '" style="flex:1">Sửa</button>' +
        (ct ? '<button class="btn ghost sm" data-act="view-contract" data-id="' + ct.id + '" style="flex:1">Hợp đồng</button>'
          : '<button class="btn sm" data-act="new-contract" data-car="' + c.id + '" style="flex:1">Cho thuê</button>') +
        '</div></div></div>';
    }).join('') + '</div>';
  }
  function dueStyle(left) {
    if (left == null) return '';
    if (left < 0) return 'color:var(--danger)';
    if (left <= 30) return 'color:var(--warn)';
    return '';
  }
  function carTable(list) {
    return '<div class="card table-scroll"><table class="tbl"><thead><tr>' +
      '<th>Biển số</th><th>Xe</th><th>Chỗ</th><th class="right">Giá/tháng</th><th class="right">Cọc</th>' +
      '<th class="right">ODO</th><th>Đăng kiểm</th><th>Bảo hiểm</th><th>Tình trạng</th><th></th></tr></thead><tbody>' +
      list.map(function (c) {
        return '<tr><td class="mono nowrap">' + esc(c.plate) + '</td>' +
          '<td>' + esc(c.name) + '<div class="tiny muted">' + c.year + ' · ' + c.gearbox + '</div></td>' +
          '<td>' + c.seats + '</td>' +
          '<td class="right mono">' + fmtShort(c.pricePerMonth) + '</td>' +
          '<td class="right mono">' + fmtShort(c.deposit) + '</td>' +
          '<td class="right mono">' + (c.odo || 0).toLocaleString('vi-VN') + '</td>' +
          '<td class="nowrap" style="' + dueStyle(S.fromToday(c.inspectionDue)) + '">' + fmtDate(c.inspectionDue) + '</td>' +
          '<td class="nowrap" style="' + dueStyle(S.fromToday(c.insuranceDue)) + '">' + fmtDate(c.insuranceDue) + '</td>' +
          '<td>' + carStatusBadge(c) + '</td>' +
          '<td class="right"><button class="btn ghost sm" data-act="edit-car" data-id="' + c.id + '">Sửa</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function carDialog(id) {
    var c = id ? S.car(id) : {
      plate: '', name: '', brand: '', year: new Date().getFullYear(), seats: 5, gearbox: 'AT',
      pricePerMonth: 12000000, deposit: 18000000, odo: 0, serviceIntervalKm: 5000, lastServiceOdo: 0,
      inspectionDue: '', insuranceDue: '', loanPerMonth: 0, photo: '', status: 'available', note: ''
    };
    modal({
      title: id ? 'Sửa xe ' + c.plate : 'Thêm xe mới', ok: 'Lưu xe', width: 680,
      body: '<div class="form-grid">' +
        fld('Biển số *', 'plate', { value: c.plate, ph: '51H-123.45' }) +
        fld('Tên xe *', 'name', { value: c.name, ph: 'Toyota Vios E' }) +
        fld('Hãng', 'brand', { value: c.brand }) +
        fld('Năm sản xuất', 'year', { num: true, value: c.year }) +
        fld('Số chỗ', 'seats', { options: opts([{ v: 4, t: '4 chỗ' }, { v: 5, t: '5 chỗ' }, { v: 7, t: '7 chỗ' }, { v: 16, t: '16 chỗ' }], c.seats) }) +
        fld('Hộp số', 'gearbox', { options: opts([{ v: 'AT', t: 'Tự động (AT)' }, { v: 'MT', t: 'Số sàn (MT)' }], c.gearbox) }) +
        fld('Giá thuê 1 tháng (₫)', 'pricePerMonth', { num: true, value: c.pricePerMonth }) +
        fld('Tiền cọc (₫)', 'deposit', { num: true, value: c.deposit }) +
        fld('ODO hiện tại (km)', 'odo', { num: true, value: c.odo }) +
        fld('ODO lần bảo dưỡng gần nhất', 'lastServiceOdo', { num: true, value: c.lastServiceOdo }) +
        fld('Chu kỳ bảo dưỡng (km)', 'serviceIntervalKm', { num: true, value: c.serviceIntervalKm }) +
        fld('Trả góp ngân hàng / tháng (₫)', 'loanPerMonth', { num: true, value: c.loanPerMonth }) +
        fld('Hạn đăng kiểm', 'inspectionDue', { type: 'date', value: c.inspectionDue }) +
        fld('Hạn bảo hiểm', 'insuranceDue', { type: 'date', value: c.insuranceDue }) +
        fld('Tình trạng', 'status', {
          options: opts([{ v: 'available', t: 'Đang trống' }, { v: 'rented', t: 'Đang cho thuê' },
          { v: 'maintenance', t: 'Đang bảo dưỡng' }], c.status)
        }) +
        fld('Link ảnh xe', 'photo', { value: c.photo, ph: 'Dán link ảnh, để trống dùng ảnh tạm' }) +
        '</div>' + fld('Ghi chú', 'note', { textarea: true, value: c.note }),
      onOk: function (v, close) {
        if (!v.plate.trim() || !v.name.trim()) { toast('Cần biển số và tên xe', 'err'); return; }
        // giá theo mốc thời hạn tính tự động từ giá 1 tháng
        v.price3m = Math.round(v.pricePerMonth * 0.95 / 1e5) * 1e5;
        v.price6m = Math.round(v.pricePerMonth * 0.9 / 1e5) * 1e5;
        v.price12m = Math.round(v.pricePerMonth * 0.85 / 1e5) * 1e5;
        v.kmLimit = 3000;
        if (id) v.id = id;
        S.upsert('cars', v, 'car');
        close();
        refresh(id ? 'Đã lưu thay đổi' : 'Đã thêm xe ' + v.plate);
      }
    });
  }

  /* ====================== HỢP ĐỒNG ====================== */
  var ctFilter = 'active';
  function renderContracts(root) {
    var d = S.load();
    var list = d.contracts.filter(function (c) { return ctFilter === 'all' || c.status === ctFilter; })
      .sort(function (a, b) { return a.endDate < b.endDate ? -1 : 1; });
    root.innerHTML =
      '<div class="view-head"><div><h2>Hợp đồng thuê tháng</h2>' +
      '<p class="muted small" style="margin:0">Tạo hợp đồng là tự sinh đủ các kỳ thu tiền, khỏi nhập tay từng tháng.</p></div>' +
      '<div class="btn-row"><button class="btn" data-act="new-contract">' + ICON.plus + 'Hợp đồng mới</button>' +
      '<button class="btn ghost" data-act="export-contracts">' + ICON.download + 'Xuất CSV</button></div></div>' +
      '<div class="toolbar"><div class="seg">' +
      [['active', 'Đang hiệu lực'], ['ended', 'Đã kết thúc'], ['all', 'Tất cả']].map(function (a) {
        return '<button data-ctf="' + a[0] + '"' + (ctFilter === a[0] ? ' class="on"' : '') + '>' + a[1] + '</button>';
      }).join('') + '</div><span class="muted small">' + list.length + ' hợp đồng</span></div>' +

      '<div class="card table-scroll"><table class="tbl"><thead><tr>' +
      '<th>Mã</th><th>Khách</th><th>Xe</th><th>Thời hạn</th><th class="right">Giá/tháng</th>' +
      '<th class="right">Đã thu</th><th class="right">Còn nợ</th><th></th></tr></thead><tbody>' +
      (list.length ? list.map(function (c) {
        var ps = S.paymentsOf(c.id);
        var paid = ps.reduce(function (s, p) { return s + (p.paidAmount || 0); }, 0);
        var debt = S.debtOf(c.id), left = S.fromToday(c.endDate);
        var cls = c.status === 'active' && left <= 30 ? ' class="row-warn"' : debt > 0 ? ' class="row-danger"' : '';
        return '<tr' + cls + '><td class="mono">' + esc(c.code) + '</td>' +
          '<td>' + esc(custLabel(c.customerId)) + '<div class="tiny muted">' + esc((S.customer(c.customerId) || {}).phone || '') + '</div></td>' +
          '<td class="small">' + esc(carLabel(c.carId)) + '</td>' +
          '<td class="small nowrap">' + fmtDate(c.startDate) + ' → ' + fmtDate(c.endDate) +
          '<div class="tiny ' + (c.status === 'ended' ? 'muted' : left < 0 ? '' : '') + '">' +
          (c.status === 'ended' ? 'đã kết thúc' : left < 0 ? '<b style="color:var(--danger)">quá hạn ' + (-left) + ' ngày</b>' : 'còn ' + left + ' ngày') + '</div></td>' +
          '<td class="right mono">' + fmtShort(c.monthlyPrice) + '</td>' +
          '<td class="right mono">' + fmtShort(paid) + '<div class="tiny muted">/' + fmtShort(c.monthlyPrice * c.months) + '</div></td>' +
          '<td class="right mono">' + (debt ? '<b style="color:var(--danger)">' + fmtShort(debt) + '</b>' : '<span class="muted">0</span>') + '</td>' +
          '<td class="right nowrap"><button class="btn ghost sm" data-act="view-contract" data-id="' + c.id + '">Chi tiết</button></td></tr>';
      }).join('') : '<tr class="empty-row"><td colspan="8">Chưa có hợp đồng nào.</td></tr>') +
      '</tbody></table></div>';
  }
  function contractDialog(carId) {
    var cars = S.load().cars;
    var pre = carId ? S.car(carId) : (S.availableCars()[0] || cars[0]);
    modal({
      title: 'Hợp đồng thuê tháng mới', ok: 'Tạo hợp đồng', width: 680,
      body: '<div class="form-grid">' +
        fld('Xe cho thuê *', 'carId', { options: carOpts(pre && pre.id) }) +
        fld('Khách thuê *', 'customerId', { options: custOpts() + '<option value="__new">+ Khách mới…</option>' }) +
        fld('Khách mới — họ tên', 'newName', { ph: 'Chỉ điền nếu chọn “Khách mới”' }) +
        fld('Khách mới — điện thoại', 'newPhone', { ph: '09xx xxx xxx' }) +
        fld('Ngày bắt đầu *', 'startDate', { type: 'date', value: S.toISO(S.today()) }) +
        fld('Số tháng thuê *', 'months', { options: opts([{ v: 1, t: '1 tháng' }, { v: 3, t: '3 tháng' }, { v: 6, t: '6 tháng' }, { v: 12, t: '12 tháng' }, { v: 24, t: '24 tháng' }], 6) }) +
        fld('Giá thuê / tháng (₫)', 'monthlyPrice', { num: true, value: pre ? pre.price6m : 0 }) +
        fld('Tiền cọc (₫)', 'deposit', { num: true, value: pre ? pre.deposit : 0 }) +
        fld('Giới hạn km / tháng', 'kmLimit', { num: true, value: 3000 }) +
        fld('Phí vượt km (₫/km)', 'extraKmFee', { num: true, value: 4000 }) +
        '</div>' + fld('Ghi chú', 'note', { textarea: true, ph: 'Ví dụ: cọc bằng xe máy, giao xe tại Gò Vấp…' }),
      onOk: function (v, close, form) {
        if (v.customerId === '__new') {
          if (!v.newName.trim() || !v.newPhone.trim()) { toast('Nhập tên và số điện thoại khách mới', 'err'); return; }
          var cus = S.upsert('customers', { name: v.newName.trim(), phone: v.newPhone.trim(), idNumber: '', address: '', note: '' }, 'kh');
          v.customerId = cus.id;
        }
        if (!v.carId || !v.monthlyPrice) { toast('Chọn xe và nhập giá thuê', 'err'); return; }
        var ct = S.createContract({
          carId: v.carId, customerId: v.customerId, startDate: v.startDate,
          months: +v.months, monthlyPrice: v.monthlyPrice, deposit: v.deposit,
          kmLimit: v.kmLimit, extraKmFee: v.extraKmFee, note: v.note
        });
        close();
        refresh('Đã tạo ' + ct.code + ' và ' + ct.months + ' kỳ thu tiền');
      }
    }).root.addEventListener('change', function (e) {
      // đổi xe -> gợi ý lại giá theo thời hạn đang chọn
      var form = e.target.form || e.target.closest('form');
      if (!form || (e.target.name !== 'carId' && e.target.name !== 'months')) return;
      var c = S.car(form.carId.value);
      if (!c) return;
      var m = +form.months.value;
      form.monthlyPrice.value = m >= 12 ? c.price12m : m >= 6 ? c.price6m : m >= 3 ? c.price3m : c.pricePerMonth;
      form.deposit.value = c.deposit;
    });
  }
  function contractView(id) {
    var c = S.contract(id);
    if (!c) return;
    var ps = S.paymentsOf(id), cus = S.customer(c.customerId) || {}, car = S.car(c.carId) || {};
    var paid = ps.reduce(function (s, p) { return s + (p.paidAmount || 0); }, 0);
    var debt = S.debtOf(id);
    modal({
      title: 'Hợp đồng ' + c.code, ok: null, width: 700,
      body:
        '<div class="panels" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">' +
        '<div class="card card-pad"><div class="tiny muted">KHÁCH THUÊ</div><b>' + esc(cus.name) + '</b>' +
        '<div class="small muted">' + esc(cus.phone || '') + '<br>' + esc(cus.address || '') + '</div>' +
        '<div class="btn-row" style="margin-top:8px"><a class="btn ghost sm" href="tel:' + esc((cus.phone || '').replace(/\s/g, '')) + '">Gọi khách</a></div></div>' +
        '<div class="card card-pad"><div class="tiny muted">XE</div><b>' + esc(car.name) + '</b>' +
        '<div class="small muted mono">' + esc(car.plate) + '</div>' +
        '<div class="small muted">Cọc ' + fmtVND(c.deposit) + ' · ' + (c.kmLimit || 3000) + ' km/tháng</div></div>' +
        '</div>' +
        '<div class="kpis" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">' +
        kpi('Giá / tháng', S.fmtMil(c.monthlyPrice), c.months + ' tháng') +
        kpi('Đã thu', S.fmtMil(paid), 'trên ' + fmtShort(c.monthlyPrice * c.months) + '₫', 'good') +
        kpi('Còn nợ', S.fmtMil(debt), debt ? 'cần thu ngay' : 'không nợ', debt ? 'alert' : 'good') +
        '</div>' +
        '<div class="table-scroll"><table class="tbl" style="min-width:420px"><thead><tr>' +
        '<th>Kỳ</th><th>Hạn</th><th class="right">Tiền</th><th>Tình trạng</th><th></th></tr></thead><tbody>' +
        ps.map(function (p) {
          var left = S.fromToday(p.dueDate);
          return '<tr><td>' + S.fmtMonth(p.dueDate) + '</td><td class="nowrap">' + fmtDate(p.dueDate) + '</td>' +
            '<td class="right mono">' + fmtShort(p.amount) + '</td><td>' +
            (p.paidDate ? '<span class="badge ok">Đã thu</span>' : left < 0 ? '<span class="badge danger">Trễ ' + (-left) + 'n</span>' : left === 0 ? '<span class="badge danger">Hôm nay</span>' : '<span class="badge">Chưa tới</span>') +
            '</td><td class="right">' + (p.paidDate ? '' : '<button class="btn sm" data-act="pay" data-id="' + p.id + '">Đã thu</button>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        (c.note ? '<p class="small muted" style="margin-top:12px">Ghi chú: ' + esc(c.note) + '</p>' : '') +
        '<div class="btn-row" style="margin-top:14px">' +
        '<button class="btn ghost sm" data-act="print-contract" data-id="' + c.id + '">In hợp đồng</button>' +
        (c.status === 'active' ? '<button class="btn danger sm" data-act="end-contract" data-id="' + c.id + '">Kết thúc hợp đồng (trả xe)</button>' : '') +
        '</div>'
    });
  }
  function printContract(id) {
    var c = S.contract(id), d = S.load();
    if (!c) return;
    var cus = S.customer(c.customerId) || {}, car = S.car(c.carId) || {}, shop = d.shop;
    var w = window.open('', '_blank');
    if (!w) { toast('Trình duyệt chặn cửa sổ in', 'err'); return; }
    w.document.write('<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>' + esc(c.code) + '</title>' +
      '<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:30px auto;line-height:1.6;color:#111}' +
      'h1{font-size:20px;text-align:center}table{width:100%;border-collapse:collapse;margin:14px 0}' +
      'td,th{border:1px solid #bbb;padding:7px 9px;font-size:14px;text-align:left}' +
      '.sign{display:flex;justify-content:space-between;margin-top:50px;text-align:center}</style></head><body>' +
      '<p style="text-align:center;font-weight:700">' + esc(shop.name) + '<br><span style="font-weight:400;font-size:13px">' + esc(shop.address) + ' · ' + esc(shop.phone) + '</span></p>' +
      '<h1>HỢP ĐỒNG CHO THUÊ XE TỰ LÁI THEO THÁNG<br><span style="font-size:14px;font-weight:400">Số: ' + esc(c.code) + '</span></h1>' +
      '<p><b>Bên cho thuê (A):</b> ' + esc(shop.name) + ' — ' + esc(shop.phone) + '</p>' +
      '<p><b>Bên thuê (B):</b> ' + esc(cus.name) + ' — CCCD ' + esc(cus.idNumber || '…') + ' — ' + esc(cus.phone) + '<br>Địa chỉ: ' + esc(cus.address || '…') + '</p>' +
      '<table><tr><th>Xe</th><td>' + esc(car.name) + ' — biển số <b>' + esc(car.plate) + '</b> — đời ' + car.year + '</td></tr>' +
      '<tr><th>Thời hạn</th><td>' + c.months + ' tháng, từ ' + fmtDate(c.startDate) + ' đến ' + fmtDate(c.endDate) + '</td></tr>' +
      '<tr><th>Giá thuê</th><td><b>' + fmtVND(c.monthlyPrice) + '/tháng</b>, đóng vào ngày ' + S.parseDate(c.startDate).getDate() + ' mỗi tháng</td></tr>' +
      '<tr><th>Tiền cọc</th><td>' + fmtVND(c.deposit) + ' (hoàn lại khi trả xe nguyên trạng)</td></tr>' +
      '<tr><th>Giới hạn km</th><td>' + (c.kmLimit || 3000) + ' km/tháng, vượt tính ' + fmtVND(c.extraKmFee || 4000) + '/km</td></tr>' +
      '<tr><th>ODO khi giao</th><td>' + (car.odo || 0).toLocaleString('vi-VN') + ' km</td></tr></table>' +
      '<p><b>Điều khoản chính:</b> Bên A chịu bảo dưỡng định kỳ, bảo hiểm và đăng kiểm. Bên B chịu nhiên liệu, phí cầu đường, vệ sinh xe và các lỗi do va chạm theo mức miễn thường bảo hiểm. ' +
      'Bên B không dùng xe cầm cố, cho thuê lại, chạy đua hoặc chở hàng trái phép. Trả xe sớm phải báo trước 15 ngày.</p>' +
      (c.note ? '<p><b>Thoả thuận thêm:</b> ' + esc(c.note) + '</p>' : '') +
      '<div class="sign"><div><b>BÊN CHO THUÊ</b><br><br><br>………………………</div><div><b>BÊN THUÊ</b><br><br><br>………………………</div></div>' +
      '</body></html>');
    w.document.close();
    w.focus();
    w.print();
  }

  /* ====================== NHẮC HẠN ====================== */
  function renderAlerts(root) {
    var list = S.reminders(60);
    var ending = S.endingContracts(45);
    root.innerHTML =
      '<div class="view-head"><div><h2>Nhắc hạn</h2>' +
      '<p class="muted small" style="margin:0">Đăng kiểm, bảo hiểm, bảo dưỡng trong 60 ngày tới và hợp đồng sắp hết hạn.</p></div></div>' +
      '<div class="card table-scroll" style="margin-bottom:18px"><table class="tbl"><thead><tr>' +
      '<th>Việc</th><th>Xe</th><th>Mốc</th><th>Còn lại</th><th></th></tr></thead><tbody>' +
      (list.length ? list.map(function (a) {
        var cls = a.left < 0 ? ' class="row-danger"' : a.left <= 15 ? ' class="row-warn"' : '';
        return '<tr' + cls + '><td><b>' + esc(a.kind) + '</b></td>' +
          '<td class="small">' + esc(carLabel(a.carId)) + '</td>' +
          '<td class="small">' + esc(a.detail) + '</td>' +
          '<td class="nowrap">' + (a.left < 0 ? '<span class="badge danger">Đã quá hạn</span>' :
            a.left <= 15 ? '<span class="badge warn">' + a.left + ' ngày</span>' : a.left + ' ngày') + '</td>' +
          '<td class="right nowrap">' +
          '<button class="btn ghost sm" data-act="edit-car" data-id="' + a.carId + '">Cập nhật xe</button> ' +
          (a.kind === 'Bảo dưỡng' ? '<button class="btn sm" data-act="done-service" data-id="' + a.carId + '">Đã bảo dưỡng</button>' : '') +
          '</td></tr>';
      }).join('') : '<tr class="empty-row"><td colspan="5">Không có hạn nào trong 60 ngày tới.</td></tr>') +
      '</tbody></table></div>' +
      '<div class="panel"><header><h3>Hợp đồng hết hạn trong 45 ngày</h3></header>' +
      (ending.length ? '<ul class="list">' + ending.map(function (c) {
        return li(custLabel(c.customerId) + ' · ' + c.code,
          carLabel(c.carId) + ' · ' + fmtDate(c.endDate) + ' · ' + (c.left < 0 ? 'quá hạn ' + (-c.left) + ' ngày' : 'còn ' + c.left + ' ngày'),
          '<button class="btn ghost sm" data-act="view-contract" data-id="' + c.id + '">Xem</button>');
      }).join('') + '</ul>' : '<div class="empty">Không có hợp đồng nào sắp hết hạn.</div>') + '</div>';
  }

  /* ====================== YÊU CẦU TỪ WEB ====================== */
  function renderLeads(root) {
    var list = S.load().leads.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    var STATUS = { new: ['danger', 'Mới — cần gọi'], contacted: ['warn', 'Đã liên hệ'], won: ['ok', 'Đã chốt'], lost: ['', 'Không thuê'] };
    root.innerHTML =
      '<div class="view-head"><div><h2>Yêu cầu thuê từ website</h2>' +
      '<p class="muted small" style="margin:0">Khách gửi form trên web sẽ hiện ở đây. Chốt được thì bấm “Tạo hợp đồng”.</p></div></div>' +
      '<div class="card table-scroll"><table class="tbl"><thead><tr>' +
      '<th>Ngày gửi</th><th>Khách</th><th>Xe muốn thuê</th><th>Nhu cầu</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
      (list.length ? list.map(function (l) {
        var st = STATUS[l.status] || STATUS.new;
        return '<tr' + (l.status === 'new' ? ' class="row-warn"' : '') + '>' +
          '<td class="nowrap small">' + fmtDate(l.createdAt) + '</td>' +
          '<td><b>' + esc(l.name) + '</b><div class="tiny muted mono">' + esc(l.phone) + '</div></td>' +
          '<td class="small">' + esc(l.carId ? carLabel(l.carId) : 'Chưa chọn — cần tư vấn') + '</td>' +
          '<td class="small">' + l.months + ' tháng' + (l.startDate ? ' · từ ' + fmtDate(l.startDate) : '') +
          (l.note ? '<div class="tiny muted">' + esc(l.note) + '</div>' : '') + '</td>' +
          '<td><span class="badge ' + st[0] + '">' + st[1] + '</span></td>' +
          '<td class="right nowrap">' +
          '<a class="btn ghost sm" href="tel:' + esc(l.phone.replace(/\s/g, '')) + '">Gọi</a> ' +
          (l.status === 'new' ? '<button class="btn ghost sm" data-act="lead-status" data-id="' + l.id + '" data-v="contacted">Đã gọi</button> ' : '') +
          (l.status !== 'won' ? '<button class="btn sm" data-act="lead-win" data-id="' + l.id + '">Tạo hợp đồng</button> ' : '') +
          (l.status !== 'lost' ? '<button class="btn ghost sm" data-act="lead-status" data-id="' + l.id + '" data-v="lost">Bỏ</button>' : '') +
          '</td></tr>';
      }).join('') : '<tr class="empty-row"><td colspan="6">Chưa có yêu cầu nào. Thử gửi form ở trang khách để xem nó chạy.</td></tr>') +
      '</tbody></table></div>';
  }

  /* ====================== CHI PHÍ ====================== */
  function renderExpenses(root) {
    var d = S.load(), ym = S.toISO(S.today()).slice(0, 7);
    var list = d.expenses.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var monthSum = S.expenseOfMonth(ym);
    var byCat = {};
    list.forEach(function (e) { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    root.innerHTML =
      '<div class="view-head"><div><h2>Chi phí đội xe</h2>' +
      '<p class="muted small" style="margin:0">Ghi chi phí theo xe để tính được lãi/lỗ từng chiếc.</p></div>' +
      '<div class="btn-row"><button class="btn" data-act="new-expense">' + ICON.plus + 'Ghi chi phí</button>' +
      '<button class="btn ghost" data-act="export-expenses">' + ICON.download + 'Xuất CSV</button></div></div>' +
      '<div class="kpis">' +
      kpi('Chi tháng này', S.fmtMil(monthSum), ym) +
      kpi('Tổng đã ghi', S.fmtMil(list.reduce(function (s, e) { return s + e.amount; }, 0)), list.length + ' khoản') +
      Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).slice(0, 3).map(function (k) {
        return kpi(k, S.fmtMil(byCat[k]), 'tổng cộng');
      }).join('') + '</div>' +
      '<div class="card table-scroll"><table class="tbl"><thead><tr>' +
      '<th>Ngày</th><th>Xe</th><th>Loại</th><th class="right">Số tiền</th><th>Ghi chú</th><th></th></tr></thead><tbody>' +
      (list.length ? list.slice(0, 80).map(function (e) {
        return '<tr><td class="nowrap">' + fmtDate(e.date) + '</td>' +
          '<td class="small">' + esc(carLabel(e.carId)) + '</td>' +
          '<td>' + esc(e.category) + '</td>' +
          '<td class="right mono">' + fmtVND(e.amount) + '</td>' +
          '<td class="small muted">' + esc(e.note || '') + '</td>' +
          '<td class="right"><button class="btn ghost sm" data-act="del-expense" data-id="' + e.id + '">Xoá</button></td></tr>';
      }).join('') : '<tr class="empty-row"><td colspan="6">Chưa ghi chi phí nào.</td></tr>') +
      '</tbody></table></div>';
  }
  function expenseDialog() {
    modal({
      title: 'Ghi chi phí', ok: 'Lưu', width: 560,
      body: '<div class="form-grid">' +
        fld('Xe *', 'carId', { options: carOpts() }) +
        fld('Ngày', 'date', { type: 'date', value: S.toISO(S.today()) }) +
        fld('Loại chi phí', 'category', {
          options: opts(['Bảo dưỡng', 'Sửa chữa', 'Bảo hiểm', 'Đăng kiểm', 'Rửa xe', 'Lốp', 'Trả góp', 'Khác']
            .map(function (x) { return { v: x, t: x }; }))
        }) +
        fld('Số tiền (₫) *', 'amount', { num: true, ph: '850000' }) +
        '</div>' + fld('Ghi chú', 'note', { textarea: true }),
      onOk: function (v, close) {
        if (!v.amount) { toast('Nhập số tiền', 'err'); return; }
        S.upsert('expenses', v, 'cp');
        close();
        refresh('Đã ghi chi phí ' + fmtVND(v.amount));
      }
    });
  }

  /* ====================== LÃI / LỖ (chủ xe) ====================== */
  var profitMonths = 6;
  function renderProfit(root) {
    var list = S.carProfit(profitMonths);
    var max = Math.max.apply(null, list.map(function (x) { return Math.abs(x.profit); }).concat([1]));
    var tot = list.reduce(function (a, x) {
      a.income += x.income; a.expense += x.expense; a.loan += x.loan; a.profit += x.profit; return a;
    }, { income: 0, expense: 0, loan: 0, profit: 0 });
    root.innerHTML =
      '<div class="view-head"><div><h2>Lãi / lỗ từng xe</h2>' +
      '<p class="muted small" style="margin:0">Tiền đã thu − chi phí − trả góp, trong ' + profitMonths + ' tháng gần nhất. Chỉ chủ xe thấy mục này.</p></div>' +
      '<div class="seg">' + [3, 6, 12].map(function (m) {
        return '<button data-pm="' + m + '"' + (profitMonths === m ? ' class="on"' : '') + '>' + m + ' tháng</button>';
      }).join('') + '</div></div>' +
      '<div class="kpis">' +
      kpi('Đã thu', S.fmtMil(tot.income), profitMonths + ' tháng', 'good') +
      kpi('Chi phí', S.fmtMil(tot.expense), 'sửa chữa, bảo dưỡng…') +
      kpi('Trả góp', S.fmtMil(tot.loan), 'ngân hàng') +
      kpi('Lợi nhuận', S.fmtMil(tot.profit), tot.profit >= 0 ? 'đang có lãi' : 'đang lỗ', tot.profit >= 0 ? 'good' : 'alert') +
      '</div>' +
      '<div class="card table-scroll"><table class="tbl"><thead><tr>' +
      '<th>Xe</th><th class="right">Thu</th><th class="right">Chi</th><th class="right">Trả góp</th>' +
      '<th class="right">Lãi/lỗ</th><th>So sánh</th><th>Tình trạng</th></tr></thead><tbody>' +
      list.map(function (x) {
        var neg = x.profit < 0;
        return '<tr' + (neg ? ' class="row-danger"' : '') + '>' +
          '<td>' + esc(x.car.name) + '<div class="tiny muted mono">' + esc(x.car.plate) + '</div></td>' +
          '<td class="right mono">' + fmtShort(x.income) + '</td>' +
          '<td class="right mono">' + fmtShort(x.expense) + '</td>' +
          '<td class="right mono">' + fmtShort(x.loan) + '</td>' +
          '<td class="right mono"><b style="color:' + (neg ? 'var(--danger)' : 'var(--ok)') + '">' + fmtShort(x.profit) + '</b></td>' +
          '<td><div class="bar"><i class="' + (neg ? 'neg' : '') + '" style="width:' + Math.round(Math.abs(x.profit) / max * 100) + '%"></i></div></td>' +
          '<td>' + carStatusBadge(x.car) + '</td></tr>';
      }).join('') +
      '<tr class="sum-row"><td>Tổng ' + list.length + ' xe</td>' +
      '<td class="right mono">' + fmtShort(tot.income) + '</td><td class="right mono">' + fmtShort(tot.expense) + '</td>' +
      '<td class="right mono">' + fmtShort(tot.loan) + '</td><td class="right mono">' + fmtShort(tot.profit) + '</td><td colspan="2"></td></tr>' +
      '</tbody></table></div>' +
      '<p class="small muted" style="margin-top:12px">Xe lỗ thường do đang trống nhiều tháng hoặc vừa sửa lớn — xem lại giá thuê hoặc đẩy quảng cáo cho xe đó.</p>';
  }

  /* ====================== KHÁCH HÀNG ====================== */
  function renderCustomers(root) {
    var d = S.load();
    root.innerHTML =
      '<div class="view-head"><div><h2>Khách hàng (' + d.customers.length + ')</h2>' +
      '<p class="muted small" style="margin:0">Lịch sử thuê và công nợ của từng khách.</p></div>' +
      '<div class="btn-row"><button class="btn" data-act="new-customer">' + ICON.plus + 'Thêm khách</button></div></div>' +
      '<div class="card table-scroll"><table class="tbl"><thead><tr>' +
      '<th>Khách</th><th>Điện thoại</th><th>CCCD</th><th>Địa chỉ</th><th class="right">Số HĐ</th>' +
      '<th class="right">Đang nợ</th><th></th></tr></thead><tbody>' +
      d.customers.map(function (c) {
        var cts = d.contracts.filter(function (x) { return x.customerId === c.id; });
        var debt = cts.reduce(function (s, x) { return s + S.debtOf(x.id); }, 0);
        var active = cts.filter(function (x) { return x.status === 'active'; })[0];
        return '<tr' + (debt ? ' class="row-danger"' : '') + '><td><b>' + esc(c.name) + '</b>' +
          (active ? '<div class="tiny muted">' + esc(carLabel(active.carId)) + '</div>' : '') + '</td>' +
          '<td class="mono nowrap">' + esc(c.phone) + '</td><td class="small">' + esc(c.idNumber || '—') + '</td>' +
          '<td class="small">' + esc(c.address || '—') + '</td><td class="right">' + cts.length + '</td>' +
          '<td class="right mono">' + (debt ? '<b style="color:var(--danger)">' + fmtShort(debt) + '</b>' : '0') + '</td>' +
          '<td class="right nowrap"><a class="btn ghost sm" href="tel:' + esc(c.phone.replace(/\s/g, '')) + '">Gọi</a> ' +
          '<button class="btn ghost sm" data-act="edit-customer" data-id="' + c.id + '">Sửa</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function customerDialog(id) {
    var c = id ? S.customer(id) : { name: '', phone: '', idNumber: '', address: '', note: '' };
    modal({
      title: id ? 'Sửa khách ' + c.name : 'Thêm khách hàng', ok: 'Lưu', width: 560,
      body: '<div class="form-grid">' +
        fld('Họ tên *', 'name', { value: c.name }) +
        fld('Điện thoại *', 'phone', { value: c.phone }) +
        fld('Số CCCD', 'idNumber', { value: c.idNumber }) +
        fld('Địa chỉ', 'address', { value: c.address }) +
        '</div>' + fld('Ghi chú', 'note', { textarea: true, value: c.note }),
      onOk: function (v, close) {
        if (!v.name.trim() || !v.phone.trim()) { toast('Cần tên và số điện thoại', 'err'); return; }
        if (id) v.id = id;
        S.upsert('customers', v, 'kh');
        close();
        refresh('Đã lưu khách hàng');
      }
    });
  }

  /* ====================== xuất / nạp CSV ====================== */
  function exportCars() {
    dl('doi-xe.csv', csv([['Bien so', 'Ten xe', 'Hang', 'Nam', 'So cho', 'Hop so', 'Gia thang', 'Coc', 'ODO',
      'Han dang kiem', 'Han bao hiem', 'Tra gop/thang', 'Tinh trang']].concat(
        S.load().cars.map(function (c) {
          return [c.plate, c.name, c.brand, c.year, c.seats, c.gearbox, c.pricePerMonth, c.deposit, c.odo,
            c.inspectionDue, c.insuranceDue, c.loanPerMonth, c.status];
        }))));
    toast('Đã tải doi-xe.csv — mở bằng Excel được');
  }
  function exportMoney() {
    var rows = [['Ky', 'Ma HD', 'Khach', 'SDT', 'Xe', 'Han dong', 'So tien', 'Da thu', 'Ngay thu']];
    S.load().payments.slice().sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; }).forEach(function (p) {
      var ct = S.contract(p.contractId) || {}, cus = S.customer(ct.customerId) || {};
      rows.push([S.fmtMonth(p.dueDate), ct.code, cus.name, cus.phone, carLabel(ct.carId),
        p.dueDate, p.amount, p.paidAmount || 0, p.paidDate || '']);
    });
    dl('thu-tien.csv', csv(rows));
    toast('Đã tải thu-tien.csv');
  }
  function exportContracts() {
    var rows = [['Ma HD', 'Khach', 'SDT', 'Xe', 'Bat dau', 'Ket thuc', 'So thang', 'Gia thang', 'Coc', 'Da thu', 'Con no', 'Trang thai']];
    S.load().contracts.forEach(function (c) {
      var cus = S.customer(c.customerId) || {};
      var paid = S.paymentsOf(c.id).reduce(function (s, p) { return s + (p.paidAmount || 0); }, 0);
      rows.push([c.code, cus.name, cus.phone, carLabel(c.carId), c.startDate, c.endDate, c.months,
        c.monthlyPrice, c.deposit, paid, S.debtOf(c.id), c.status]);
    });
    dl('hop-dong.csv', csv(rows));
    toast('Đã tải hop-dong.csv');
  }
  function exportExpenses() {
    var rows = [['Ngay', 'Xe', 'Loai', 'So tien', 'Ghi chu']];
    S.load().expenses.forEach(function (e) { rows.push([e.date, carLabel(e.carId), e.category, e.amount, e.note || '']); });
    dl('chi-phi.csv', csv(rows));
    toast('Đã tải chi-phi.csv');
  }
  /** Nạp danh sách xe từ nội dung dán ra từ Excel / Google Sheet. */
  function importCars() {
    modal({
      title: 'Nạp danh sách xe từ Excel', ok: 'Nạp vào hệ thống', width: 700,
      body: '<p class="small muted">Copy các dòng trong Excel/Google Sheet rồi dán vào đây. Mỗi dòng 1 xe, các cột cách nhau bằng Tab hoặc dấu phẩy, theo thứ tự:</p>' +
        '<p class="small mono" style="background:var(--surface-2);padding:10px;border-radius:8px">' +
        'Biển số, Tên xe, Năm, Số chỗ, AT/MT, Giá thuê tháng, Cọc, ODO, Hạn đăng kiểm (yyyy-mm-dd), Hạn bảo hiểm</p>' +
        '<label class="f"><span>Dán dữ liệu</span><textarea name="raw" style="min-height:170px" placeholder="51H-123.45&#9;Toyota Vios E&#9;2022&#9;5&#9;AT&#9;11500000&#9;18000000&#9;42000&#9;2027-03-15&#9;2026-11-02"></textarea></label>' +
        '<label class="small" style="display:flex;gap:8px;align-items:center;font-weight:600">' +
        '<input type="checkbox" name="wipe" style="width:auto"> Xoá hết xe cũ trước khi nạp</label>',
      onOk: function (v, close) {
        var lines = (v.raw || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) { toast('Chưa dán dữ liệu', 'err'); return; }
        var d = S.load();
        if (v.wipe) d.cars = [];
        var n = 0, bad = 0;
        lines.forEach(function (ln) {
          var p = ln.split(/\t|;|,(?=\s*\S)/).map(function (s) { return s.trim(); });
          if (p.length < 6) { bad++; return; }
          var money = function (s) { return Number(String(s || '').replace(/[^\d]/g, '')) || 0; };
          var price = money(p[5]);
          d.cars.push({
            id: S.uid('car'), plate: p[0], name: p[1], brand: (p[1] || '').split(' ')[0],
            year: Number(p[2]) || new Date().getFullYear(), seats: Number(p[3]) || 5,
            gearbox: /mt|san/i.test(p[4] || '') ? 'MT' : 'AT',
            pricePerMonth: price,
            price3m: Math.round(price * .95 / 1e5) * 1e5, price6m: Math.round(price * .9 / 1e5) * 1e5,
            price12m: Math.round(price * .85 / 1e5) * 1e5,
            deposit: money(p[6]) || Math.round(price * 1.5 / 1e6) * 1e6,
            odo: money(p[7]), serviceIntervalKm: 5000, lastServiceOdo: money(p[7]),
            inspectionDue: p[8] || '', insuranceDue: p[9] || '',
            loanPerMonth: 0, photo: '', status: 'available', note: '', kmLimit: 3000
          });
          n++;
        });
        S.save();
        close();
        refresh('Đã nạp ' + n + ' xe' + (bad ? ', bỏ qua ' + bad + ' dòng thiếu cột' : ''));
      }
    });
  }

  /* ====================== điều phối sự kiện ====================== */
  document.addEventListener('click', function (e) {
    var jump = e.target.closest('[data-tab-jump]');
    if (jump) { go(jump.getAttribute('data-tab-jump')); return; }
    var mf = e.target.closest('[data-money]');
    if (mf) { moneyFilter = mf.getAttribute('data-money'); go('money'); return; }
    var cv = e.target.closest('[data-carview]');
    if (cv) { carView = cv.getAttribute('data-carview'); go('cars'); return; }
    var cf = e.target.closest('[data-ctf]');
    if (cf) { ctFilter = cf.getAttribute('data-ctf'); go('contracts'); return; }
    var pm = e.target.closest('[data-pm]');
    if (pm) { profitMonths = +pm.getAttribute('data-pm'); go('profit'); return; }

    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
    switch (act) {
      case 'new-car': carDialog(null); break;
      case 'edit-car': carDialog(id); break;
      case 'new-contract': contractDialog(b.getAttribute('data-car')); break;
      case 'view-contract': contractView(id); break;
      case 'print-contract': printContract(id); break;
      case 'end-contract':
        confirmBox('Kết thúc hợp đồng và trả xe về trạng thái trống?', function () {
          S.endContract(id);
          $$('.modal-back').forEach(function (m) { m.remove(); });
          refresh('Đã kết thúc hợp đồng, xe về trạng thái trống');
        });
        break;
      case 'pay': payDialog(id); break;
      case 'unpay':
        confirmBox('Hoàn tác khoản đã thu này?', function () { S.unmarkPaid(id); refresh('Đã hoàn tác'); });
        break;
      case 'done-service': {
        var car = S.car(id);
        if (!car) break;
        car.lastServiceOdo = car.odo;
        S.save();
        refresh('Đã ghi nhận bảo dưỡng ' + car.plate + ' tại ' + (car.odo || 0).toLocaleString('vi-VN') + ' km');
        break;
      }
      case 'new-expense': expenseDialog(); break;
      case 'del-expense':
        if (!isOwner()) { toast('Nhân viên không được xoá chi phí', 'err'); break; }
        confirmBox('Xoá khoản chi phí này?', function () { S.remove('expenses', id); refresh('Đã xoá'); });
        break;
      case 'new-customer': customerDialog(null); break;
      case 'edit-customer': customerDialog(id); break;
      case 'lead-status': {
        var l = S.load().leads.filter(function (x) { return x.id === id; })[0];
        if (l) { l.status = b.getAttribute('data-v'); S.save(); refresh('Đã cập nhật yêu cầu'); }
        break;
      }
      case 'lead-win': {
        var lead = S.load().leads.filter(function (x) { return x.id === id; })[0];
        if (!lead) break;
        var cus2 = S.load().customers.filter(function (c) { return c.phone.replace(/\s/g, '') === lead.phone.replace(/\s/g, ''); })[0];
        if (!cus2) cus2 = S.upsert('customers', { name: lead.name, phone: lead.phone, idNumber: '', address: '', note: 'Từ yêu cầu trên web' }, 'kh');
        lead.status = 'won';
        S.save();
        contractDialog(lead.carId);
        setTimeout(function () {
          var f = $('.modal-back form');
          if (!f) return;
          f.customerId.value = cus2.id;
          if (lead.months) f.months.value = String(lead.months);
          if (lead.startDate) f.startDate.value = lead.startDate;
          f.months.dispatchEvent(new Event('change', { bubbles: true }));
        }, 30);
        break;
      }
      case 'export-cars': exportCars(); break;
      case 'export-money': exportMoney(); break;
      case 'export-contracts': exportContracts(); break;
      case 'export-expenses': exportExpenses(); break;
      case 'import-cars': importCars(); break;
      case 'reset-demo':
        confirmBox('Xoá toàn bộ dữ liệu demo và tạo lại dữ liệu mẫu ban đầu?', function () {
          S.reset();
          refresh('Đã tạo lại dữ liệu mẫu');
        });
        break;
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'car-q') {
      carQ = e.target.value;
      var pos = e.target.selectionStart;
      go('cars');
      var box = $('#car-q');
      if (box) { box.focus(); box.setSelectionRange(pos, pos); }
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'car-status') { carStatus = e.target.value; go('cars'); }
  });

  /* ====================== khởi động ====================== */
  $$('[data-shop]').forEach(function (el) {
    var k = el.getAttribute('data-shop'), v = S.load().shop[k];
    if (v != null) el.textContent = k === 'name' ? String(v).split('—')[0].trim() : v;
  });
  $('#today-badge').textContent = 'Hôm nay ' + fmtDate(S.toISO(S.today()));
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('thuexe.me') || 'null'); } catch (e) { }
  if (saved && saved.role) login(saved.role, saved.name);
  else {
    $('#gate').classList.remove('hide');
    buildTabs();
  }
})();
