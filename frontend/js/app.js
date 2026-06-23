// js/app.js - layout, sidebar, router

const ROLE = { ADMIN: 'admin', MANAGER: 'manager', CASHIER: 'cashier', STOCK: 'stock_keeper' };

const MENU = [
    { section: 'Tổng quan' },
    { route: 'dashboard', icon: 'speedometer2', label: 'Dashboard' },
    { section: 'Bán hàng' },
    { route: 'orders',   icon: 'cart-plus', label: 'Đơn hàng' },
    { route: 'invoices', icon: 'receipt',   label: 'Hóa đơn' },
    { route: 'returns',  icon: 'arrow-return-left', label: 'Trả hàng' },
    { section: 'Kho hàng' },
    { route: 'products',   icon: 'box-seam', label: 'Sản phẩm' },
    { route: 'categories', icon: 'tags',     label: 'Danh mục' },
    { route: 'purchase',   icon: 'truck',    label: 'Nhập kho', roles: [ROLE.ADMIN, ROLE.MANAGER, ROLE.STOCK] },
    { section: 'Khách hàng' },
    { route: 'customers', icon: 'people', label: 'Khách hàng' },
    { section: 'Báo cáo', roles: [ROLE.ADMIN, ROLE.MANAGER] },
    { route: 'revenue',   icon: 'bar-chart-line', label: 'Doanh thu', roles: [ROLE.ADMIN, ROLE.MANAGER] },
    { route: 'inventory', icon: 'clipboard-data', label: 'Tồn kho & Bán chạy', roles: [ROLE.ADMIN, ROLE.MANAGER] },
    { route: 'promotions',icon: 'gift', label: 'Khuyến mãi', roles: [ROLE.ADMIN, ROLE.MANAGER] },
    { section: 'Hệ thống', roles: [ROLE.ADMIN] },
    { route: 'users', icon: 'people-fill', label: 'Người dùng', roles: [ROLE.ADMIN] },
];

function renderLayout(activeRoute, title) {
    const u = Auth.user || {};
    let menuHtml = '';
    for (const m of MENU) {
        if (m.roles && !Auth.hasRole(m.roles)) continue;
        if (m.section) { menuHtml += `<div class="sidebar-section">${m.section}</div>`; continue; }
        const active = m.route === activeRoute ? 'active' : '';
        menuHtml += `<a class="${active}" href="#/${m.route}"><i class="bi bi-${m.icon}"></i> ${m.label}</a>`;
    }

    document.getElementById('app').innerHTML = `
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <aside class="sidebar" id="sidebar">
        <a href="#/dashboard" class="sidebar-brand">
            <h6><i class="bi bi-shop me-2 text-primary"></i>HKT Shop</h6>
            <small>${fmt.esc(u.ho_ten || '')}</small>
        </a>
        ${menuHtml}
        <hr class="sidebar-divider">
        <a class="text-danger mt-auto" id="logout-btn"><i class="bi bi-box-arrow-right"></i> Đăng xuất</a>
    </aside>
    <div class="main">
        <div class="topbar">
            <div class="d-flex align-items-center">
                <button class="btn-hamburger" id="hamburger-btn" aria-label="Menu">
                    <i class="bi bi-list"></i>
                </button>
                <span class="topbar-title">${fmt.esc(title)}</span>
            </div>
            <div class="d-flex align-items-center gap-3">
                <span class="text-muted" style="font-size:.8rem">
                    <i class="bi bi-person-circle me-1"></i>${fmt.esc(u.ho_ten || '')}
                    <span class="badge bg-primary ms-1" style="font-size:.68rem">${fmt.esc(u.vai_tro || '')}</span>
                </span>
            </div>
        </div>
        <div class="page-body" id="page-body"><div class="text-center py-5 text-muted"><div class="spinner-border"></div></div></div>
    </div>`;

    // Hamburger logic
    const hamburger = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    }

    hamburger.onclick = () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    overlay.onclick = closeSidebar;

    // Close sidebar on nav click (mobile)
    sidebar.querySelectorAll('a[href]').forEach(a => {
        a.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });

    document.getElementById('logout-btn').onclick = () => {
        Auth.clear(); location.hash = '#/login';
    };
}

// ===== ROUTER =====
const ROUTES = {};

function route(name, def) { ROUTES[name] = def; }

async function handleRoute() {
    const hash = location.hash || '#/dashboard';
    const parts = hash.replace(/^#\//, '').split('/');
    const name = parts[0] || 'dashboard';
    const param = parts[1];

    if (name === 'login') { renderLogin(); return; }
    if (!Auth.isLoggedIn()) { location.hash = '#/login'; return; }

    const def = ROUTES[name] || ROUTES['dashboard'];
    renderLayout(name, def.title);
    const body = document.getElementById('page-body');
    try {
        await def.render(body, param);
    } catch (e) {
        body.innerHTML = `<div class="alert alert-danger">Lỗi: ${fmt.esc(e.message || e)}</div>`;
    }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', () => {
    if (!location.hash) location.hash = Auth.isLoggedIn() ? '#/dashboard' : '#/login';
    handleRoute();
});