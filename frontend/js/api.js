// js/api.js - lop goi API dung chung
// DOI dia chi nay neu project dat o thu muc khac
const API_BASE = 'http://localhost/api_HKT/api';

const Auth = {
    get token()  { return localStorage.getItem('hkt_token'); },
    get user()   { try { return JSON.parse(localStorage.getItem('hkt_user')); } catch { return null; } },
    set(token, user) {
        localStorage.setItem('hkt_token', token);
        localStorage.setItem('hkt_user', JSON.stringify(user));
    },
    clear() { localStorage.removeItem('hkt_token'); localStorage.removeItem('hkt_user'); },
    isLoggedIn() { return !!this.token; },
    hasRole(roles) {
        const u = this.user; if (!u) return false;
        if (typeof roles === 'string') roles = [roles];
        return roles.includes(u.vai_tro);
    }
};

// Goi API. options: { method, body, isForm }
async function api(path, { method = 'GET', body = null, isForm = false } = {}) {
    const headers = {};
    if (Auth.token) headers['Authorization'] = 'Bearer ' + Auth.token;

    let payload = null;
    if (body) {
        if (isForm) {
            payload = body; // FormData - khong set Content-Type de browser tu them boundary
        } else {
            headers['Content-Type'] = 'application/json';
            payload = JSON.stringify(body);
        }
    }

    const res = await fetch(API_BASE + path, { method, headers, body: payload });

    // Token het han / chua dang nhap
    if (res.status === 401) {
        Auth.clear();
        if (!location.hash.startsWith('#/login')) location.hash = '#/login';
        throw { status: 401, message: 'Phien dang nhap het han, vui long dang nhap lai' };
    }

    let json;
    try { json = await res.json(); }
    catch { throw { status: res.status, message: 'Phan hoi khong hop le tu server' }; }

    if (!res.ok || json.success === false) {
        throw { status: res.status, message: json.message || 'Loi khong xac dinh', errors: json.errors };
    }
    return json;
}

// Tien ich format
const fmt = {
    money(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; },
    date(s)  { if (!s) return ''; const d = new Date(s.replace(' ', 'T')); return d.toLocaleDateString('vi-VN'); },
    datetime(s) { if (!s) return ''; const d = new Date(s.replace(' ', 'T')); return d.toLocaleString('vi-VN'); },
    esc(s)   { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
};

// Toast thong bao
function toast(msg, type = 'success') {
    const wrap = document.getElementById('toast-wrap') || (() => {
        const w = document.createElement('div');
        w.id = 'toast-wrap';
        w.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2000;display:flex;flex-direction:column;gap:8px';
        document.body.appendChild(w); return w;
    })();
    const el = document.createElement('div');
    el.className = `alert alert-${type === 'success' ? 'success' : 'danger'} shadow-sm`;
    el.style.cssText = 'min-width:260px;margin:0';
    el.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2"></i>${fmt.esc(msg)}`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}
