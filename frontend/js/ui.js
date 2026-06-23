// js/ui.js - modal dung chung (Bootstrap)
let _modalInstance = null;

function openModal(title, bodyHtml, { okText = 'Lưu', onOk = null, size = '', onOpen = null } = {}) {
    let el = document.getElementById('app-modal');
    if (!el) {
        el = document.createElement('div');
        el.id = 'app-modal'; el.className = 'modal fade'; el.tabIndex = -1;
        el.innerHTML = `<div class="modal-dialog"><div class="modal-content">
            <div class="modal-header"><h6 class="modal-title fw-bold"></h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body"></div>
            <div class="modal-footer">
                <button class="btn btn-light btn-sm" data-bs-dismiss="modal">Đóng</button>
                <button class="btn btn-primary btn-sm" id="modal-ok"></button>
            </div></div></div>`;
        document.body.appendChild(el);
    }
    el.querySelector('.modal-dialog').className = 'modal-dialog ' + (size ? 'modal-' + size : '');
    el.querySelector('.modal-title').textContent = title;
    el.querySelector('.modal-body').innerHTML = bodyHtml;
    const okBtn = el.querySelector('#modal-ok');
    okBtn.textContent = okText;
    okBtn.style.display = onOk ? '' : 'none';

    _modalInstance = bootstrap.Modal.getOrCreateInstance(el);
    okBtn.onclick = async () => {
        if (!onOk) return;
        okBtn.disabled = true;
        try { const close = await onOk(); if (close !== false) _modalInstance.hide(); }
        catch (e) { toast(e.message || 'Lỗi', 'error'); }
        finally { okBtn.disabled = false; }
    };
    if (onOpen) el.addEventListener('shown.bs.modal', onOpen, { once: true });
    _modalInstance.show();
}
function closeModal() { _modalInstance && _modalInstance.hide(); }

async function confirmAction(msg) {
    return new Promise(resolve => {
        openModal('Xác nhận', `<p class="mb-0">${fmt.esc(msg)}</p>`, {
            okText: 'Đồng ý', onOk: () => { resolve(true); }
        });
        const el = document.getElementById('app-modal');
        el.addEventListener('hidden.bs.modal', () => resolve(false), { once: true });
    });
}

// Thanh tieu de trang + nut hanh dong
function pageHeader(title, actionsHtml = '') {
    return `<div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0">${fmt.esc(title)}</h5><div>${actionsHtml}</div></div>`;
}

function val(id){

    const el = document.getElementById(id);

    if(!el){
        console.warn("Không tìm thấy:",id);
        return "";
    }

    return el.value.trim();

}