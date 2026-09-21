/* ==========================================================================
   store.js — tầng dữ liệu dùng chung cho website khách + hệ thống quản lý.
   Bản demo: dữ liệu nằm trong localStorage của trình duyệt.
   Khi nối database thật (Supabase/Postgres) chỉ cần thay 4 hàm load/save/seed/uid.
   ========================================================================== */
(function (global) {
  'use strict';

  var KEY = 'thuexe.v1';

  /* ---------- tiện ích ---------- */
  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function parseDate(s) {
    if (!s) return null;
    var p = String(s).split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function addMonths(d, n) {
    var x = new Date(d), day = x.getDate();
    x.setDate(1);
    x.setMonth(x.getMonth() + n);
    // 31/01 + 1 tháng -> 28/02 thay vì nhảy sang tháng 3
    var last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(day, last));
    return x;
  }
  function dayDiff(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
  function fromToday(iso) { return iso ? Math.round((parseDate(iso) - today()) / 86400000) : null; }

  function fmtVND(n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(n).toLocaleString('vi-VN') + '₫';
  }
  function fmtShort(n) {
    if (n == null || isNaN(n)) return '—';
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1).replace('.', ',') + ' tỷ';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace('.', ',') + ' tr';
    return Math.round(n).toLocaleString('vi-VN');
  }
  function fmtDate(iso) {
    var d = parseDate(iso);
    return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : '—';
  }
  function fmtMonth(iso) {
    var d = parseDate(iso);
    return d ? 'T' + (d.getMonth() + 1) + '/' + d.getFullYear() : '—';
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- ảnh tạm: SVG tự sinh, không cần mạng ---------- */
  var PALETTE = [
    ['#0f5ef7', '#00c2ff'], ['#7b2ff7', '#f107a3'], ['#0f8a5f', '#93e9be'],
    ['#ff7a18', '#ffd166'], ['#16181d', '#4b5563'], ['#c8362a', '#ff8f6b'],
    ['#0369a1', '#67e8f9'], ['#4d7c0f', '#d9f99d']
  ];
  function placeholder(car) {
    var seed = 0, s = (car.plate || car.name || 'xe');
    for (var i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) % 9973;
    var c = PALETTE[seed % PALETTE.length];
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="640" height="400" fill="url(#g)"/>' +
      '<g fill="rgba(255,255,255,.92)" transform="translate(120,150) scale(1.35)">' +
      '<path d="M8 60c-4 0-8-3-8-8V38c0-5 3-9 7-11l12-4 10-16c2-4 6-6 10-6h60c5 0 9 2 11 6l10 16 12 4c4 2 7 6 7 11v14c0 5-4 8-8 8h-9a14 14 0 0 1-28 0H45a14 14 0 0 1-28 0H8z"/>' +
      '<circle cx="31" cy="58" r="8" fill="' + c[0] + '"/><circle cx="117" cy="58" r="8" fill="' + c[0] + '"/>' +
      '<path d="M34 12h-2l-8 14h36V12H34zm40 0v14h36l-8-14H74z" fill="rgba(255,255,255,.55)"/>' +
      '</g>' +
      '<text x="32" y="344" font-family="sans-serif" font-size="34" font-weight="700" fill="#fff">' + esc(car.name || '') + '</text>' +
      '<text x="32" y="378" font-family="monospace" font-size="22" fill="rgba(255,255,255,.85)">' + esc(car.plate || '') + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function photoOf(car) { return car && car.photo ? car.photo : placeholder(car || {}); }

  /* ---------- đọc / ghi ---------- */
  var db = null;
  function load() {
    if (db) return db;
    try {
      var raw = global.localStorage ? global.localStorage.getItem(KEY) : null;
      if (raw) { db = JSON.parse(raw); }
    } catch (e) { db = null; }
    if (!db || !db.cars) { db = seed(); save(); }
    return db;
  }
  function save() {
    try { if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { /* trình duyệt chặn lưu -> demo vẫn chạy trong bộ nhớ */ }
    return db;
  }
  function reset() { db = seed(); save(); return db; }

  /* ---------- dữ liệu mẫu: 20 xe ---------- */
  var FLEET = [
    // name, hãng, năm, chỗ, hộp số, giá thuê tháng (triệu)
    ['Toyota Vios E', 'Toyota', 2022, 5, 'AT', 11.5], ['Hyundai Accent 1.4', 'Hyundai', 2021, 5, 'AT', 11],
    ['Hyundai Grand i10', 'Hyundai', 2020, 5, 'MT', 8.5], ['Kia Morning', 'Kia', 2021, 5, 'AT', 8.8],
    ['Honda City RS', 'Honda', 2022, 5, 'AT', 13], ['Mazda 3 Luxury', 'Mazda', 2021, 5, 'AT', 14],
    ['Kia K3 Premium', 'Kia', 2022, 5, 'AT', 13.5], ['Toyota Altis', 'Toyota', 2020, 5, 'AT', 12.5],
    ['Nissan Almera VL', 'Nissan', 2022, 5, 'AT', 11.2], ['Mitsubishi Attrage', 'Mitsubishi', 2021, 5, 'AT', 10.5],
    ['Mitsubishi Xpander', 'Mitsubishi', 2022, 7, 'AT', 15], ['Toyota Veloz Cross', 'Toyota', 2023, 7, 'AT', 16],
    ['Suzuki Ertiga Sport', 'Suzuki', 2021, 7, 'AT', 13.5], ['Toyota Innova G', 'Toyota', 2020, 7, 'MT', 15.5],
    ['Kia Carens Luxury', 'Kia', 2023, 7, 'AT', 17], ['Hyundai Creta', 'Hyundai', 2022, 5, 'AT', 15.5],
    ['Kia Seltos Premium', 'Kia', 2022, 5, 'AT', 16], ['Toyota Corolla Cross', 'Toyota', 2021, 5, 'AT', 18],
    ['Honda CR-V L', 'Honda', 2021, 7, 'AT', 22], ['Toyota Fortuner 2.4', 'Toyota', 2020, 7, 'AT', 24]
  ];
  var CUST = [
    ['Nguyễn Văn Hải', '0903 112 455'], ['Trần Thị Mai', '0912 663 208'], ['Lê Quốc Dũng', '0938 774 190'],
    ['Phạm Thu Hằng', '0977 205 641'], ['Võ Minh Tuấn', '0905 318 772'], ['Đặng Kim Ngân', '0968 440 127'],
    ['Bùi Thanh Sơn', '0932 087 513'], ['Hoàng Anh Thư', '0919 652 380'], ['Ngô Gia Bảo', '0985 771 236'],
    ['Trương Mỹ Linh', '0946 330 815'], ['Đỗ Hữu Phước', '0908 519 744'], ['Lý Thu Trang', '0973 618 202']
  ];
  var CITY = ['Q. Bình Thạnh, TP.HCM', 'Q. 7, TP.HCM', 'Q. Tân Bình, TP.HCM', 'TP. Thủ Đức, TP.HCM', 'Q. Gò Vấp, TP.HCM'];

  function seed() {
    var t = today(), i, r = 0;
    function rnd(n) { r = (r * 9301 + 49297) % 233280; return Math.floor(r / 233280 * n); }
    r = 20250921; // cố định để mỗi lần reset ra cùng dữ liệu mẫu

    var cars = FLEET.map(function (f, idx) {
      var base = f[5] * 1e6;
      return {
        id: 'car' + pad(idx + 1),
        plate: '51' + 'ABCDFGH'[idx % 7] + '-' + (100 + idx * 37 % 900) + '.' + (10 + (idx * 17) % 89),
        name: f[0], brand: f[1], year: f[2], seats: f[3], gearbox: f[4],
        pricePerMonth: base,
        price3m: Math.round(base * 0.95 / 1e5) * 1e5,
        price6m: Math.round(base * 0.9 / 1e5) * 1e5,
        price12m: Math.round(base * 0.85 / 1e5) * 1e5,
        deposit: Math.round(base * 1.5 / 1e6) * 1e6,
        odo: 18000 + rnd(90) * 1000,
        serviceIntervalKm: 5000,
        lastServiceOdo: 0,
        inspectionDue: toISO(addDays(t, rnd(400) - 30)),
        insuranceDue: toISO(addDays(t, rnd(360) - 20)),
        loanPerMonth: idx % 3 === 0 ? (4 + rnd(4)) * 1e6 : 0,
        photo: '',
        status: 'available',
        note: ''
      };
    });
    cars.forEach(function (c) { c.lastServiceOdo = c.odo - rnd(6000); });

    var customers = CUST.map(function (c, idx) {
      return {
        id: 'kh' + pad(idx + 1), name: c[0], phone: c[1],
        idNumber: '0790' + (10000000 + rnd(89999999)),
        address: CITY[idx % CITY.length], note: ''
      };
    });

    // 13 xe đang có hợp đồng, 2 xe bảo dưỡng, 5 xe trống
    var contracts = [], payments = [], expenses = [], code = 1;
    for (i = 0; i < 13; i++) {
      var car = cars[i], cus = customers[i % customers.length];
      var months = [3, 6, 6, 12, 3, 6, 12, 3, 6, 12, 3, 6, 6][i];
      var start = addMonths(t, -(1 + rnd(Math.max(1, months - 1))));
      var monthly = [car.pricePerMonth, car.price3m, car.price6m, car.price12m][months >= 12 ? 3 : months >= 6 ? 2 : 1];
      var ct = {
        id: uid('hd'), code: 'HD' + (2600 + code++),
        carId: car.id, customerId: cus.id,
        startDate: toISO(start), months: months,
        endDate: toISO(addMonths(start, months)),
        monthlyPrice: monthly, deposit: car.deposit,
        kmLimit: 3000, extraKmFee: 4000,
        status: 'active', note: ''
      };
      contracts.push(ct);
      car.status = 'rented';

      // sinh kỳ thu tiền theo tháng
      for (var k = 0; k < months; k++) {
        var due = addMonths(start, k);
        payments.push({
          id: uid('kt'), contractId: ct.id, period: toISO(due).slice(0, 7),
          dueDate: toISO(due), amount: monthly,
          paidDate: null, paidAmount: 0
        });
      }
    }
    // đánh dấu đã thu cho các kỳ quá khứ, chừa lại vài khoản nợ để demo
    var lateKeep = { 0: 1, 4: 1, 7: 2, 11: 1 };
    payments.forEach(function (p) {
      if (parseDate(p.dueDate) <= t) {
        p.paidDate = toISO(addDays(parseDate(p.dueDate), rnd(3)));
        p.paidAmount = p.amount;
      }
    });
    // để lại công nợ: kỳ gần nhất của 4 hợp đồng chưa thu
    Object.keys(lateKeep).forEach(function (idx) {
      var ct = contracts[+idx];
      if (!ct) return;
      var ps = payments.filter(function (p) { return p.contractId === ct.id && p.paidDate; });
      ps.slice(-lateKeep[idx]).forEach(function (p) { p.paidDate = null; p.paidAmount = 0; });
    });

    cars[15].status = 'maintenance';
    cars[16].status = 'maintenance';

    // chi phí mẫu
    var CAT = ['Bảo dưỡng', 'Sửa chữa', 'Bảo hiểm', 'Đăng kiểm', 'Rửa xe', 'Trả góp'];
    for (i = 0; i < 26; i++) {
      var c2 = cars[rnd(cars.length)];
      expenses.push({
        id: uid('cp'), carId: c2.id, date: toISO(addDays(t, -rnd(120))),
        category: CAT[rnd(CAT.length)], amount: (3 + rnd(28)) * 1e5, note: ''
      });
    }

    // yêu cầu thuê từ website
    var leads = [
      { id: uid('yc'), createdAt: toISO(addDays(t, -1)), name: 'Nguyễn Trọng Nghĩa', phone: '0907 441 288', carId: cars[13].id, months: 6, startDate: toISO(addDays(t, 5)), note: 'Cần xe 7 chỗ đi làm, có thể cọc trước.', status: 'new' },
      { id: uid('yc'), createdAt: toISO(addDays(t, -2)), name: 'Phan Thị Yến', phone: '0935 620 114', carId: cars[17].id, months: 12, startDate: toISO(addDays(t, 12)), note: 'Thuê 1 năm, hỏi giảm giá.', status: 'new' },
      { id: uid('yc'), createdAt: toISO(addDays(t, -6)), name: 'Trần Văn Lộc', phone: '0988 173 905', carId: cars[18].id, months: 3, startDate: toISO(addDays(t, -2)), note: '', status: 'contacted' }
    ];

    return {
      version: 1,
      shop: {
        name: 'Tâm Auto — Thuê xe tự lái dài hạn',
        phone: '0900 000 000',
        zalo: '0900 000 000',
        address: 'Số 1 Đường ABC, Q. Bình Thạnh, TP.HCM',
        email: 'truongthanhtamvinici@gmail.com',
        slogan: 'Thuê xe theo tháng — rẻ hơn mua, không lo bảo dưỡng'
      },
      cars: cars, customers: customers, contracts: contracts,
      payments: payments, expenses: expenses, leads: leads
    };
  }

  /* ---------- truy vấn dùng chung ---------- */
  function car(id) { return load().cars.filter(function (c) { return c.id === id; })[0] || null; }
  function customer(id) { return load().customers.filter(function (c) { return c.id === id; })[0] || null; }
  function contract(id) { return load().contracts.filter(function (c) { return c.id === id; })[0] || null; }
  function activeContractOfCar(carId) {
    return load().contracts.filter(function (c) { return c.carId === carId && c.status === 'active'; })[0] || null;
  }
  function paymentsOf(contractId) {
    return load().payments.filter(function (p) { return p.contractId === contractId; })
      .sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; });
  }
  function debtOf(contractId) {
    return paymentsOf(contractId).reduce(function (s, p) {
      return s + (!p.paidDate && parseDate(p.dueDate) <= today() ? p.amount - (p.paidAmount || 0) : 0);
    }, 0);
  }
  /** Các kỳ chưa thu đã tới hạn, sắp theo mức trễ giảm dần. */
  function overduePayments() {
    return load().payments.filter(function (p) { return !p.paidDate && parseDate(p.dueDate) <= today(); })
      .map(function (p) { return Object.assign({}, p, { lateDays: -fromToday(p.dueDate) }); })
      .sort(function (a, b) { return b.lateDays - a.lateDays; });
  }
  /** Các kỳ sẽ tới hạn trong `days` ngày tới. */
  function upcomingPayments(days) {
    return load().payments.filter(function (p) {
      var d = fromToday(p.dueDate);
      return !p.paidDate && d > 0 && d <= days;
    }).sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; });
  }
  /** Nhắc hạn đăng kiểm / bảo hiểm / bảo dưỡng trong `days` ngày (hoặc đã quá hạn). */
  function reminders(days) {
    days = days || 30;
    var out = [];
    load().cars.forEach(function (c) {
      [['inspectionDue', 'Đăng kiểm'], ['insuranceDue', 'Bảo hiểm']].forEach(function (f) {
        var left = fromToday(c[f[0]]);
        if (left != null && left <= days) {
          out.push({ carId: c.id, kind: f[1], date: c[f[0]], left: left, detail: fmtDate(c[f[0]]) });
        }
      });
      var nextService = (c.lastServiceOdo || 0) + (c.serviceIntervalKm || 5000);
      var kmLeft = nextService - (c.odo || 0);
      if (kmLeft <= 1000) {
        out.push({
          carId: c.id, kind: 'Bảo dưỡng', date: null,
          left: kmLeft <= 0 ? -1 : 9,
          detail: kmLeft <= 0 ? 'Trễ ' + Math.abs(kmLeft).toLocaleString('vi-VN') + ' km' : 'Còn ' + kmLeft.toLocaleString('vi-VN') + ' km'
        });
      }
    });
    return out.sort(function (a, b) { return a.left - b.left; });
  }
  /** Hợp đồng sắp hết hạn trong `days` ngày. */
  function endingContracts(days) {
    days = days || 30;
    return load().contracts.filter(function (c) {
      if (c.status !== 'active') return false;
      var left = fromToday(c.endDate);
      return left != null && left <= days;
    }).map(function (c) { return Object.assign({}, c, { left: fromToday(c.endDate) }); })
      .sort(function (a, b) { return a.left - b.left; });
  }
  function availableCars() {
    return load().cars.filter(function (c) { return c.status === 'available'; });
  }
  /** Doanh thu đã thu trong tháng YYYY-MM. */
  function revenueOfMonth(ym) {
    return load().payments.reduce(function (s, p) {
      return s + (p.paidDate && p.paidDate.slice(0, 7) === ym ? (p.paidAmount || 0) : 0);
    }, 0);
  }
  function expenseOfMonth(ym) {
    return load().expenses.reduce(function (s, e) {
      return s + (e.date.slice(0, 7) === ym ? e.amount : 0);
    }, 0);
  }
  /** Lãi/lỗ từng xe: tiền đã thu − chi phí − trả góp, trong `months` tháng gần nhất. */
  function carProfit(months) {
    months = months || 6;
    var from = toISO(addMonths(today(), -months)), d = load(), map = {};
    d.cars.forEach(function (c) { map[c.id] = { car: c, income: 0, expense: 0, loan: (c.loanPerMonth || 0) * months }; });
    d.payments.forEach(function (p) {
      if (!p.paidDate || p.paidDate < from) return;
      var ct = contract(p.contractId);
      if (ct && map[ct.carId]) map[ct.carId].income += p.paidAmount || 0;
    });
    d.expenses.forEach(function (e) {
      if (e.date < from || !map[e.carId]) return;
      map[e.carId].expense += e.amount;
    });
    return Object.keys(map).map(function (k) {
      var m = map[k];
      m.profit = m.income - m.expense - m.loan;
      return m;
    }).sort(function (a, b) { return b.profit - a.profit; });
  }

  /* ---------- ghi ---------- */
  function upsert(coll, obj, prefix) {
    var d = load(), arr = d[coll];
    if (!obj.id) { obj.id = uid(prefix || coll.slice(0, 2)); arr.push(obj); }
    else {
      var i = arr.findIndex(function (x) { return x.id === obj.id; });
      if (i < 0) arr.push(obj); else arr[i] = Object.assign(arr[i], obj);
    }
    save();
    return obj;
  }
  function remove(coll, id) {
    var d = load();
    d[coll] = d[coll].filter(function (x) { return x.id !== id; });
    save();
  }
  /** Tạo hợp đồng + sinh sẵn các kỳ thu tiền theo tháng. */
  function createContract(c) {
    var d = load();
    var start = parseDate(c.startDate) || today();
    c.code = c.code || 'HD' + (2600 + d.contracts.length + 1);
    c.endDate = toISO(addMonths(start, c.months));
    c.status = 'active';
    var ct = upsert('contracts', c, 'hd');
    for (var k = 0; k < c.months; k++) {
      var due = addMonths(start, k);
      d.payments.push({
        id: uid('kt'), contractId: ct.id, period: toISO(due).slice(0, 7),
        dueDate: toISO(due), amount: c.monthlyPrice, paidDate: null, paidAmount: 0
      });
    }
    var car0 = car(c.carId);
    if (car0) car0.status = 'rented';
    save();
    return ct;
  }
  function endContract(id) {
    var ct = contract(id);
    if (!ct) return;
    ct.status = 'ended';
    var c = car(ct.carId);
    if (c) c.status = 'available';
    save();
  }
  function markPaid(paymentId, amount, date) {
    var p = load().payments.filter(function (x) { return x.id === paymentId; })[0];
    if (!p) return;
    p.paidAmount = amount != null ? amount : p.amount;
    p.paidDate = date || toISO(today());
    save();
    return p;
  }
  function unmarkPaid(paymentId) {
    var p = load().payments.filter(function (x) { return x.id === paymentId; })[0];
    if (!p) return;
    p.paidDate = null; p.paidAmount = 0;
    save();
  }
  function addLead(l) {
    l.createdAt = toISO(today());
    l.status = 'new';
    return upsert('leads', l, 'yc');
  }

  global.Store = {
    KEY: KEY, load: load, save: save, reset: reset, seed: seed,
    uid: uid, upsert: upsert, remove: remove,
    car: car, customer: customer, contract: contract,
    activeContractOfCar: activeContractOfCar, paymentsOf: paymentsOf, debtOf: debtOf,
    overduePayments: overduePayments, upcomingPayments: upcomingPayments,
    reminders: reminders, endingContracts: endingContracts, availableCars: availableCars,
    revenueOfMonth: revenueOfMonth, expenseOfMonth: expenseOfMonth, carProfit: carProfit,
    createContract: createContract, endContract: endContract,
    markPaid: markPaid, unmarkPaid: unmarkPaid, addLead: addLead,
    fmtVND: fmtVND, fmtShort: fmtShort, fmtDate: fmtDate, fmtMonth: fmtMonth, esc: esc,
    toISO: toISO, today: today, parseDate: parseDate, addDays: addDays, addMonths: addMonths,
    fromToday: fromToday, dayDiff: dayDiff, pad: pad,
    photoOf: photoOf, placeholder: placeholder
  };
})(window);
