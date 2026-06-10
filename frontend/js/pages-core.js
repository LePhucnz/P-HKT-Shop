// js/pages-core.js - Login + Dashboard

function renderLogin() {
    document.getElementById('app').innerHTML = `
    <div class="login-wrap">
        <div class="login-card">
            <div class="text-center mb-4">
                <i class="bi bi-shop text-primary" style="font-size:2.5rem"></i>
                <h4 class="mt-2 mb-0">HKT Shop</h4>
                <small class="text-muted">Đăng nhập hệ thống</small>
            </div>
            <div id="login-err"></div>
            <div class="mb-3">
                <label class="form-label small fw-semibold">Email</label>
                <input type="email" id="li-email" class="form-control" value="admin@hkt.com" placeholder="email@hkt.com">
            </div>
            <div class="mb-3">
                <label class="form-label small fw-semibold">Mật khẩu</label>
                <input type="password" id="li-pass" class="form-control" value="123456" placeholder="••••••">
            </div>
            <button class="btn btn-primary w-100" id="li-btn"><i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập</button>
            <div class="text-center mt-3 text-muted" style="font-size:.78rem">
                admin@hkt.com / manager@hkt.com / thu_ngan@hkt.com — mật khẩu: 123456
            </div>
        </div>
    </div>`;

    const btn = document.getElementById('li-btn');
    const doLogin = async () => {
        const email = document.getElementById('li-email').value.trim();
        const mat_khau = document.getElementById('li-pass').value;
        btn.disabled = true; btn.innerHTML = 'Đang đăng nhập...';
        try {
            const r = await api('/auth/login', { method: 'POST', body: { email, mat_khau } });
            Auth.set(r.data.token, r.data.user);
            location.hash = '#/dashboard';
        } catch (e) {
            document.getElementById('login-err').innerHTML =
                `<div class="alert alert-danger py-2 small">${fmt.esc(e.message)}</div>`;
            btn.disabled = false; btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập';
        }
    };
    btn.onclick = doLogin;
    document.getElementById('li-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

route('dashboard', {
    title: 'Dashboard',
    async render(body) {
        const r = await api('/dashboard');
        const d = r.data;
        const stat = (icon, bg, color, value, label) => `
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="stat-icon" style="background:${bg};color:${color}"><i class="bi bi-${icon}"></i></div>
                    <div><div class="value">${value}</div><div class="label">${label}</div></div>
                </div>
            </div>`;

        body.innerHTML = `
        <div class="row g-3 mb-4">
            ${stat('cash-stack', '#dcfce7', '#16a34a', fmt.money(d.doanh_thu_hom_nay), 'Doanh thu hôm nay')}
            ${stat('receipt', '#dbeafe', '#2563eb', d.hd_hom_nay, 'Hóa đơn hôm nay')}
            ${stat('box-seam', '#fef3c7', '#d97706', d.tong_san_pham, 'Tổng sản phẩm')}
            ${stat('people', '#fae8ff', '#a21caf', d.tong_khach, 'Khách hàng')}
        </div>
        <div class="row g-3 mb-4">
            ${stat('graph-up-arrow', '#e0e7ff', '#4f46e5', fmt.money(d.doanh_thu_thang), 'Doanh thu tháng này')}
            ${stat('exclamation-triangle', '#fee2e2', '#dc2626', d.sap_het, 'Sản phẩm sắp hết')}
        </div>
        <div class="row g-3">
            <div class="col-lg-7">
                <div class="table-card">
                    <div class="card-header-custom"><span><i class="bi bi-clock-history me-2"></i>Hóa đơn gần đây</span></div>
                    <div class="table-responsive"><table class="table table-hover">
                        <thead><tr><th>Số HĐ</th><th>Khách</th><th>NV</th><th class="text-end">Thành tiền</th><th>Ngày</th></tr></thead>
                        <tbody>${(d.hoa_don_gan_day || []).map(h => `
                            <tr><td class="fw-semibold">${fmt.esc(h.so_hd)}</td>
                            <td>${fmt.esc(h.ten_kh || 'Khách lẻ')}</td>
                            <td>${fmt.esc(h.ten_nv || '')}</td>
                            <td class="text-end">${fmt.money(h.thanh_tien)}</td>
                            <td class="text-muted small">${fmt.date(h.ngay_lap)}</td></tr>`).join('') ||
                            '<tr><td colspan="5" class="text-center text-muted py-3">Chưa có hóa đơn</td></tr>'}
                        </tbody></table></div>
                </div>
            </div>
            <div class="col-lg-5">
                <div class="table-card mb-3">
                    <div class="card-header-custom"><span><i class="bi bi-trophy me-2"></i>Bán chạy nhất</span></div>
                    <div class="table-responsive"><table class="table">
                        <tbody>${(d.san_pham_ban_chay || []).map(s => `
                            <tr><td>${fmt.esc(s.ten_sp)}</td><td class="text-end fw-semibold">${s.tong_ban}</td></tr>`).join('') ||
                            '<tr><td class="text-center text-muted py-3">Chưa có dữ liệu</td></tr>'}
                        </tbody></table></div>
                </div>
                <div class="table-card">
                    <div class="card-header-custom"><span class="text-danger"><i class="bi bi-exclamation-circle me-2"></i>Sắp hết hàng</span></div>
                    <div class="table-responsive"><table class="table">
                        <tbody>${(d.ds_sap_het || []).map(s => `
                            <tr><td>${fmt.esc(s.ten_sp)}</td><td class="text-end"><span class="badge bg-danger">${s.so_luong_ton}</span></td></tr>`).join('') ||
                            '<tr><td class="text-center text-muted py-3">Kho ổn định</td></tr>'}
                        </tbody></table></div>
                </div>
            </div>
        </div>`;
    }
});
