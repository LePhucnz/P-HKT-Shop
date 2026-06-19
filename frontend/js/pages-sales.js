// js/pages-sales.js - Don hang (tao + thanh toan), Hoa don, Tra hang

// ===================== DON HANG =====================
route('orders', {
    title: 'Đơn hàng',
    async render(body, param) {
        if (param === 'create') return renderOrderCreate(body);
        if (param && param.startsWith('edit-')) return renderOrderCreate(body, param.slice(5));
        if (param) return renderOrderDetail(body, param);

        const r = await api('/orders');
        const canManage = Auth.hasRole([ROLE.ADMIN, ROLE.MANAGER]);
        const statusBadge = s => ({
            pending: '<span class="badge bg-warning text-dark">Chờ thanh toán</span>',
            paid: '<span class="badge bg-success">Đã thanh toán</span>',
            cancelled: '<span class="badge bg-secondary">Đã hủy</span>'
        }[s] || s);

        body.innerHTML = pageHeader('Đơn hàng', '<a class="btn btn-primary btn-sm" href="#/orders/create"><i class="bi bi-plus-lg me-1"></i>Tạo đơn hàng</a>') + `
            <div class="table-card"><div class="table-responsive"><table class="table table-hover">
                <thead><tr><th>Số ĐH</th><th>Khách</th><th class="text-end">Thành tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th></th></tr></thead>
                <tbody>${r.data.map(o => `
                    <tr><td class="fw-semibold">${fmt.esc(o.so_dh)}</td>
                    <td>${fmt.esc(o.khach_ten || 'Khách lẻ')}</td>
                    <td class="text-end">${fmt.money(o.thanh_tien)}</td>
                    <td>${statusBadge(o.trang_thai)}</td>
                    <td class="text-muted small">${fmt.datetime(o.ngay_dat)}</td>
                    <td class="text-end d-flex gap-1 justify-content-end">
                        <a class="btn btn-sm btn-outline-primary" href="#/orders/${o.id}"><i class="bi bi-eye"></i></a>
                        ${canManage && o.trang_thai === 'pending' ? `<a class="btn btn-sm btn-outline-secondary" href="#/orders/edit-${o.id}"><i class="bi bi-pencil"></i></a>` : ''}
                        ${canManage && o.trang_thai !== 'paid' ? `<button class="btn btn-sm btn-outline-danger" onclick="window._delOrder(${o.id})"><i class="bi bi-trash"></i></button>` : ''}
                    </td></tr>`).join('') ||
                    '<tr><td colspan="6" class="text-center text-muted py-3">Chưa có đơn hàng</td></tr>'}
                </tbody></table></div></div>`;

        window._delOrder = async (id) => {
            if (await confirmAction('Xóa đơn hàng #' + id + '?')) {
                try {
                    await api('/orders/' + id, { method: 'DELETE' });
                    toast('Đã xóa đơn hàng');
                    handleRoute();
                } catch (e) { toast(e.message, 'error'); }
            }
        };
    }
});

let _cart = []; // [{id, ten_sp, gia_ban, qty, stock}]

async function renderOrderCreate(body, editId = null) {
    _cart = [];
    const [prodsR, custsR] = await Promise.all([api('/products'), api('/customers')]);
    const products = prodsR.data.filter(p => p.so_luong_ton > 0);
    const customers = custsR.data;

    let editOrder = null;
    if (editId) {
        editOrder = (await api('/orders/' + editId)).data;
        if (editOrder.trang_thai !== 'pending') {
            body.innerHTML = pageHeader('Sửa đơn hàng',
                `<a class="btn btn-light btn-sm" href="#/orders/${editId}"><i class="bi bi-arrow-left me-1"></i>Quay lại</a>`) +
                '<div class="alert alert-warning mt-3">Chỉ có thể sửa đơn hàng đang chờ thanh toán.</div>';
            return;
        }
        for (const d of (editOrder.details || [])) {
            const prod = products.find(p => p.id == d.san_pham_id);
            _cart.push({ id: d.san_pham_id, ten_sp: d.ten_sp, gia_ban: +d.don_gia, qty: d.so_luong, stock: prod ? prod.so_luong_ton : 9999 });
        }
    }

    const title    = editId ? 'Sửa đơn hàng' : 'Tạo đơn hàng';
    const backHref = editId ? `#/orders/${editId}` : '#/orders';
    const selKh    = editOrder ? editOrder.khach_hang_id : '';
    const initDisc = editOrder ? editOrder.giam_gia : 0;

    body.innerHTML = pageHeader(title, `<a class="btn btn-light btn-sm" href="${backHref}"><i class="bi bi-arrow-left me-1"></i>Quay lại</a>`) + `
    <div class="row g-3">
        <div class="col-lg-7">
            <div class="table-card">
                <div class="card-header-custom"><span><i class="bi bi-box-seam me-2"></i>Chọn sản phẩm</span>
                    <input id="o-search" class="form-control form-control-sm" style="max-width:220px" placeholder="Tìm sản phẩm..."></div>
                <div class="table-responsive" style="max-height:420px;overflow:auto">
                    <table class="table table-hover"><tbody id="o-prod-list"></tbody></table>
                </div>
            </div>
        </div>
        <div class="col-lg-5">
            <div class="table-card">
                <div class="card-header-custom"><span><i class="bi bi-cart me-2"></i>Đơn hàng</span></div>
                <div class="p-3">
                    <label class="form-label small fw-semibold">Khách hàng</label>
                    <select id="o-kh" class="form-select form-select-sm mb-3">
                        <option value="">Khách lẻ</option>
                        ${customers.map(k => `<option value="${k.id}" ${selKh == k.id ? 'selected' : ''}>${fmt.esc(k.ho_ten)} - ${fmt.esc(k.so_dien_thoai)}</option>`).join('')}
                    </select>
                    <div id="o-cart-items" class="mb-2"></div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="small">Giảm giá:</span>
                        <input id="o-discount" type="number" value="${initDisc}" class="form-control form-control-sm" style="max-width:120px">
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between fw-bold mb-3">
                        <span>Tổng thanh toán:</span><span id="o-total" class="text-primary">0đ</span>
                    </div>
                    <button class="btn btn-primary w-100" id="o-submit"><i class="bi bi-check-lg me-1"></i>${editId ? 'Cập nhật đơn hàng' : 'Tạo đơn hàng'}</button>
                </div>
            </div>
        </div>
    </div>`;

    const renderProds = (list) => {
        document.getElementById('o-prod-list').innerHTML = list.map(p => `
            <tr><td><div class="fw-semibold">${fmt.esc(p.ten_sp)}</div>
                <small class="text-muted">${fmt.money(p.gia_ban)} · Tồn: ${p.so_luong_ton}</small></td>
            <td class="text-end"><button class="btn btn-sm btn-outline-primary"
                onclick='window._addCart(${JSON.stringify(p).replace(/'/g, "&#39;")})'><i class="bi bi-plus"></i></button></td></tr>`).join('') ||
            '<tr><td class="text-muted text-center py-3">Không có sản phẩm</td></tr>';
    };
    renderProds(products);
    document.getElementById('o-search').addEventListener('input', e => {
        const kw = e.target.value.toLowerCase();
        renderProds(products.filter(p => p.ten_sp.toLowerCase().includes(kw) || (p.ma_sp || '').toLowerCase().includes(kw)));
    });

    window._addCart = (p) => {
        const ex = _cart.find(i => i.id === p.id);
        if (ex) { if (ex.qty < p.so_luong_ton) ex.qty++; else return toast('Vượt tồn kho', 'error'); }
        else _cart.push({ id: p.id, ten_sp: p.ten_sp, gia_ban: +p.gia_ban, qty: 1, stock: p.so_luong_ton });
        drawCart();
    };
    window._cartQty = (id, d) => {
        const it = _cart.find(i => i.id === id); if (!it) return;
        it.qty += d;
        if (it.qty <= 0) _cart = _cart.filter(i => i.id !== id);
        else if (it.qty > it.stock) { it.qty = it.stock; toast('Vượt tồn kho', 'error'); }
        drawCart();
    };
    function drawCart() {
        const wrap = document.getElementById('o-cart-items');
        if (!_cart.length) { wrap.innerHTML = '<p class="text-muted small text-center py-2">Chưa có sản phẩm</p>'; }
        else wrap.innerHTML = _cart.map(i => `
            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <div style="flex:1"><div class="small fw-semibold">${fmt.esc(i.ten_sp)}</div>
                    <small class="text-muted">${fmt.money(i.gia_ban)}</small></div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="window._cartQty(${i.id},-1)">−</button>
                    <span class="px-1">${i.qty}</span>
                    <button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="window._cartQty(${i.id},1)">+</button>
                </div></div>`).join('');
        const sub  = _cart.reduce((s, i) => s + i.gia_ban * i.qty, 0);
        const disc = +document.getElementById('o-discount').value || 0;
        document.getElementById('o-total').textContent = fmt.money(Math.max(0, sub - disc));
    }
    document.getElementById('o-discount').addEventListener('input', drawCart);
    drawCart();

    document.getElementById('o-submit').onclick = async () => {
        if (!_cart.length) return toast('Giỏ hàng trống', 'error');
        const btn = document.getElementById('o-submit'); btn.disabled = true;
        try {
            const payload = {
                khach_hang_id: val('o-kh') || null,
                giam_gia: +document.getElementById('o-discount').value || 0,
                items: _cart.map(i => ({ san_pham_id: i.id, so_luong: i.qty }))
            };
            if (editId) {
                await api('/orders/' + editId, { method: 'PUT', body: payload });
                toast('Đã cập nhật đơn hàng');
                location.hash = '#/orders/' + editId;
            } else {
                const r = await api('/orders', { method: 'POST', body: payload });
                toast('Đã tạo đơn hàng');
                location.hash = '#/orders/' + r.data.id;
            }
        } catch (e) { toast(e.message, 'error'); btn.disabled = false; }
    };
}

async function renderOrderDetail(body, id) {
    const o = (await api('/orders/' + id)).data;
    const statusText = { pending: 'Chờ thanh toán', paid: 'Đã thanh toán', cancelled: 'Đã hủy' }[o.trang_thai];
    const canManage  = Auth.hasRole([ROLE.ADMIN, ROLE.MANAGER]);
    const detailRows = (o.details || []).map(d => `
        <tr><td>${fmt.esc(d.ten_sp)}</td><td class="text-center">${d.so_luong}</td>
        <td class="text-end">${fmt.money(d.don_gia)}</td><td class="text-end">${fmt.money(d.thanh_tien)}</td></tr>`).join('');

    let actions = '';
    if (o.trang_thai === 'pending') {
        actions = `
            <button class="btn btn-success btn-sm" id="o-pay"><i class="bi bi-cash-coin me-1"></i>Thanh toán</button>
            ${canManage ? `<a class="btn btn-outline-secondary btn-sm" href="#/orders/edit-${o.id}"><i class="bi bi-pencil me-1"></i>Sửa</a>` : ''}
            <button class="btn btn-outline-danger btn-sm" id="o-cancel"><i class="bi bi-x-lg me-1"></i>Hủy đơn</button>`;
    } else if (o.trang_thai === 'paid' && o.hoa_don) {
        actions = `<a class="btn btn-outline-primary btn-sm" href="#/invoices/${o.hoa_don.id}"><i class="bi bi-receipt me-1"></i>Xem hóa đơn ${fmt.esc(o.hoa_don.so_hd)}</a>`;
    }

    body.innerHTML = pageHeader('Đơn hàng ' + fmt.esc(o.so_dh),
        '<a class="btn btn-light btn-sm" href="#/orders"><i class="bi bi-arrow-left me-1"></i>Quay lại</a>') + `
        <div class="row g-3">
            <div class="col-lg-8"><div class="table-card">
                <div class="card-header-custom"><span>Chi tiết sản phẩm</span></div>
                <div class="table-responsive"><table class="table">
                    <thead><tr><th>Sản phẩm</th><th class="text-center">SL</th><th class="text-end">Đơn giá</th><th class="text-end">Thành tiền</th></tr></thead>
                    <tbody>${detailRows}</tbody>
                    <tfoot><tr><td colspan="3" class="text-end fw-semibold">Tổng tiền hàng</td><td class="text-end">${fmt.money(o.tong_tien)}</td></tr>
                    <tr><td colspan="3" class="text-end fw-semibold">Giảm giá</td><td class="text-end">-${fmt.money(o.giam_gia)}</td></tr>
                    <tr><td colspan="3" class="text-end fw-bold">Thành tiền</td><td class="text-end fw-bold text-primary">${fmt.money(o.thanh_tien)}</td></tr></tfoot>
                </table></div></div></div>
            <div class="col-lg-4"><div class="table-card p-3">
                <div class="mb-2"><small class="text-muted">Khách hàng</small><div class="fw-semibold">${fmt.esc(o.khach_ten || 'Khách lẻ')}</div></div>
                <div class="mb-2"><small class="text-muted">Nhân viên</small><div>${fmt.esc(o.nhan_vien_ten || '')}</div></div>
                <div class="mb-2"><small class="text-muted">Ngày đặt</small><div>${fmt.datetime(o.ngay_dat)}</div></div>
                <div class="mb-3"><small class="text-muted">Trạng thái</small><div class="fw-semibold">${statusText}</div></div>
                <div class="d-grid gap-2">${actions}</div>
            </div></div>
        </div>`;

    if (o.trang_thai === 'pending') {
        document.getElementById('o-pay').onclick = () => {
            openModal('Thanh toán đơn hàng', `
                <p class="small">Thành tiền: <b class="text-primary">${fmt.money(o.thanh_tien)}</b></p>
                <label class="form-label small">Phương thức thanh toán</label>
                <select id="pay-method" class="form-select">
                    <option>Tiền mặt</option><option>Chuyển khoản</option><option>QR Code</option><option>Thẻ</option>
                </select>
                <div class="alert alert-info small mt-2 mb-0"><i class="bi bi-info-circle me-1"></i>Sau khi thanh toán sẽ tạo hóa đơn và trừ tồn kho.</div>
            `, { okText: 'Xác nhận thanh toán', onOk: async () => {
                const r = await api('/orders/' + id + '/pay', { method: 'POST', body: { phuong_thuc_tt: val('pay-method') } });
                toast('Thanh toán thành công, đã tạo hóa đơn');
                location.hash = '#/invoices/' + r.data.id;
            }});
        };
        document.getElementById('o-cancel').onclick = async () => {
            if (await confirmAction('Hủy đơn hàng này?')) {
                await api('/orders/' + id + '/cancel', { method: 'POST' });
                toast('Đã hủy đơn'); handleRoute();
            }
        };
    }
}

// ===================== HOA DON =====================
route('invoices', {
    title: 'Hóa đơn',
    async render(body, param) {
        if (param) return renderInvoiceDetail(body, param);
        const r       = await api('/invoices');
        const isAdmin = Auth.hasRole([ROLE.ADMIN]);
        body.innerHTML = pageHeader('Hóa đơn') + `
            <div class="table-card"><div class="table-responsive"><table class="table table-hover">
                <thead><tr><th>Số HĐ</th><th>Khách</th><th>PT thanh toán</th><th class="text-end">Thành tiền</th><th>Ngày lập</th><th></th></tr></thead>
                <tbody>${r.data.map(h => `
                    <tr><td class="fw-semibold">${fmt.esc(h.so_hd)}</td>
                    <td>${fmt.esc(h.khach_ten || 'Khách lẻ')}</td>
                    <td>${fmt.esc(h.phuong_thuc_tt)}</td>
                    <td class="text-end">${fmt.money(h.thanh_tien)}</td>
                    <td class="text-muted small">${fmt.datetime(h.ngay_lap)}</td>
                    <td class="text-end d-flex gap-1 justify-content-end">
                        <a class="btn btn-sm btn-outline-primary" href="#/invoices/${h.id}"><i class="bi bi-eye"></i></a>
                        ${isAdmin ? `<button class="btn btn-sm btn-outline-danger" onclick="window._delInv(${h.id})"><i class="bi bi-trash"></i></button>` : ''}
                    </td></tr>`).join('') ||
                    '<tr><td colspan="6" class="text-center text-muted py-3">Chưa có hóa đơn</td></tr>'}
                </tbody></table></div></div>`;

        window._delInv = async (id) => {
            if (await confirmAction('Xóa hóa đơn #' + id + '?\nTồn kho sẽ được hoàn lại. Nếu từ đơn hàng, đơn hàng trở về chờ thanh toán.')) {
                try {
                    await api('/invoices/' + id, { method: 'DELETE' });
                    toast('Đã xóa hóa đơn và hoàn tồn kho');
                    handleRoute();
                } catch (e) { toast(e.message, 'error'); }
            }
        };
    }
});

async function renderInvoiceDetail(body, id) {
    const h = (await api('/invoices/' + id)).data;
    const isAdmin = Auth.hasRole([ROLE.ADMIN]);
    body.innerHTML = pageHeader('Hóa đơn ' + fmt.esc(h.so_hd),
        `<a class="btn btn-light btn-sm" href="#/invoices"><i class="bi bi-arrow-left me-1"></i>Quay lại</a>
         <button class="btn btn-outline-secondary btn-sm" onclick="window.print()"><i class="bi bi-printer me-1"></i>In</button>
         ${isAdmin ? `<button class="btn btn-outline-danger btn-sm" id="inv-del"><i class="bi bi-trash me-1"></i>Xóa HĐ</button>` : ''}`) + `
        <div class="table-card p-4" style="max-width:640px;margin:auto">
            <div class="text-center mb-3"><h5 class="fw-bold mb-0">HKT SHOP</h5><small class="text-muted">Hóa đơn bán hàng</small></div>
            <div class="d-flex justify-content-between small mb-1"><span>Số HĐ:</span><b>${fmt.esc(h.so_hd)}</b></div>
            <div class="d-flex justify-content-between small mb-1"><span>Khách hàng:</span><span>${fmt.esc(h.khach_ten || 'Khách lẻ')}</span></div>
            <div class="d-flex justify-content-between small mb-1"><span>Nhân viên:</span><span>${fmt.esc(h.nhan_vien_ten || '')}</span></div>
            <div class="d-flex justify-content-between small mb-3"><span>Ngày lập:</span><span>${fmt.datetime(h.ngay_lap)}</span></div>
            <table class="table table-sm">
                <thead><tr><th>Sản phẩm</th><th class="text-center">SL</th><th class="text-end">Đơn giá</th><th class="text-end">T.Tiền</th></tr></thead>
                <tbody>${(h.details || []).map(d => `<tr><td>${fmt.esc(d.ten_sp)}</td><td class="text-center">${d.so_luong}</td><td class="text-end">${fmt.money(d.don_gia)}</td><td class="text-end">${fmt.money(d.thanh_tien)}</td></tr>`).join('')}</tbody>
            </table>
            <div class="d-flex justify-content-between small"><span>Tổng tiền hàng:</span><span>${fmt.money(h.tong_tien)}</span></div>
            <div class="d-flex justify-content-between small"><span>Giảm giá:</span><span>-${fmt.money(h.giam_gia)}</span></div>
            <div class="d-flex justify-content-between fw-bold mt-1"><span>Thành tiền:</span><span class="text-primary">${fmt.money(h.thanh_tien)}</span></div>
            <div class="d-flex justify-content-between small mt-1"><span>Phương thức:</span><span>${fmt.esc(h.phuong_thuc_tt)}</span></div>
        </div>`;

    if (isAdmin) {
        document.getElementById('inv-del').onclick = async () => {
            if (await confirmAction('Xóa hóa đơn #' + id + '?\nTồn kho sẽ được hoàn lại.')) {
                try {
                    await api('/invoices/' + id, { method: 'DELETE' });
                    toast('Đã xóa hóa đơn và hoàn tồn kho');
                    location.hash = '#/invoices';
                } catch (e) { toast(e.message, 'error'); }
            }
        };
    }
}

// ===================== TRA HANG =====================
route('returns', {
    title: 'Trả hàng',
    async render(body) {
        const r = await api('/returns');
        body.innerHTML = pageHeader('Trả hàng', `
            <div class="input-group input-group-sm" style="max-width:280px;display:inline-flex">
                <input id="rt-invid" class="form-control" placeholder="Nhập ID hóa đơn cần trả...">
                <button class="btn btn-primary" id="rt-find"><i class="bi bi-search me-1"></i>Tìm</button>
            </div>`) + `
            <div class="table-card"><div class="card-header-custom"><span><i class="bi bi-clock-history me-2"></i>Lịch sử trả hàng</span></div>
                <div class="table-responsive"><table class="table table-hover">
                    <thead><tr><th>Ngày</th><th>Hóa đơn</th><th class="text-end">Tiền hoàn</th><th>PT hoàn</th><th>Trạng thái</th></tr></thead>
                    <tbody>${r.data.map(t => `
                        <tr><td class="small">${fmt.datetime(t.ngay_tra)}</td>
                        <td>${fmt.esc(t.so_hd || '#' + t.hoa_don_id)}</td>
                        <td class="text-end">${fmt.money(t.so_tien_hoan)}</td>
                        <td>${fmt.esc(t.phuong_thuc_hoan || '')}</td>
                        <td><span class="badge bg-success">${fmt.esc(t.trang_thai)}</span></td></tr>`).join('') ||
                        '<tr><td colspan="5" class="text-center text-muted py-3">Chưa có phiếu trả</td></tr>'}
                    </tbody></table></div></div>`;

        document.getElementById('rt-find').onclick = async () => {
            const invId = val('rt-invid'); if (!invId) return;
            let inv;
            try { inv = (await api('/returns/invoice/' + invId)).data; }
            catch (e) { return toast(e.message, 'error'); }

            openModal('Trả hàng - HĐ ' + fmt.esc(inv.so_hd), `
                <table class="table table-sm">
                    <thead><tr><th></th><th>Sản phẩm</th><th class="text-center">Đã mua</th><th>SL trả</th></tr></thead>
                    <tbody>${inv.details.map(d => `
                        <tr><td><input type="checkbox" class="rt-chk" data-id="${d.id}" data-max="${d.so_luong}"></td>
                        <td>${fmt.esc(d.ten_sp)}</td><td class="text-center">${d.so_luong}</td>
                        <td><input type="number" class="form-control form-control-sm rt-qty" data-id="${d.id}" value="1" min="1" max="${d.so_luong}" style="width:70px"></td></tr>`).join('')}</tbody>
                </table>
                <label class="form-label small">Lý do trả *</label>
                <textarea id="rt-lydo" class="form-control mb-2" rows="2"></textarea>
                <label class="form-label small">Phương thức hoàn tiền</label>
                <select id="rt-pt" class="form-select"><option>Tiền mặt</option><option>Chuyển khoản</option><option>Ví điện tử</option></select>
            `, { okText: 'Xác nhận trả', size: 'lg', onOk: async () => {
                const items = [];
                document.querySelectorAll('.rt-chk:checked').forEach(chk => {
                    const ctId = chk.dataset.id;
                    const qty  = +document.querySelector('.rt-qty[data-id="' + ctId + '"]').value;
                    items.push({ chi_tiet_hoa_don_id: +ctId, so_luong_tra: qty });
                });
                if (!items.length) { toast('Chọn ít nhất 1 sản phẩm', 'error'); return false; }
                if (!val('rt-lydo')) { toast('Nhập lý do trả', 'error'); return false; }
                await api('/returns', { method: 'POST', body: {
                    hoa_don_id: +invId, ly_do: val('rt-lydo'), phuong_thuc_hoan: val('rt-pt'), items
                }});
                toast('Đã tạo phiếu trả hàng'); handleRoute();
            }});
        };
    }
});
