// js/pages-catalog.js - San pham, Danh muc, Khach hang

const canEditProduct = () => Auth.hasRole([ROLE.ADMIN, ROLE.MANAGER]);

// ===================== SAN PHAM =====================
route('products', {
    title: 'Sản phẩm',
    async render(body) {
        const productForm = async (p = null) => {
            const cats = (await api('/categories')).data;
            const opts = cats.map(c => `<option value="${c.id}" ${p && p.danh_muc_id == c.id ? 'selected' : ''}>${fmt.esc(c.ten_danh_muc)}</option>`).join('');
            openModal(p ? 'Sửa sản phẩm' : 'Thêm sản phẩm', `
                <div class="mb-2"><label class="form-label small">Tên sản phẩm *</label>
                    <input id="p-ten" class="form-control" value="${p ? fmt.esc(p.ten_sp) : ''}"></div>
                <div class="row g-2">
                    <div class="col-6"><label class="form-label small">Danh mục</label>
                        <select id="p-dm" class="form-select"><option value="">-- Chọn --</option>${opts}</select></div>
                    <div class="col-6"><label class="form-label small">Đơn vị tính</label>
                        <input id="p-dvt" class="form-control" value="${p ? fmt.esc(p.don_vi_tinh) : 'cái'}"></div>
                </div>
                <div class="row g-2 mt-1">
                    <div class="col-6"><label class="form-label small">Giá bán</label>
                        <input id="p-gia" type="number" class="form-control" value="${p ? p.gia_ban : 0}"></div>
                    <div class="col-6"><label class="form-label small">Tồn kho ${p ? '(sửa qua nhập kho)' : ''}</label>
                        <input id="p-ton" type="number" class="form-control" value="${p ? p.so_luong_ton : 0}" ${p ? 'disabled' : ''}></div>
                </div>
                <div class="mt-2"><label class="form-label small">Mô tả</label>
                    <textarea id="p-mota" class="form-control" rows="2">${p ? fmt.esc(p.mo_ta || '') : ''}</textarea></div>
            `, { okText: p ? 'Cập nhật' : 'Thêm', onOk: async () => {
                const data = {
                    ten_sp: val('p-ten'), danh_muc_id: val('p-dm') || null,
                    don_vi_tinh: val('p-dvt'), gia_ban: val('p-gia'), mo_ta: val('p-mota')
                };
                if (!p) data.so_luong_ton = val('p-ton');
                if (p) await api('/products/' + p.id, { method: 'PUT', body: data });
                else   await api('/products', { method: 'POST', body: data });
                toast(p ? 'Đã cập nhật' : 'Đã thêm sản phẩm');
                load();
            }});
        };

        async function load(search = '') {
            const r = await api('/products' + (search ? '?search=' + encodeURIComponent(search) : ''));
            const rows = r.data.map(p => `
                <tr><td class="fw-semibold">${fmt.esc(p.ma_sp)}</td>
                <td>${fmt.esc(p.ten_sp)}</td>
                <td>${fmt.esc(p.ten_danh_muc || '-')}</td>
                <td class="text-end">${fmt.money(p.gia_ban)}</td>
                <td class="text-center"><span class="badge ${p.so_luong_ton < 10 ? 'bg-danger' : 'bg-success'}">${p.so_luong_ton}</span></td>
                <td class="text-end">${canEditProduct() ? `
                    <button class="btn btn-sm btn-outline-primary" onclick="window._editProd(${p.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window._delProd(${p.id})"><i class="bi bi-trash"></i></button>` : ''}
                </td></tr>`).join('');
            document.getElementById('prod-tbody').innerHTML = rows ||
                '<tr><td colspan="6" class="text-center text-muted py-3">Không có sản phẩm</td></tr>';

            window._editProd = async id => productForm((await api('/products/' + id)).data);
            window._delProd = async (id) => {
                if (await confirmAction('Xóa sản phẩm #' + id + '?')) {
                    try {
                        await api('/products/' + id, { method: 'DELETE' });
                        toast('Đã xóa'); load();
                    } catch (e) { toast(e.message, 'error'); }
                }
            };
        }

        body.innerHTML = pageHeader('Sản phẩm', canEditProduct() ?
            '<button class="btn btn-primary btn-sm" id="add-prod"><i class="bi bi-plus-lg me-1"></i>Thêm sản phẩm</button>' : '') + `
            <div class="table-card">
                <div class="card-header-custom">
                    <div class="input-group input-group-sm" style="max-width:300px">
                        <input id="prod-search" class="form-control" placeholder="Tìm tên / mã SP...">
                        <button class="btn btn-outline-secondary" id="prod-search-btn"><i class="bi bi-search"></i></button>
                    </div>
                </div>
                <div class="table-responsive"><table class="table table-hover">
                    <thead><tr><th>Mã SP</th><th>Tên</th><th>Danh mục</th><th class="text-end">Giá</th><th class="text-center">Tồn</th><th></th></tr></thead>
                    <tbody id="prod-tbody"></tbody></table></div>
            </div>`;
        if (canEditProduct()) document.getElementById('add-prod').onclick = () => productForm();
        document.getElementById('prod-search-btn').onclick = () => load(val('prod-search'));
        document.getElementById('prod-search').addEventListener('keydown', e => { if (e.key === 'Enter') load(val('prod-search')); });
        load();
    }
});

// ===================== DANH MUC =====================
route('categories', {
    title: 'Danh mục',
    async render(body) {
        const form = (c = null) => openModal(c ? 'Sửa danh mục' : 'Thêm danh mục', `
            <div class="mb-2"><label class="form-label small">Tên danh mục *</label>
                <input id="c-ten" class="form-control" value="${c ? fmt.esc(c.ten_danh_muc) : ''}"></div>
            <div><label class="form-label small">Mô tả</label>
                <textarea id="c-mota" class="form-control" rows="2">${c ? fmt.esc(c.mo_ta || '') : ''}</textarea></div>
        `, { okText: c ? 'Cập nhật' : 'Thêm', onOk: async () => {
            const data = { ten_danh_muc: val('c-ten'), mo_ta: val('c-mota') };
            if (c) await api('/categories/' + c.id, { method: 'PUT', body: data });
            else   await api('/categories', { method: 'POST', body: data });
            toast(c ? 'Đã cập nhật' : 'Đã thêm'); load();
        }});

        async function load() {
            const r = await api('/categories');
            document.getElementById('cat-tbody').innerHTML = r.data.map(c => `
                <tr><td class="fw-semibold">${fmt.esc(c.ten_danh_muc)}</td>
                <td class="text-muted">${fmt.esc(c.mo_ta || '')}</td>
                <td class="text-center"><span class="badge bg-secondary">${c.product_count}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="window._editCat(${c.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window._delCat(${c.id})"><i class="bi bi-trash"></i></button>
                </td></tr>`).join('') || '<tr><td colspan="4" class="text-center text-muted py-3">Chưa có danh mục</td></tr>';
            window._editCat = async id => form((await api('/categories/' + id)).data);
            window._delCat = async (id) => {
                if (await confirmAction('Xóa danh mục #' + id + '?')) {
                    try { await api('/categories/' + id, { method: 'DELETE' }); toast('Đã xóa'); load(); }
                    catch (e) { toast(e.message, 'error'); }
                }
            };
        }
        body.innerHTML = pageHeader('Danh mục', '<button class="btn btn-primary btn-sm" id="add-cat"><i class="bi bi-plus-lg me-1"></i>Thêm danh mục</button>') + `
            <div class="table-card"><div class="table-responsive"><table class="table table-hover">
                <thead><tr><th>Tên</th><th>Mô tả</th><th class="text-center">Số SP</th><th></th></tr></thead>
                <tbody id="cat-tbody"></tbody></table></div></div>`;
        document.getElementById('add-cat').onclick = () => form();
        load();
    }
});

// ===================== KHACH HANG =====================
route('customers', {
    title: 'Khách hàng',
    async render(body) {
        const form = (k = null) => openModal(k ? 'Sửa khách hàng' : 'Thêm khách hàng', `
            <div class="row g-2">
                <div class="col-6"><label class="form-label small">Họ tên *</label><input id="k-ten" class="form-control" value="${k ? fmt.esc(k.ho_ten) : ''}"></div>
                <div class="col-6"><label class="form-label small">SĐT *</label><input id="k-sdt" class="form-control" value="${k ? fmt.esc(k.so_dien_thoai) : ''}"></div>
                <div class="col-6"><label class="form-label small">Email</label><input id="k-email" class="form-control" value="${k ? fmt.esc(k.email || '') : ''}"></div>
                <div class="col-6"><label class="form-label small">Ngày sinh</label><input id="k-ns" type="date" class="form-control" value="${k && k.ngay_sinh ? k.ngay_sinh : ''}"></div>
                <div class="col-12"><label class="form-label small">Địa chỉ</label><input id="k-dc" class="form-control" value="${k ? fmt.esc(k.dia_chi || '') : ''}"></div>
                <div class="col-6"><label class="form-label small">Giới tính</label>
                    <select id="k-gt" class="form-select">
                        <option value="">--</option>
                        <option ${k && k.gioi_tinh === 'Nam' ? 'selected' : ''}>Nam</option>
                        <option ${k && k.gioi_tinh === 'Nữ' ? 'selected' : ''}>Nữ</option>
                    </select></div>
            </div>
        `, { okText: k ? 'Cập nhật' : 'Thêm', onOk: async () => {
            const data = { ho_ten: val('k-ten'), so_dien_thoai: val('k-sdt'), email: val('k-email'),
                ngay_sinh: val('k-ns') || null, dia_chi: val('k-dc'), gioi_tinh: val('k-gt') };
            if (k) await api('/customers/' + k.id, { method: 'PUT', body: data });
            else   await api('/customers', { method: 'POST', body: data });
            toast(k ? 'Đã cập nhật' : 'Đã thêm'); load();
        }});

        const rankBadge = r => {
            const cls = r === 'Kim cương' ? 'badge-rank-kimcuong' : r === 'Vàng' ? 'badge-rank-vang' : 'badge-rank-bac';
            return `<span class="badge ${cls}">${fmt.esc(r || 'Bạc')}</span>`;
        };

        async function load(search = '') {
            const r = await api('/customers' + (search ? '?search=' + encodeURIComponent(search) : ''));
            document.getElementById('kh-tbody').innerHTML = r.data.map(k => `
                <tr><td class="fw-semibold">${fmt.esc(k.ma_kh)}</td>
                <td>${fmt.esc(k.ho_ten)}</td><td>${fmt.esc(k.so_dien_thoai)}</td>
                <td class="text-center">${k.diem_tich_luy || 0}</td>
                <td>${rankBadge(k.hang_thanh_vien)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="window._editKh(${k.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window._delKh(${k.id})"><i class="bi bi-trash"></i></button>
                </td></tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted py-3">Chưa có khách hàng</td></tr>';
            window._editKh = async id => form((await api('/customers/' + id)).data.customer || (await api('/customers/' + id)).data);
            window._delKh = async (id) => {
                if (await confirmAction('Xóa khách hàng #' + id + '?')) {
                    try { await api('/customers/' + id, { method: 'DELETE' }); toast('Đã xóa'); load(); }
                    catch (e) { toast(e.message, 'error'); }
                }
            };
        }
        body.innerHTML = pageHeader('Khách hàng', '<button class="btn btn-primary btn-sm" id="add-kh"><i class="bi bi-plus-lg me-1"></i>Thêm khách hàng</button>') + `
            <div class="table-card">
                <div class="card-header-custom">
                    <div class="input-group input-group-sm" style="max-width:300px">
                        <input id="kh-search" class="form-control" placeholder="Tìm tên / SĐT / mã KH...">
                        <button class="btn btn-outline-secondary" id="kh-search-btn"><i class="bi bi-search"></i></button>
                    </div>
                </div>
                <div class="table-responsive"><table class="table table-hover">
                    <thead><tr><th>Mã KH</th><th>Họ tên</th><th>SĐT</th><th class="text-center">Điểm</th><th>Hạng</th><th></th></tr></thead>
                    <tbody id="kh-tbody"></tbody></table></div></div>`;
        document.getElementById('add-kh').onclick = () => form();
        document.getElementById('kh-search-btn').onclick = () => load(val('kh-search'));
        document.getElementById('kh-search').addEventListener('keydown', e => { if (e.key === 'Enter') load(val('kh-search')); });
        load();
    }
});
