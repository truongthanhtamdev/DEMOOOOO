/* ==========================================================================
   site.js — website khách: danh sách xe, bảng giá, máy tính chi phí, form
   ========================================================================== */
(function () {
  'use strict';
  var S = window.Store, db = S.load();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function toast(msg, kind) {
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    $('#toast').appendChild(el);
    setTimeout(function () { el.remove(); }, 3600);
  }

  /* ------------------------- thông tin cửa hàng ------------------------- */
  var shop = db.shop;
  $$('[data-shop]').forEach(function (el) {
    var k = el.getAttribute('data-shop');
    if (k === 'tel') {
      el.href = 'tel:' + shop.phone.replace(/\s/g, '');
      if (!el.textContent.trim() && !el.querySelector('svg')) el.textContent = 'Gọi ' + shop.phone;
    } else if (k === 'zalo-link') {
      el.href = 'https://zalo.me/' + shop.zalo.replace(/\s/g, '');
      if (!el.textContent.trim() && !el.querySelector('svg')) el.textContent = 'Zalo ' + shop.zalo;
    } else if (k === 'short') {
      el.textContent = shop.name.split('—')[0].trim();
    } else if (shop[k] != null) el.textContent = shop[k];
  });
  document.title = 'Thuê xe tự lái theo tháng | ' + shop.name.split('—')[0].trim();
  $('#year').textContent = new Date().getFullYear();

  /* ---------------------------- số liệu hero ---------------------------- */
  var minPrice = Math.min.apply(null, db.cars.map(function (c) { return c.price12m || c.pricePerMonth; }));
  var mp = $('[data-min-price]');
  if (mp) mp.textContent = S.fmtShort(minPrice).replace(' tr', ' triệu');
  var f = $('[data-stat="fleet"]'), av = $('[data-stat="available"]');
  if (f) f.textContent = db.cars.length;
  if (av) av.textContent = S.availableCars().length;

  /* ------------------------ nav đổi nền khi cuộn ------------------------ */
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------- hiệu ứng hiện khi cuộn tới -------------------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* -------------------------- máy tính chi phí -------------------------- */
  function priceFor(car, months) {
    return months >= 12 ? car.price12m : months >= 6 ? car.price6m : months >= 3 ? car.price3m : car.pricePerMonth;
  }
  function carOptions(sel, placeholder) {
    var list = db.cars.slice().sort(function (a, b) { return a.pricePerMonth - b.pricePerMonth; });
    sel.innerHTML = (placeholder ? '<option value="">' + placeholder + '</option>' : '') +
      list.map(function (c) {
        return '<option value="' + c.id + '">' + S.esc(c.name) + ' · ' + c.seats + ' chỗ · ' +
          S.fmtShort(c.pricePerMonth) + '/tháng' + (c.status !== 'available' ? ' (đang có khách)' : '') + '</option>';
      }).join('');
  }
  var calcCar = $('#calc-car'), calcMonths = $('#calc-months'), calcOut = $('#calc-out');
  if (calcCar) {
    carOptions(calcCar);
    var firstAvail = S.availableCars()[0];
    if (firstAvail) calcCar.value = firstAvail.id;
    var renderCalc = function () {
      var car = S.car(calcCar.value), m = +calcMonths.value;
      if (!car) return;
      var per = priceFor(car, m), full = car.pricePerMonth * m, total = per * m, save = full - total;
      calcOut.innerHTML =
        '<div class="tiny" style="color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.08em;font-weight:700">Giá thuê mỗi tháng</div>' +
        '<div class="calc-price">' + S.fmtVND(per) + '</div>' +
        '<div class="calc-rows">' +
        '<div><span>Tổng ' + m + ' tháng</span><b>' + S.fmtVND(total) + '</b></div>' +
        '<div><span>Cọc (hoàn lại khi trả xe)</span><b>' + S.fmtVND(car.deposit) + '</b></div>' +
        (save > 0 ? '<div class="save"><span>Tiết kiệm so với thuê tháng lẻ</span><b>−' + S.fmtVND(save) + '</b></div>' : '') +
        '<div class="total"><span>Cần chuẩn bị lúc nhận xe</span><b>' + S.fmtVND(per + car.deposit) + '</b></div>' +
        '</div>';
    };
    calcCar.addEventListener('change', renderCalc);
    calcMonths.addEventListener('change', renderCalc);
    renderCalc();
  }

  /* ------------------------ danh sách xe + bộ lọc ----------------------- */
  var STATUS = {
    available: ['ok', 'Xe đang trống'],
    rented: ['warn', 'Đang có khách'],
    maintenance: ['danger', 'Đang bảo dưỡng']
  };
  function carCard(c) {
    var st = STATUS[c.status] || STATUS.available;
    return '' +
      '<article class="car">' +
      '<div class="car-img"><img src="' + S.photoOf(c) + '" alt="' + S.esc(c.name) + '" loading="lazy">' +
      '<span class="badge ' + st[0] + '">' + st[1] + '</span></div>' +
      '<div class="car-body">' +
      '<h3>' + S.esc(c.name) + '</h3>' +
      '<div class="specs">' +
      '<span class="badge">' + c.seats + ' chỗ</span>' +
      '<span class="badge">' + (c.gearbox === 'AT' ? 'Số tự động' : 'Số sàn') + '</span>' +
      '<span class="badge">Đời ' + c.year + '</span>' +
      '</div>' +
      '<div class="price"><b>' + S.fmtMil(c.price12m) + '</b>' +
      '<span class="small muted">/tháng · thuê 12 tháng</span></div>' +
      '<div class="tiers">' +
      '<div>1 tháng<b>' + S.fmtShort(c.pricePerMonth) + '</b></div>' +
      '<div>6 tháng<b>' + S.fmtShort(c.price6m) + '</b></div>' +
      '<div class="best">12 tháng<b>' + S.fmtShort(c.price12m) + '</b></div>' +
      '</div>' +
      '<button class="btn ' + (c.status === 'available' ? '' : 'ghost') + '" data-pick="' + c.id + '" style="width:100%">' +
      (c.status === 'available' ? 'Thuê xe này' : 'Hỏi khi nào xe trống') + '</button>' +
      '</div></article>';
  }
  function renderCars() {
    var seats = $('#f-seats').value, gear = $('#f-gear').value,
      max = +$('#f-price').value || Infinity, q = $('#f-q').value.trim().toLowerCase(),
      all = $('#f-all').checked;
    var list = db.cars.filter(function (c) {
      if (!all && c.status !== 'available') return false;
      if (seats && +c.seats !== +seats) return false;
      if (gear && c.gearbox !== gear) return false;
      if (c.price12m > max) return false;
      if (q && (c.name + ' ' + c.brand).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.price12m - b.price12m; });
    $('#car-list').innerHTML = list.map(carCard).join('');
    $('#car-empty').classList.toggle('hide', list.length > 0);
  }
  ['#f-seats', '#f-gear', '#f-price', '#f-all'].forEach(function (s) { $(s).addEventListener('change', renderCars); });
  $('#f-q').addEventListener('input', renderCars);
  $('#car-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]');
    if (!b) return;
    $('#lead-car').value = b.getAttribute('data-pick');
    document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () { $('#lead-form [name=name]').focus({ preventScroll: true }); }, 600);
  });
  renderCars();

  /* -------------------------------- bảng giá ---------------------------- */
  var body = $('#price-table tbody');
  if (body) {
    body.innerHTML = db.cars.slice().sort(function (a, b) { return a.pricePerMonth - b.pricePerMonth; })
      .map(function (c) {
        var st = STATUS[c.status] || STATUS.available;
        return '<tr><td><div class="carcell"><img src="' + S.photoOf(c) + '" alt="" loading="lazy">' +
          '<div><b>' + S.esc(c.name) + '</b><div class="tiny muted">Đời ' + c.year + '</div></div></div></td>' +
          '<td>' + c.seats + '</td><td>' + (c.gearbox === 'AT' ? 'AT' : 'MT') + '</td>' +
          '<td class="right mono">' + S.fmtShort(c.pricePerMonth) + '</td>' +
          '<td class="right mono">' + S.fmtShort(c.price3m) + '</td>' +
          '<td class="right mono">' + S.fmtShort(c.price6m) + '</td>' +
          '<td class="right mono best">' + S.fmtShort(c.price12m) + '</td>' +
          '<td class="right mono">' + S.fmtShort(c.deposit) + '</td>' +
          '<td><span class="badge ' + st[0] + '">' + st[1] + '</span></td></tr>';
      }).join('');
  }

  /* --------------------------- form yêu cầu thuê ------------------------ */
  var leadCar = $('#lead-car');
  if (leadCar) carOptions(leadCar, '— Em tư vấn giúp —');
  var form = $('#lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var name = (fd.get('name') || '').trim(), phone = (fd.get('phone') || '').trim();
      if (name.length < 2) { toast('Anh/chị nhập giúp em họ tên', 'err'); form.name.focus(); return; }
      if (!/^0\d[\d\s.]{7,12}$/.test(phone)) { toast('Số điện thoại chưa đúng, em cần số để gọi lại', 'err'); form.phone.focus(); return; }
      S.addLead({
        name: name, phone: phone,
        carId: fd.get('carId') || null,
        months: +fd.get('months'),
        startDate: fd.get('startDate') || null,
        note: [fd.get('purpose'), (fd.get('note') || '').trim()].filter(Boolean).join(' — ')
      });
      form.reset();
      if (leadCar) leadCar.value = '';
      toast('Đã gửi! Em gọi lại trong 15 phút ạ.', 'ok');
    });
  }
})();
