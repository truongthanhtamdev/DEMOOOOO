/* Backend cho bản website của Đấu Trường Nhiệm Vụ.
 * - Có cấu hình Firebase trong config.js  → dữ liệu dùng chung, đăng nhập Google.
 * - Không có cấu hình                      → chế độ thử, dữ liệu lưu trong trình duyệt.
 * Cả hai đều cung cấp cùng giao diện `use("db")` / `use("user")` mà app dùng. */
(function () {
  const CFG = window.DTNV_FIREBASE_CONFIG || null;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function loginScreen(kind, errorMsg) {
    return new Promise(resolve => {
      const o = document.createElement("div");
      o.className = "overlay";
      o.innerHTML = `<div class="modal levelup" role="dialog" aria-modal="true" aria-labelledby="login-t" style="gap:14px">
        <span class="rankname">Hệ thống thi đua nội bộ</span>
        <span class="big" id="login-t">ĐẤU TRƯỜNG NHIỆM VỤ</span>
        <p class="muted small">Nhận nhiệm vụ, tích XP, lên cấp và đổi quà.</p>
        ${kind === "demo"
          ? `<form id="login-f" style="width:100%"><div class="field"><label for="login-name">Tên của bạn</label>
               <input id="login-name" required maxlength="40" placeholder="VD: Nguyễn Minh Anh" autocomplete="name"></div>
               <button class="btn primary" type="submit">Vào đấu trường</button></form>
             <p class="muted small">Chế độ thử: người đầu tiên đăng nhập sẽ là quản lý.</p>`
          : `<button class="btn primary" id="login-g" type="button">Đăng nhập bằng Google</button>`}
        ${errorMsg ? `<p class="small" style="color:var(--danger)">${esc(errorMsg)}</p>` : ""}
      </div>`;
      document.body.appendChild(o);
      const done = v => { o.remove(); resolve(v); };
      if (kind === "demo") {
        o.querySelector("#login-f").addEventListener("submit", e => { e.preventDefault(); const n = o.querySelector("#login-name").value.trim(); if (n) done(n); });
        setTimeout(() => o.querySelector("#login-name").focus(), 50);
      } else {
        o.querySelector("#login-g").addEventListener("click", () => done(true));
      }
    });
  }

  /* ---------- chế độ thử: localStorage ---------- */
  function demoBackend() {
    const KEY = "dtnv-demo-db", UKEY = "dtnv-demo-user";
    const now = Date.now();
    const seed = () => ({
      config: { settings: { teams: ["OT Musics", "Tiếng Việt", "Vận hành Ads", "Coach 1:1 Ads", "Thực tập sinh"], monthTarget: 1000, admins: [] } },
      rewards: {
        r1: { name: "Voucher cà phê 50.000đ", cost: 100, stock: null },
        r2: { name: "Về sớm 2 tiếng", cost: 300, stock: null },
        r3: { name: "Nửa ngày nghỉ phép", cost: 800, stock: 5 },
        r4: { name: "Thẻ quà tặng 500.000đ", cost: 1500, stock: 3 },
      },
      quests: Object.fromEntries([
        ["m0", "Làm và đăng 2 clip ngắn (TikTok/Reels/Shorts)", "Có hook 3 giây đầu và lời kêu gọi nhắn tin. Nộp 2 link.", "daily", 20, 5, "daily", "Thực tập sinh"],
        ["m7", "Trả lời hết tin nhắn inbox, không để khách chờ quá 15 phút", "Nộp ảnh hộp thư cuối ca.", "daily", 20, 5, "daily", "Thực tập sinh"],
        ["m1", "Kiểm tra ngân sách và tắt quảng cáo lỗ trước 10 giờ", "Nộp danh sách camp đã tắt/điều chỉnh.", "daily", 20, 5, "daily", "Vận hành Ads"],
        ["m2", "Trả lời câu hỏi học viên trong nhóm trong 4 giờ", "Không để câu hỏi nào quá 4 giờ giờ hành chính.", "daily", 20, 5, "daily", "Coach 1:1 Ads"],
        ["m3", "Đăng 1 video/short nhạc lên kênh", "Nộp link bài đăng.", "daily", 20, 5, "daily", "OT Musics"],
        ["m4", "Chấm và phản hồi bài tập học viên trong 24 giờ", "Nộp số bài đã chấm trong ngày.", "daily", 20, 5, "daily", "Tiếng Việt"],
        ["m5", "Test 3 mẫu content/creative mới", "Nộp link 3 mẫu và kết quả CTR/CPA sau 3 ngày.", "weekly", 150, 30, "weekly", "Vận hành Ads"],
        ["m6", "Scale 1 chiến dịch lên x2 ngân sách mà giữ được CPA", "Nộp ảnh số liệu trước và sau khi scale.", "boss", 500, 100, "none", "Vận hành Ads"],
      ].map(([id, title, desc, type, xp, coins, repeat, team]) => [id, { title: "[Mẫu] " + title, desc, type, xp, coins, mode: "dept", assignee: null, team, repeat, due: null, status: "active", createdAt: now, submissions: {} }])),
      ledger: {}, redemptions: {}, players: {}, accounts: {},
    });
    let store; try { store = JSON.parse(localStorage.getItem(KEY)); } catch {}
    if (!store) store = seed();
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
    const subs = new Set(); const notify = () => subs.forEach(f => f());
    addEventListener("storage", e => { if (e.key === KEY && e.newValue) { store = JSON.parse(e.newValue); notify(); } });
    const clone = o => JSON.parse(JSON.stringify(o));
    const merge = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") merge(a[k], b[k]); else a[k] = b[k]; } };
    const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const snapDoc = (id, d) => ({ id, exists: !!d, data: () => (d ? clone(d) : undefined), metadata: {} });
    const write = fn => { fn(); save(); setTimeout(notify, 0); return Promise.resolve(); };
    const db = {
      collection(c) {
        return {
          doc: id => db.doc(c + "/" + (id || rid())),
          add: d => write(() => { (store[c] ??= {})[rid()] = clone(d); }),
          onSnapshot(next) {
            const f = () => { const docs = Object.entries(store[c] || {}).map(([id, d]) => snapDoc(id, d)); next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }); };
            subs.add(f); setTimeout(f, 0); return () => subs.delete(f);
          },
        };
      },
      doc(p) {
        const [c, id] = p.split("/");
        return {
          get: async () => snapDoc(id, store[c]?.[id]),
          set: d => write(() => { (store[c] ??= {})[id] = clone(d); }),
          update: d => { if (!store[c]?.[id]) return Promise.reject({ code: "invalid_argument", message: "missing" }); return write(() => merge(store[c][id], clone(d))); },
          delete: () => write(() => { delete store[c]?.[id]; }),
          onSnapshot(next) { const f = () => next(snapDoc(id, store[c]?.[id])); subs.add(f); setTimeout(f, 0); return () => subs.delete(f); },
        };
      },
    };
    let userP;
    const getUser = () => userP ??= (async () => {
      let u; try { u = JSON.parse(localStorage.getItem(UKEY)); } catch {}
      if (!u) {
        const name = await loginScreen("demo");
        const key = name.toLowerCase();
        const id = store.accounts[key] || "u_" + rid();
        store.accounts[key] = id; u = { id, name };
        try { localStorage.setItem(UKEY, JSON.stringify(u)); } catch {}
      }
      const st = store.config.settings;
      if (!st.admins || !st.admins.length) st.admins = [u.id];
      save();
      const isAdmin = () => (store.config.settings.admins || []).includes(u.id);
      return {
        demo: true,
        id: async () => u.id, me: async () => ({ id: u.id, name: u.name, avatarUrl: "", email: null, isOwner: false, canEdit: isAdmin() }),
        canEdit: async () => isAdmin(), can: async () => true, isOwner: async () => false,
        profiles: async () => ({}),
        signOut: async () => { try { localStorage.removeItem(UKEY); } catch {} },
      };
    })();
    return { use: async n => n === "db" ? (await getUser(), db) : n === "user" ? getUser() : null };
  }

  /* ---------- Firebase: dữ liệu dùng chung ---------- */
  function firebaseBackend() {
    const V = "10.12.2";
    const load = src => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
    let ready;
    const boot = () => ready ??= (async () => {
      await load(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`);
      await Promise.all([load(`https://www.gstatic.com/firebasejs/${V}/firebase-auth-compat.js`), load(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore-compat.js`)]);
      firebase.initializeApp(CFG);
      const auth = firebase.auth(), fs = firebase.firestore();
      let fu = await new Promise(r => { const off = auth.onAuthStateChanged(x => { off(); r(x); }); });
      let err = "";
      while (!fu) {
        await loginScreen("google", err);
        try { fu = (await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())).user; }
        catch (e) { err = "Chưa đăng nhập được (" + (e.code || e.message) + "). Thử lại nhé."; }
      }
      const sref = fs.doc("config/settings");
      let settings = (await sref.get()).data();
      if (!settings) { settings = { teams: ["OT Musics", "Tiếng Việt", "Vận hành Ads", "Coach 1:1 Ads", "Thực tập sinh"], monthTarget: 1000, admins: [fu.uid] }; await sref.set(settings); }
      return { auth, fs, fu, settings };
    })();
    const mapErr = e => { throw { code: e && e.code === "permission-denied" ? "invalid_argument" : "unavailable", message: String(e && e.message) }; };
    const wrapDoc = d => ({ id: d.id, exists: d.exists, data: () => d.data(), metadata: {} });
    const makeDb = fs => {
      const db = {
        collection(c) {
          const ref = fs.collection(c);
          return {
            doc: id => db.doc(c + "/" + (id || ref.doc().id)),
            add: d => ref.add(d).catch(mapErr),
            onSnapshot: (next, error) => ref.onSnapshot(s => next({ docs: s.docs.map(wrapDoc), size: s.size, empty: s.empty, docChanges: () => [], metadata: {} }), e => error && error({ code: "unavailable", message: e.message })),
          };
        },
        doc(p) {
          const ref = fs.doc(p);
          return {
            get: () => ref.get().then(wrapDoc, mapErr),
            set: d => ref.set(d).catch(mapErr),
            update: d => ref.set(d, { merge: true }).catch(mapErr),
            delete: () => ref.delete().catch(mapErr),
            onSnapshot: (next, error) => ref.onSnapshot(s => next(wrapDoc(s)), e => error && error({ code: "unavailable", message: e.message })),
          };
        },
      };
      return db;
    };
    return {
      use: async n => {
        const { auth, fs, fu, settings } = await boot();
        if (n === "db") return makeDb(fs);
        if (n === "user") {
          const isAdmin = () => (settings.admins || []).includes(fu.uid);
          return {
            id: async () => fu.uid,
            me: async () => ({ id: fu.uid, name: fu.displayName || "", avatarUrl: fu.photoURL || "", email: fu.email, isOwner: false, canEdit: isAdmin() }),
            canEdit: async () => isAdmin(), can: async () => true, isOwner: async () => false,
            profiles: async () => ({}),
            signOut: () => auth.signOut(),
          };
        }
        return null;
      },
    };
  }

  window.DTNV_BACKEND = CFG ? firebaseBackend() : demoBackend();
})();
