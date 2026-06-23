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
            <div class="d-flex flex-wrap gap-2 mb-3">
                <select id="pn-sp" class="form-select form-select-sm" style="min-width:180px">
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

        body.innerHTML = pageHeader('Báo cáo doanh thu', `
            <div class="d-flex flex-wrap gap-2 align-items-center export-btns no-print">
                <input id="rev-start" type="date" class="form-control form-control-sm" value="${first}" style="width:auto">
                <span>→</span>
                <input id="rev-end" type="date" class="form-control form-control-sm" value="${today}" style="width:auto">
                <button class="btn btn-primary btn-sm" id="rev-go"><i class="bi bi-search me-1"></i>Xem</button>
                <button class="btn btn-outline-success btn-sm" id="rev-excel"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button class="btn btn-outline-danger btn-sm" id="rev-pdf"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</button>
            </div>`) + `
            <div class="row g-3 mb-3" id="rev-summary"></div>
            <div class="row g-3 mb-3">
                <div class="col-12">
                    <div class="chart-card">
                        <h6><i class="bi bi-bar-chart-line me-2 text-primary"></i>Biểu đồ doanh thu theo ngày</h6>
                        <canvas id="rev-chart" height="90"></canvas>
                    </div>
                </div>
            </div>
            <div class="table-card" id="rev-table-wrap">
                <div class="table-responsive"><table class="table table-hover">
                    <thead><tr><th>Ngày</th><th class="text-center">Số HĐ</th><th class="text-end">Tiền hàng</th><th class="text-end">Giảm giá</th><th class="text-end">Doanh thu</th></tr></thead>
                    <tbody id="rev-tbody"></tbody>
                </table></div>
            </div>`;

        let _chartInstance = null;

        async function load(start, end) {
            const r = await api(`/reports/revenue?start_date=${start}&end_date=${end}`);
            const d = r.data;

            document.getElementById('rev-summary').innerHTML = `
                <div class="col-md-4 col-12"><div class="stat-card"><div class="stat-icon" style="background:#dcfce7;color:#16a34a"><i class="bi bi-cash-stack"></i></div>
                    <div><div class="value">${fmt.money(d.summary.total)}</div><div class="label">Tổng doanh thu</div></div></div></div>
                <div class="col-md-4 col-6"><div class="stat-card"><div class="stat-icon" style="background:#dbeafe;color:#2563eb"><i class="bi bi-receipt"></i></div>
                    <div><div class="value">${d.summary.count}</div><div class="label">Số hóa đơn</div></div></div></div>
                <div class="col-md-4 col-6"><div class="stat-card"><div class="stat-icon" style="background:#fee2e2;color:#dc2626"><i class="bi bi-percent"></i></div>
                    <div><div class="value">${fmt.money(d.summary.tong_giam)}</div><div class="label">Tổng giảm giá</div></div></div></div>`;

            document.getElementById('rev-tbody').innerHTML = d.daily.map(x => `
                <tr><td>${fmt.date(x.date)}</td><td class="text-center">${x.total_invoices}</td>
                <td class="text-end">${fmt.money(x.tong_hang)}</td><td class="text-end">${fmt.money(x.tong_giam)}</td>
                <td class="text-end fw-semibold">${fmt.money(x.total_revenue)}</td></tr>`).join('') ||
                '<tr><td colspan="5" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';

            // ---- Chart.js biểu đồ ----
            const labels = [...d.daily].reverse().map(x => fmt.date(x.date));
            const values = [...d.daily].reverse().map(x => Number(x.total_revenue));
            const ctx = document.getElementById('rev-chart');
            if (_chartInstance) _chartInstance.destroy();
            if (window.Chart && ctx) {
                _chartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Doanh thu (đ)',
                            data: values,
                            backgroundColor: 'rgba(26,86,219,0.18)',
                            borderColor: '#1a56db',
                            borderWidth: 2,
                            borderRadius: 6,
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false }, tooltip: {
                            callbacks: { label: ctx => Number(ctx.raw).toLocaleString('vi-VN') + 'đ' }
                        }},
                        scales: {
                            y: { ticks: { callback: v => (v/1e6).toFixed(1)+'M' }, grid: { color: '#f0f0f0' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            } else if (ctx) {
                ctx.parentElement.innerHTML = '<div class="text-center text-muted py-3 small">Chart.js chưa được tải. Thêm script Chart.js vào index.html để xem biểu đồ.</div>';
            }

            // ---- Export Excel ----
            document.getElementById('rev-excel').onclick = () => exportRevenueExcel(d, start, end);
            // ---- Export PDF ----
            document.getElementById('rev-pdf').onclick = () => exportRevenuePDF(d, start, end);
        }

        document.getElementById('rev-go').onclick = () => load(val('rev-start'), val('rev-end'));
        load(first, today);
    }
});

// ---- Xuất Excel báo cáo doanh thu ----
function exportRevenueExcel(d, start, end) {
    const rows = [
        ['Ngày', 'Số HĐ', 'Tiền hàng (đ)', 'Giảm giá (đ)', 'Doanh thu (đ)'],
        ...d.daily.map(x => [x.date, x.total_invoices, Number(x.tong_hang), Number(x.tong_giam), Number(x.total_revenue)]),
        [],
        ['Tổng cộng', d.summary.count, '', Number(d.summary.tong_giam), Number(d.summary.total)]
    ];
    let csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `doanh_thu_${start}_${end}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast('Đã xuất Excel (CSV)');
}

// ---- Xuất PDF báo cáo doanh thu ----
function exportRevenuePDF(d, start, end) {
    const rows = d.daily.map(x => `
        <tr><td>${x.date}</td><td style="text-align:center">${x.total_invoices}</td>
        <td style="text-align:right">${Number(x.tong_hang).toLocaleString('vi-VN')}đ</td>
        <td style="text-align:right">${Number(x.tong_giam).toLocaleString('vi-VN')}đ</td>
        <td style="text-align:right"><b>${Number(x.total_revenue).toLocaleString('vi-VN')}đ</b></td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Báo cáo doanh thu ${start} → ${end}</title>
        <style>body{font-family:Arial,sans-serif;padding:24px;font-size:13px}
        h2{color:#1a56db}table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:7px 10px}th{background:#f0f4ff;color:#374151}
        .summary{display:flex;gap:20px;margin:16px 0}
        .sum-box{flex:1;background:#f8faff;border:1px solid #dbeafe;border-radius:8px;padding:12px;text-align:center}
        .sum-box .v{font-size:1.4rem;font-weight:700;color:#1a56db}
        .sum-box .l{font-size:.75rem;color:#6b7280;margin-top:2px}
        </style></head><body>
        <h2>📊 Báo cáo doanh thu</h2>
        <p style="color:#6b7280">Từ <b>${start}</b> đến <b>${end}</b></p>
        <div class="summary">
            <div class="sum-box"><div class="v">${Number(d.summary.total).toLocaleString('vi-VN')}đ</div><div class="l">Tổng doanh thu</div></div>
            <div class="sum-box"><div class="v">${d.summary.count}</div><div class="l">Số hóa đơn</div></div>
            <div class="sum-box"><div class="v">${Number(d.summary.tong_giam).toLocaleString('vi-VN')}đ</div><div class="l">Tổng giảm giá</div></div>
        </div>
        <table><thead><tr><th>Ngày</th><th>Số HĐ</th><th>Tiền hàng</th><th>Giảm giá</th><th>Doanh thu</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" style="text-align:center">Không có dữ liệu</td></tr>'}</tbody></table>
        <script>window.onload=()=>{window.print();}<\/script></body></html>`;
    const w = window.open('', '_blank'); w.document.write(html); w.document.close();
}

// ===================== BAO CAO TON KHO + TOP BAN CHAY =====================
route('inventory', {
    title: 'Báo cáo tồn kho',
    async render(body) {
        body.innerHTML = `<div class="text-center py-5 text-muted"><div class="spinner-border"></div></div>`;

        // Gọi cả 2 API song song: tồn kho + top bán chạy (dùng dashboard hoặc report)
        let invData, topData;
        try {
            const [invRes, topRes] = await Promise.all([
                api('/reports/inventory'),
                api('/reports/revenue?start_date=' + new Date(new Date().setDate(1)).toISOString().slice(0,10) + '&end_date=' + new Date().toISOString().slice(0,10))
            ]);
            invData = invRes.data;
            // Lấy top sản phẩm bán chạy từ dashboard nếu có
            try { topData = (await api('/dashboard')).data.san_pham_ban_chay || []; }
            catch { topData = []; }
        } catch(e) {
            body.innerHTML = `<div class="alert alert-danger">Lỗi tải dữ liệu: ${fmt.esc(e.message)}</div>`; return;
        }

        const d = invData;
        body.innerHTML = pageHeader('Báo cáo tồn kho', `
            <div class="d-flex gap-2 export-btns no-print">
                <button class="btn btn-outline-success btn-sm" id="inv-excel"><i class="bi bi-file-earmark-excel me-1"></i>Excel</button>
                <button class="btn btn-outline-danger btn-sm" id="inv-pdf"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</button>
            </div>`) + `
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

            <div class="row g-3 mb-3">
                <div class="col-lg-8">
                    <div class="chart-card">
                        <h6><i class="bi bi-bar-chart-line me-2 text-warning"></i>Top 10 sản phẩm tồn kho thấp nhất</h6>
                        <canvas id="inv-chart" height="120"></canvas>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="table-card h-100">
                        <div class="card-header-custom"><span><i class="bi bi-trophy-fill me-2 text-warning"></i>Top sản phẩm bán chạy</span></div>
                        <div class="table-responsive"><table class="table table-hover">
                            <thead><tr><th>#</th><th>Sản phẩm</th><th class="text-end">SL bán</th></tr></thead>
                            <tbody id="top-tbody">
                                ${topData.length ? topData.slice(0,10).map((s,i) => `
                                    <tr><td><span class="badge ${i===0?'bg-warning text-dark':i===1?'bg-secondary':i===2?'bg-danger':'bg-light text-dark'}">${i+1}</span></td>
                                    <td>${fmt.esc(s.ten_sp)}</td>
                                    <td class="text-end fw-semibold">${s.tong_ban || s.so_luong_ban || 0}</td></tr>`).join('')
                                : '<tr><td colspan="3" class="text-center text-muted py-3">Chưa có dữ liệu</td></tr>'}
                            </tbody>
                        </table></div>
                    </div>
                </div>
            </div>

            <div class="table-card">
                <div class="card-header-custom">
                    <span><i class="bi bi-clipboard-data me-2"></i>Chi tiết tồn kho</span>
                    <input id="inv-search" class="form-control form-control-sm no-print" placeholder="Tìm sản phẩm..." style="width:200px">
                </div>
                <div class="table-responsive"><table class="table table-hover">
                    <thead><tr><th>Mã SP</th><th>Tên</th><th>Danh mục</th><th class="text-end">Giá</th><th class="text-center">Tồn</th><th class="text-end">Giá trị</th></tr></thead>
                    <tbody id="inv-tbody">
                        ${d.products.map(p => `
                            <tr data-name="${fmt.esc(p.ten_sp.toLowerCase())}">
                            <td class="fw-semibold">${fmt.esc(p.ma_sp)}</td><td>${fmt.esc(p.ten_sp)}</td>
                            <td>${fmt.esc(p.ten_danh_muc || '-')}</td><td class="text-end">${fmt.money(p.gia_ban)}</td>
                            <td class="text-center"><span class="badge ${p.so_luong_ton == 0 ? 'bg-danger' : p.so_luong_ton < 10 ? 'bg-warning text-dark' : 'bg-success'}">${p.so_luong_ton}</span></td>
                            <td class="text-end">${fmt.money(p.so_luong_ton * p.gia_ban)}</td></tr>`).join('')}
                    </tbody>
                </table></div>
            </div>`;

        // Tìm kiếm inline
        document.getElementById('inv-search').oninput = function() {
            const q = this.value.toLowerCase();
            document.querySelectorAll('#inv-tbody tr').forEach(tr => {
                tr.style.display = tr.dataset.name && tr.dataset.name.includes(q) ? '' : 'none';
            });
        };

        // Biểu đồ tồn kho thấp nhất
        const low10 = [...d.products].sort((a,b)=>a.so_luong_ton-b.so_luong_ton).slice(0,10);
        const ctx = document.getElementById('inv-chart');
        if (window.Chart && ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: low10.map(p => p.ten_sp.length > 15 ? p.ten_sp.slice(0,15)+'…' : p.ten_sp),
                    datasets: [{
                        label: 'Tồn kho',
                        data: low10.map(p => p.so_luong_ton),
                        backgroundColor: low10.map(p => p.so_luong_ton === 0 ? 'rgba(220,38,38,0.7)' : p.so_luong_ton < 10 ? 'rgba(217,119,6,0.7)' : 'rgba(22,163,74,0.7)'),
                        borderRadius: 5,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { color: '#f0f0f0' } }, y: { grid: { display: false } } }
                }
            });
        } else if (ctx) {
            ctx.parentElement.innerHTML = '<div class="text-center text-muted py-3 small">Thêm Chart.js vào index.html để xem biểu đồ.</div>';
        }

        // Export
        document.getElementById('inv-excel').onclick = () => exportInventoryExcel(d);
        document.getElementById('inv-pdf').onclick   = () => exportInventoryPDF(d, topData);
    }
});

// ---- Xuất Excel tồn kho ----
function exportInventoryExcel(d) {
    const rows = [
        ['Mã SP', 'Tên sản phẩm', 'Danh mục', 'Giá bán (đ)', 'Tồn kho', 'Giá trị tồn (đ)'],
        ...d.products.map(p => [p.ma_sp, p.ten_sp, p.ten_danh_muc || '', Number(p.gia_ban), p.so_luong_ton, p.so_luong_ton * Number(p.gia_ban)]),
        [],
        ['', '', '', '', 'Tổng giá trị:', Number(d.stats.total_value)]
    ];
    const bom = '\uFEFF';
    let csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `ton_kho_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast('Đã xuất Excel (CSV)');
}

// ---- Xuất PDF tồn kho ----
function exportInventoryPDF(d, topData) {
    const rows = d.products.map(p => `
        <tr><td>${p.ma_sp}</td><td>${p.ten_sp}</td><td>${p.ten_danh_muc||'-'}</td>
        <td style="text-align:right">${Number(p.gia_ban).toLocaleString('vi-VN')}đ</td>
        <td style="text-align:center;color:${p.so_luong_ton===0?'#dc2626':p.so_luong_ton<10?'#d97706':'#16a34a'};font-weight:600">${p.so_luong_ton}</td>
        <td style="text-align:right">${(p.so_luong_ton*Number(p.gia_ban)).toLocaleString('vi-VN')}đ</td></tr>`).join('');
    const topRows = topData.slice(0,10).map((s,i)=>`<tr><td>${i+1}</td><td>${s.ten_sp}</td><td style="text-align:right;font-weight:600">${s.tong_ban||s.so_luong_ban||0}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Báo cáo tồn kho ${new Date().toLocaleDateString('vi-VN')}</title>
        <style>body{font-family:Arial,sans-serif;padding:24px;font-size:12px}
        h2{color:#1a56db}table{width:100%;border-collapse:collapse;margin-bottom:20px}
        th,td{border:1px solid #ddd;padding:6px 9px}th{background:#f0f4ff}
        .cols{display:flex;gap:20px}.col{flex:1}h3{font-size:14px;color:#374151}
        </style></head><body>
        <h2>📦 Báo cáo tồn kho — ${new Date().toLocaleDateString('vi-VN')}</h2>
        <p>Tổng: <b>${d.stats.total_products}</b> SP &nbsp;|&nbsp; Giá trị: <b>${Number(d.stats.total_value).toLocaleString('vi-VN')}đ</b> &nbsp;|&nbsp; Sắp hết: <b>${d.stats.low_stock_count}</b> &nbsp;|&nbsp; Hết hàng: <b>${d.stats.out_of_stock_count}</b></p>
        ${topData.length ? `<div class="cols"><div class="col"><h3>🏆 Top sản phẩm bán chạy</h3><table><thead><tr><th>#</th><th>Sản phẩm</th><th>SL bán</th></tr></thead><tbody>${topRows}</tbody></table></div></div>` : ''}
        <h3>Chi tiết tồn kho</h3>
        <table><thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Tồn</th><th>Giá trị</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <script>window.onload=()=>{window.print();}<\/script></body></html>`;
    const w = window.open('', '_blank'); w.document.write(html); w.document.close();
}

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