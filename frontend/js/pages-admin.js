// js/pages-admin.js - Nhap kho, Khuyen mai, Bao cao, Nguoi dung

// ===================== NHAP KHO =====================
route('purchase', {
    title: 'Nhập kho',
    async render(body, param) {
        if (param === 'create') return renderPurchaseCreate(body);
        if (param) return renderPurchaseDetail(body, param);
        const r = await api('/purchase-orders');
        body.innerHTML = pageHeader('Nhập kho', '<a class="btn btn-primary btn-sm" href="#/purchase/create"><i class="bi bi-plus-lg me-1"></i>Tạo phiếu nhập</a>') + `
            <div class="table-card"><div class="table-responsive"><table class="table table-hover">
                <thead><tr><th>Số PN</th><th>Nhà cung cấp</th><th>Nhân viên</th><th>Ngày</th><th></th></tr></thead>
                <tbody>${r.data.map(p => `
                    <tr><td class="fw-semibold">${fmt.esc(p.so_pn)}</td>
                    <td>${fmt.esc(p.nha_cung_cap || '')}</td><td>${fmt.esc(p.ten_nv || '')}</td>
                    <td class="text-muted small">${fmt.datetime(p.ngay_nhap)}</td>
                    <td class="text-end">
                        <a class="btn btn-sm btn-outline-primary" href="#/purchase/${p.id}"><i class="bi bi-eye"></i></a>
                        <button class="btn btn-sm btn-outline-danger" onclick="window._delPN(${p.id})"><i class="bi bi-trash"></i></button>
                    </td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-3">Chưa có phiếu nhập</td></tr>'}
                </tbody></table></div></div>`;
        window._delPN = async (id) => {
            if (await confirmAction('Xóa phiếu nhập? Tồn kho sẽ bị trừ lại tương ứng.')) {
                try { await api('/purchase-orders/' + id, { method: 'DELETE' }); toast('Đã xóa'); handleRoute(); }
                catch (e) { toast(e.message, 'error'); }
            }
        };
    }
});

let _pnItems = [];
async function renderPurchaseCreate(body) {
    _pnItems = [];
    const products = (await api('/products')).data;
    body.innerHTML = pageHeader('Tạo phiếu nhập', '<a class="btn btn-light btn-sm" href="#/purchase"><i class="bi bi-arrow-left me-1"></i>Quay lại</a>') + `
        <div class="table-card p-3" style="max-width:760px">
            <label class="form-label small fw-semibold">Nhà cung cấp</label>
            <input id="pn-ncc" class="form-control form-control-sm mb-3" placeholder="Tên nhà cung cấp">
            <div class="d-flex gap-2 mb-3">
                <select id="pn-sp" class="form-select form-select-sm">
                    ${products.map(p => `<option value="${p.id}" data-ten="${fmt.esc(p.ten_sp)}">${fmt.esc(p.ten_sp)} (tồn: ${p.so_luong_ton})</option>`).join('')}
                </select>
                <input id="pn-qty" type="number" class="form-control form-control-sm" placeholder="SL" value="1" style="max-width:90px">
                <input id="pn-gia" type="number" class="form-control form-control-sm" placeholder="Giá nhập" style="max-width:130px">
                <button class="btn btn-outline-primary btn-sm" id="pn-add"><i class="bi bi-plus"></i></button>
            </div>
            <table class="table table-sm"><thead><tr><th>Sản phẩm</th><th class="text-center">SL</th><th class="text-end">Giá nhập</th><th></th></tr></thead>
                <tbody id="pn-tbody"></tbody></table>
            <button class="btn btn-primary w-100" id="pn-submit"><i class="bi bi-check-lg me-1"></i>Lưu phiếu nhập</button>
        </div>`;
    const draw = () => {
        document.getElementById('pn-tbody').innerHTML = _pnItems.map((it, i) => `
            <tr><td>${fmt.esc(it.ten)}</td><td class="text-center">${it.quantity}</td>
            <td class="text-end">${fmt.money(it.price)}</td>
            <td class="text-end"><button class="btn btn-sm btn-outline-danger py-0" onclick="window._rmPN(${i})"><i class="bi bi-x"></i></button></td></tr>`).join('') ||
            '<tr><td colspan="4" class="text-center text-muted py-2">Chưa có sản phẩm</td></tr>';
    };
    window._rmPN = i => { _pnItems.splice(i, 1); draw(); };
    document.getElementById('pn-add').onclick = () => {
        const sel = document.getElementById('pn-sp');
        const opt = sel.options[sel.selectedIndex];
        _pnItems.push({ product_id: +sel.value, ten: opt.dataset.ten,
            quantity: +document.getElementById('pn-qty').value || 1,
            price: +document.getElementById('pn-gia').value || 0 });
        draw();
    };
    draw();
    document.getElementById('pn-submit').onclick = async () => {
        if (!_pnItems.length) return toast('Thêm ít nhất 1 sản phẩm', 'error');
        try {
            await api('/purchase-orders', { method: 'POST', body: {
                nha_cung_cap: val('pn-ncc'),
                items: _pnItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price }))
            }});
            toast('Nhập kho thành công'); location.hash = '#/purchase';
        } catch (e) { toast(e.message, 'error'); }
    };
}
async function renderPurchaseDetail(body, id) {
    const p = (await api('/purchase-orders/' + id)).data;
    body.innerHTML = pageHeader('Phiếu nhập ' + fmt.esc(p.so_pn), '<a class="btn btn-light btn-sm" href="#/purchase"><i class="bi bi-arrow-left me-1"></i>Quay lại</a>') + `
        <div class="table-card p-3" style="max-width:700px">
            <div class="small mb-1">Nhà cung cấp: <b>${fmt.esc(p.nha_cung_cap || '')}</b></div>
            <div class="small mb-3">Ngày nhập: ${fmt.datetime(p.ngay_nhap)}</div>
            <table class="table table-sm"><thead><tr><th>Sản phẩm</th><th class="text-center">SL</th><th class="text-end">Giá nhập</th></tr></thead>
                <tbody>${(p.details || []).map(d => `<tr><td>${fmt.esc(d.ten_sp)}</td><td class="text-center">${d.so_luong}</td><td class="text-end">${fmt.money(d.don_gia_nhap)}</td></tr>`).join('')}</tbody></table>
        </div>`;
}

// ===================== KHUYEN MAI =====================
route('promotions', {
    title: 'Khuyến mãi',
    async render(body) {
        const form = (k = null) => openModal(k ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi', `
            <div class="mb-2"><label class="form-label small">Tên KM *</label><input id="km-ten" class="form-control" value="${k ? fmt.esc(k.ten_km) : ''}"></div>
            <div class="row g-2">
                <div class="col-6"><label class="form-label small">Loại</label>
                    <select id="km-loai" class="form-select">
                        <option value="percent" ${k && k.loai_km === 'percent' ? 'selected' : ''}>Phần trăm (%)</option>
                        <option value="fixed" ${k && k.loai_km === 'fixed' ? 'selected' : ''}>Số tiền</option>
                    </select></div>
                <div class="col-6"><label class="form-label small">Giá trị</label><input id="km-gt" type="number" class="form-control" value="${k ? k.gia_tri : 0}"></div>
                <div class="col-6"><label class="form-label small">Bắt đầu</label><input id="km-bd" type="date" class="form-control" value="${k ? (k.ngay_bat_dau || '').slice(0,10) : ''}"></div>
                <div class="col-6"><label class="form-label small">Kết thúc</label><input id="km-kt" type="date" class="form-control" value="${k ? (k.ngay_ket_thuc || '').slice(0,10) : ''}"></div>
            </div>
            <div class="mt-2"><label class="form-label small">Mô tả</label><textarea id="km-mota" class="form-control" rows="2">${k ? fmt.esc(k.mo_ta || '') : ''}</textarea></div>
        `, { okText: k ? 'Cập nhật' : 'Thêm', onOk: async () => {
            const data = { ten_km: val('km-ten'), loai_km: val('km-loai'), gia_tri: val('km-gt'),
                ngay_bat_dau: val('km-bd'), ngay_ket_thuc: val('km-kt'), mo_ta: val('km-mota') };
            if (k) await api('/promotions/' + k.id, { method: 'PUT', body: data });
            else   await api('/promotions', { method: 'POST', body: data });
            toast(k ? 'Đã cập nhật' : 'Đã thêm'); load();
        }});
        async function load() {
            const r = await api('/promotions');
            document.getElementById('km-tbody').innerHTML = r.data.map(k => `
                <tr><td class="fw-semibold">${fmt.esc(k.ten_km)}</td>
                <td>${k.loai_km === 'percent' ? k.gia_tri + '%' : fmt.money(k.gia_tri)}</td>
                <td class="small">${fmt.date(k.ngay_bat_dau)} → ${fmt.date(k.ngay_ket_thuc)}</td>
                <td>${k.trang_thai == 1 ? '<span class="badge bg-success">Bật</span>' : '<span class="badge bg-secondary">Tắt</span>'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary" onclick="window._toggleKM(${k.id})"><i class="bi bi-power"></i></button>
                    <button class="btn btn-sm btn-outline-primary" onclick="window._editKM(${k.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window._delKM(${k.id})"><i class="bi bi-trash"></i></button>
                </td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-3">Chưa có khuyến mãi</td></tr>';
            window._editKM = async id => form((await api('/promotions/' + id)).data);
            window._toggleKM = async id => { await api('/promotions/' + id + '/toggle', { method: 'PATCH' }); toast('Đã đổi trạng thái'); load(); };
            window._delKM = async id => { if (await confirmAction('Xóa khuyến mãi?')) { await api('/promotions/' + id, { method: 'DELETE' }); toast('Đã xóa'); load(); } };
        }
        body.innerHTML = pageHeader('Khuyến mãi', '<button class="btn btn-primary btn-sm" id="add-km"><i class="bi bi-plus-lg me-1"></i>Thêm khuyến mãi</button>') + `
            <div class="table-card"><div class="table-responsive"><table class="table table-hover">
                <thead><tr><th>Tên</th><th>Giá trị</th><th>Thời gian</th><th>Trạng thái</th><th></th></tr></thead>
                <tbody id="km-tbody"></tbody></table></div></div>`;
        document.getElementById('add-km').onclick = () => form();
        load();
    }
});

// ===================== BAO CAO DOANH THU =====================
route('revenue', {
    title: 'Báo cáo doanh thu',
    async render(body) {
        const today = new Date().toISOString().slice(0, 10);
        const first = today.slice(0, 8) + '01';
        async function load(start, end) {
            const r = await api(`/reports/revenue?start_date=${start}&end_date=${end}`);
            const d = r.data;
            document.getElementById('rev-summary').innerHTML = `
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon" style="background:#dcfce7;color:#16a34a"><i class="bi bi-cash-stack"></i></div>
                    <div><div class="value">${fmt.money(d.summary.total)}</div><div class="label">Tổng doanh thu</div></div></div></div>
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon" style="background:#dbeafe;color:#2563eb"><i class="bi bi-receipt"></i></div>
                    <div><div class="value">${d.summary.count}</div><div class="label">Số hóa đơn</div></div></div></div>
                <div class="col-md-4"><div class="stat-card"><div class="stat-icon" style="background:#fee2e2;color:#dc2626"><i class="bi bi-percent"></i></div>
                    <div><div class="value">${fmt.money(d.summary.tong_giam)}</div><div class="label">Tổng giảm giá</div></div></div></div>`;
            document.getElementById('rev-tbody').innerHTML = d.daily.map(x => `
                <tr><td>${fmt.date(x.date)}</td><td class="text-center">${x.total_invoices}</td>
                <td class="text-end">${fmt.money(x.tong_hang)}</td><td class="text-end">${fmt.money(x.tong_giam)}</td>
                <td class="text-end fw-semibold">${fmt.money(x.total_revenue)}</td></tr>`).join('') ||
                '<tr><td colspan="5" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
        }
        body.innerHTML = pageHeader('Báo cáo doanh thu', `
            <div class="d-inline-flex gap-2 align-items-center">
                <input id="rev-start" type="date" class="form-control form-control-sm" value="${first}">
                <span>→</span><input id="rev-end" type="date" class="form-control form-control-sm" value="${today}">
                <button class="btn btn-primary btn-sm" id="rev-go">Xem</button>
            </div>`) + `
            <div class="row g-3 mb-3" id="rev-summary"></div>
            <div class="table-card"><div class="table-responsive"><table class="table table-hover">
                <thead><tr><th>Ngày</th><th class="text-center">Số HĐ</th><th class="text-end">Tiền hàng</th><th class="text-end">Giảm giá</th><th class="text-end">Doanh thu</th></tr></thead>
                <tbody id="rev-tbody"></tbody></table></div></div>`;
        document.getElementById('rev-go').onclick = () => load(val('rev-start'), val('rev-end'));
        load(first, today);
    }
});

// ===================== BAO CAO TON KHO =====================
route('inventory', {
    title: 'Báo cáo tồn kho',
    async render(body) {
        const r = await api('/reports/inventory');
        const d = r.data;
        body.innerHTML = pageHeader('Báo cáo tồn kho') + `
            <div class="row g-3 mb-3">
                <div class="col-md-3 col-6"><div class="stat-card"><div class="stat-icon" style="background:#dbeafe;color:#2563eb"><i class="bi bi-box-seam"></i></div>
                    <div><div class="value">${d.stats.total_products}</div><div class="label">Tổng SP</div></div></div></div>
                <div class="col-md-3 col-6"><div class="stat-card"><div class="stat-icon" style="background:#dcfce7;color:#16a34a"><i class="bi bi-cash"></i></div>
                    <div><div class="value">${fmt.money(d.stats.total_value)}</div><div class="label">Giá trị tồn</div></div></div></div>
                <div class="col-md-3 col-6"><div class="stat-card"><div class="stat-icon" style="background:#fef3c7;color:#d97706"><i class="bi bi-exclamation-triangle"></i></div>
                    <div><div class="value">${d.stats.low_stock_count}</div><div class="label">Sắp hết</div></div></div></div>
                <div class="col-md-3 col-6"><div class="stat-card"><div class="stat-icon" style="background:#fee2e2;color:#dc2626"><i class="bi bi-x-circle"></i></div>
                    <div><div class="value">${d.stats.out_of_stock_count}</div><div class="label">Hết hàng</div></div></div></div>
            </div>
            <div class="table-card"><div class="table-responsive"><table class="table table-hover">
                <thead><tr><th>Mã SP</th><th>Tên</th><th>Danh mục</th><th class="text-end">Giá</th><th class="text-center">Tồn</th><th class="text-end">Giá trị</th></tr></thead>
                <tbody>${d.products.map(p => `
                    <tr><td class="fw-semibold">${fmt.esc(p.ma_sp)}</td><td>${fmt.esc(p.ten_sp)}</td>
                    <td>${fmt.esc(p.ten_danh_muc || '-')}</td><td class="text-end">${fmt.money(p.gia_ban)}</td>
                    <td class="text-center"><span class="badge ${p.so_luong_ton == 0 ? 'bg-danger' : p.so_luong_ton < 10 ? 'bg-warning text-dark' : 'bg-success'}">${p.so_luong_ton}</span></td>
                    <td class="text-end">${fmt.money(p.so_luong_ton * p.gia_ban)}</td></tr>`).join('')}
                </tbody></table></div></div>`;
    }
});

// ===================== NGUOI DUNG =====================
route('users', {
    title: 'Người dùng',
    async render(body) {
        const roles = [['admin','Admin'],['manager','Quản lý'],['cashier','Thu ngân'],['stock_keeper','Thủ kho']];
        const form = (u = null) => openModal(u ? 'Sửa người dùng' : 'Thêm người dùng', `
            <div class="mb-2"><label class="form-label small">Họ tên *</label><input id="u-ten" class="form-control" value="${u ? fmt.esc(u.ho_ten) : ''}"></div>
            <div class="mb-2"><label class="form-label small">Email *</label><input id="u-email" class="form-control" value="${u ? fmt.esc(u.email) : ''}"></div>
            <div class="mb-2"><label class="form-label small">Mật khẩu ${u ? '(để trống nếu không đổi)' : '*'}</label><input id="u-pass" type="password" class="form-control"></div>
            <div><label class="form-label small">Vai trò</label><select id="u-role" class="form-select">
                ${roles.map(r => `<option value="${r[0]}" ${u && u.vai_tro === r[0] ? 'selected' : ''}>${r[1]}</option>`).join('')}
            </select></div>
        `, { okText: u ? 'Cập nhật' : 'Thêm', onOk: async () => {
            const data = { ho_ten: val('u-ten'), email: val('u-email'), vai_tro: val('u-role'), mat_khau: val('u-pass') };
            if (u) await api('/users/' + u.id, { method: 'PUT', body: data });
            else { if (!data.mat_khau) { toast('Nhập mật khẩu', 'error'); return false; } await api('/users', { method: 'POST', body: data }); }
            toast(u ? 'Đã cập nhật' : 'Đã thêm'); load();
        }});
        async function load() {
            const r = await api('/users');
            document.getElementById('u-tbody').innerHTML = r.data.map(u => `
                <tr><td class="fw-semibold">${fmt.esc(u.ho_ten)}</td><td>${fmt.esc(u.email)}</td>
                <td><span class="badge bg-primary">${fmt.esc(u.vai_tro)}</span></td>
                <td class="text-end">
                    ${u.vai_tro === 'admin'
                        ? '<span class="text-muted small"><i class="bi bi-lock-fill me-1"></i>Khóa</span>'
                        : `<button class="btn btn-sm btn-outline-primary" onclick="window._editU(${u.id})"><i class="bi bi-pencil"></i></button>
                           <button class="btn btn-sm btn-outline-danger" onclick="window._delU(${u.id})"><i class="bi bi-trash"></i></button>`}
                </td></tr>`).join('');
            window._editU = async id => form((await api('/users/' + id)).data);
            window._delU = async (id) => { if (await confirmAction('Xóa người dùng #' + id + '?')) {
                try { await api('/users/' + id, { method: 'DELETE' }); toast('Đã xóa'); load(); } catch (e) { toast(e.message, 'error'); } } };
        }
        body.innerHTML = pageHeader('Người dùng', '<button class="btn btn-primary btn-sm" id="add-u"><i class="bi bi-plus-lg me-1"></i>Thêm người dùng</button>') + `
            <div class="table-card"><div class="table-responsive"><table class="table table-hover">
                <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th></th></tr></thead>
                <tbody id="u-tbody"></tbody></table></div></div>`;
        document.getElementById('add-u').onclick = () => form();
        load();
    }
});
