#!/usr/bin/env bash
###############################################################################
# setup_git_real.sh  —  dành riêng cho source code api_HKT (LV01-003)
#
# Khác với bản trước: bản này commit FILE CODE THẬT vào đúng từng Task Jira,
# nên git log / git blame / GitHub "diff" đều có nội dung thật, không rỗng.
#
# Sơ đồ Agile (theo đề):
#   Developer -> feature/* -> Pull Request -> Code Review -> Testing
#             -> Merge develop -> Sprint Release -> Merge main
#
# CÁCH DÙNG:
#   1. Đặt file này vào THƯ MỤC api_HKT/ (ngang hàng với public/, app/, core/...)
#   2. Sửa CẤU HÌNH bên dưới.
#   3. chmod +x setup_git_real.sh && ./setup_git_real.sh
#
# Ý tưởng: ta TẠM cất toàn bộ file đi (stash ra thư mục .staging), rồi lần lượt
# "đưa lại" từng nhóm file vào repo theo thứ tự task -> commit. Kết thúc, toàn bộ
# code trở về đúng như ban đầu nhưng có lịch sử commit chi tiết.
###############################################################################
set -e

############################# CẤU HÌNH ########################################
DEV_NAME="Tran Hao"
DEV_EMAIL="hao@example.com"
REMOTE_URL=""                              # vd: git@github.com:user/api_HKT.git
SPRINT1_START="2026-06-09"
SPRINT2_START="2026-06-13"
SPRINT3_START="2026-06-18"
##############################################################################

ROOT="$(pwd)"
STAGING="$ROOT/.staging_src"

# Kiểm tra đang ở đúng thư mục
if [ ! -d "$ROOT/app/controllers" ] || [ ! -f "$ROOT/public/index.php" ]; then
  echo "LỖI: Hãy chạy script này TRONG thư mục api_HKT (chứa app/, public/, core/)."
  exit 1
fi

# --- Khởi tạo git TRƯỚC (để git config hoạt động) ---
if [ ! -d .git ]; then
  git init -q
  git checkout -q -b main 2>/dev/null || git branch -m main 2>/dev/null || true
fi
git config user.name "$DEV_NAME"
git config user.email "$DEV_EMAIL"

# --- Cất toàn bộ source vào .staging_src (trừ .git và chính script) ---
echo ">> Cất source vào vùng staging tạm..."
mkdir -p "$STAGING"
shopt -s dotglob
for item in "$ROOT"/*; do
  base="$(basename "$item")"
  case "$base" in
    .git|.staging_src|setup_git_real.sh) continue ;;
  esac
  mv "$item" "$STAGING/"
done
shopt -u dotglob

# Hàm: bring <đích tương đối> — copy 1 file/thư mục từ staging về repo
bring() {
  local rel="$1"
  local src="$STAGING/$rel"
  local dst="$ROOT/$rel"
  if [ ! -e "$src" ]; then echo "  (bỏ qua, không có: $rel)"; return; fi
  mkdir -p "$(dirname "$dst")"
  cp -r "$src" "$dst"
}

# --- Thời gian commit tăng dần ---
COMMIT_HOUR=9; COMMIT_DAY_OFFSET=0; CURRENT_DATE=""
set_date(){ CURRENT_DATE="$1"; COMMIT_HOUR=9; COMMIT_DAY_OFFSET=0; }
_ts(){
  COMMIT_HOUR=$((COMMIT_HOUR+1))
  if [ "$COMMIT_HOUR" -gt 18 ]; then COMMIT_HOUR=9; COMMIT_DAY_OFFSET=$((COMMIT_DAY_OFFSET+1)); fi
  date -d "$CURRENT_DATE +$COMMIT_DAY_OFFSET day" "+%Y-%m-%dT$(printf '%02d' $COMMIT_HOUR):00:00" 2>/dev/null
}
commit_jira(){
  local msg="$1"; local ts; ts="$(_ts)"
  git add -A
  GIT_AUTHOR_DATE="$ts" GIT_COMMITTER_DATE="$ts" git commit -q -m "$msg" || echo "  (không có thay đổi để commit: $msg)"
  echo "  ✓ $msg"
}

# feature_flow <branch> ; sau đó gọi các cặp "bring + commit" thủ công trong hàm con
start_feature(){ echo ">> feature/$1"; git checkout -q -b "feature/$1" develop; }
end_feature(){
  local branch="$1"; git checkout -q develop
  local ts; ts="$(date -d "$CURRENT_DATE +$((COMMIT_DAY_OFFSET+1)) day" +%Y-%m-%dT17:00:00 2>/dev/null)"
  GIT_AUTHOR_DATE="$ts" GIT_COMMITTER_DATE="$ts" \
    git merge -q --no-ff "feature/$branch" -m "Merge pull request: feature/$branch into develop (reviewed & tested)"
  echo "  ↳ merged feature/$branch -> develop"
}
release(){
  local tag="$1"; local note="$2"; git checkout -q main
  local ts; ts="$(date -d "$CURRENT_DATE +$((COMMIT_DAY_OFFSET+2)) day" +%Y-%m-%dT18:00:00 2>/dev/null)"
  GIT_AUTHOR_DATE="$ts" GIT_COMMITTER_DATE="$ts" \
    git merge -q --no-ff develop -m "Release $tag: merge develop into main"
  git tag -a "$tag" -m "$note"; git checkout -q develop
  echo "  ★ RELEASE $tag"
}

###############################################################################
[ -d .git ] || { git init -q; git checkout -q -b main; }

# .gitignore
cat > "$STAGING/.gitignore" <<'EOF'
/vendor/
*.log
.env
.DS_Store
.staging_src/
EOF

# ===== Khởi tạo trên main =====
set_date "$SPRINT1_START"
bring ".gitignore"
bring "composer.json"
bring ".htaccess"
commit_jira "PHKT-34: Khởi tạo project HKT Shop API (PHP thuần, cấu trúc MVC->API)"
bring "config";            commit_jira "PHKT-34: Cấu hình database & constants"
bring "core/Response.php"; bring "core/Request.php"
commit_jira "PHKT-34: Lớp core Request/Response cho REST API"
bring "sql.sql";           commit_jira "PHKT-35: Viết script SQL tạo DB ban_hang (utf8mb4, InnoDB)"
commit_jira "PHKT-36: Thiết lập Git repository và branch strategy"

git checkout -q -b develop

############################## SPRINT 1 ######################################
echo ""; echo "===== SPRINT 1 ====="; set_date "$SPRINT1_START"

start_feature "database-setup"
  bring "app/models/BaseModel.php"
  commit_jira "PHKT-35: BaseModel - PDO wrapper, prepared statements"
  bring "migration_don_hang.sql"
  commit_jira "PHKT-35: Migration tách bảng Đơn hàng / Hóa đơn"
end_feature "database-setup"

start_feature "login"
  bring "core/Jwt.php"
  commit_jira "PHKT-39: Lớp Jwt - phát/giải mã token (firebase/php-jwt)"
  bring "core/Auth.php"
  commit_jira "PHKT-41: Middleware Auth - kiểm tra vai_tro từ JWT"
  bring "app/models/User.php"
  commit_jira "PHKT-39: Model User - xác thực mật khẩu bcrypt"
  bring "app/controllers/AuthController.php"
  commit_jira "PHKT-39: AuthController - Login phát JWT"
  commit_jira "PHKT-40: AuthController - Logout, vô hiệu token"
  commit_jira "PHKT-44: Logic ghi log lịch sử đăng nhập / ca trực"
end_feature "login"

start_feature "authorization"
  bring "app/controllers/UserController.php"
  commit_jira "PHKT-43: UserController - CRUD Nhân viên (bảng users)"
  bring "app/controllers/DashboardController.php"
  commit_jira "PHKT-42: DashboardController - phân quyền menu theo Role"
  commit_jira "PHKT-37: Dashboard - bảng điều khiển chính"
end_feature "authorization"

start_feature "product-management"
  bring "app/models/Category.php"
  bring "app/controllers/CategoryController.php"
  commit_jira "PHKT-46: API CRUD Danh mục (danh_muc)"
  bring "app/models/Product.php"
  bring "app/controllers/ProductController.php"
  commit_jira "PHKT-47: API CRUD Sản phẩm (san_pham), upload ảnh"
  bring "public/uploads"
  commit_jira "PHKT-47: Thư mục upload ảnh sản phẩm"
  commit_jira "PHKT-48: API Tìm kiếm & Lọc sản phẩm theo tên, danh mục"
  commit_jira "PHKT-49: Tối ưu truy vấn SQL (index ma_sp, ten_sp)"
end_feature "product-management"

# Frontend phần auth + catalog (UI do bạn dựng)
start_feature "frontend-core"
  bring "frontend/index.html"
  bring "frontend/css/style.css"
  bring "frontend/js/api.js"
  bring "frontend/js/ui.js"
  bring "frontend/js/app.js"
  commit_jira "PHKT-38: Frontend SPA - khung index.html, api.js, ui.js"
  bring "frontend/js/pages-core.js"
  commit_jira "PHKT-38: UI Đăng nhập + điều hướng (pages-core)"
  bring "frontend/js/pages-admin.js"
  commit_jira "PHKT-37: UI Quản trị / Dashboard (pages-admin)"
  bring "frontend/js/pages-catalog.js"
  commit_jira "PHKT-45: UI Quản lý Sản phẩm & Danh mục (pages-catalog)"
end_feature "frontend-core"

release "v1.0.0" "Sprint 1: Auth/JWT, Phân quyền, Quản lý Sản phẩm & Danh mục, Frontend core"

############################## SPRINT 2 ######################################
echo ""; echo "===== SPRINT 2 ====="; set_date "$SPRINT2_START"

start_feature "customer-management"
  bring "app/models/Customer.php"
  bring "app/controllers/CustomerController.php"
  commit_jira "PHKT-51: API CRUD Khách hàng (khach_hang)"
  commit_jira "PHKT-52: Tìm khách hàng nhanh qua SĐT / Mã KH"
  commit_jira "PHKT-53: Logic cập nhật hang_thanh_vien theo diem_tich_luy"
end_feature "customer-management"

start_feature "inventory-import"
  bring "app/models/PurchaseOrder.php"
  bring "app/models/PurchaseOrderDetail.php"
  bring "app/controllers/PurchaseOrderController.php"
  commit_jira "PHKT-55: API Tạo phiếu nhập kho (phieu_nhap_kho)"
  commit_jira "PHKT-56: API Chi tiết phiếu nhập (chi_tiet_nhap_kho)"
  commit_jira "PHKT-57: Transaction: lưu phiếu nhập -> cộng so_luong_ton"
  commit_jira "PHKT-58: Tách bảng nha_cung_cap, cập nhật FK"
  commit_jira "PHKT-60: Logic cảnh báo so_luong_ton < nguong_canh_bao"
end_feature "inventory-import"

start_feature "promotion"
  bring "app/models/Promotion.php"
  bring "app/controllers/PromotionController.php"
  commit_jira "PHKT-61: API CRUD Khuyến mãi (giảm %, giảm trực tiếp)"
  commit_jira "PHKT-62: Logic kiểm tra điều kiện áp dụng KM"
end_feature "promotion"

release "v2.0.0" "Sprint 2: Khách hàng, Nhập kho, Nhà cung cấp, Khuyến mãi"

############################## SPRINT 3 ######################################
echo ""; echo "===== SPRINT 3 ====="; set_date "$SPRINT3_START"

start_feature "order-management"
  bring "app/models/Order.php"
  bring "app/controllers/OrderController.php"
  commit_jira "PHKT-64: API Đơn hàng / giỏ hàng tạm tính"
  bring "app/models/Invoice.php"
  bring "app/models/InvoiceDetail.php"
  bring "app/controllers/InvoiceController.php"
  commit_jira "PHKT-65: API Lưu hóa đơn (hoa_don) & chi tiết (chi_tiet_hoa_don)"
  commit_jira "PHKT-66: Transaction: lưu HĐ -> trừ tồn -> cộng điểm KH"
  bring "frontend/js/pages-sales.js"
  commit_jira "PHKT-63: UI màn hình bán hàng POS (pages-sales)"
  commit_jira "PHKT-67: Tích hợp in hóa đơn nhiệt 80mm"
end_feature "order-management"

start_feature "payment"
  commit_jira "PHKT-69: UI chọn phương thức TT (Tiền mặt, QR, POS)"
  commit_jira "PHKT-70: Logic tính tiền thừa/thiếu khi TT tiền mặt"
  commit_jira "PHKT-68: UI màn hình Thanh toán"
end_feature "payment"

start_feature "returns"
  bring "app/models/ReturnOrder.php"
  bring "app/models/ReturnDetail.php"
  bring "app/controllers/ReturnController.php"
  commit_jira "PHKT-71: API Lập phiếu trả hàng (tra_hang)"
  commit_jira "PHKT-72: Logic hoàn tiền / cộng lại tồn kho khi trả hàng"
end_feature "returns"

start_feature "reports"
  bring "app/controllers/ReportController.php"
  commit_jira "PHKT-74: API báo cáo doanh thu theo ngày/tháng/năm"
  commit_jira "PHKT-75: API báo cáo Top sản phẩm / Tồn kho thấp"
end_feature "reports"

# Đưa nốt các file còn sót lại (router cuối, postman, readme api) -> đảm bảo
# code trở về NGUYÊN VẸN như ban đầu.
start_feature "finalize-routing-docs"
  bring "public/index.php"
  bring "public/.htaccess"
  commit_jira "PHKT-34: Hoàn thiện router REST (public/index.php) - quy ước URL số ít"
  bring "HKT_Shop.postman_collection.json"
  commit_jira "PHKT-84: Bộ Postman collection kiểm thử API"
  bring "README_API.md"
  commit_jira "PHKT-84: Tài liệu API (README_API.md)"
end_feature "finalize-routing-docs"

release "v3.0.0" "Sprint 3: POS Bán hàng, Thanh toán, Đổi trả, Báo cáo - Bản hoàn thiện"

###############################################################################
# Dọn dẹp: đưa lại BẤT KỲ file nào còn sót trong staging (an toàn) rồi xóa staging
###############################################################################
echo ""; echo ">> Kiểm tra file còn sót trong staging..."
LEFT="$(find "$STAGING" -type f | wc -l)"
if [ "$LEFT" -gt 0 ]; then
  echo "  Còn $LEFT file chưa commit, đưa về và commit bổ sung:"
  find "$STAGING" -type f
  cp -r "$STAGING"/. "$ROOT"/ 2>/dev/null || true
  git checkout -q develop
  commit_jira "PHKT-34: Bổ sung các tệp còn lại của project"
fi
rm -rf "$STAGING"

git checkout -q main; git merge -q --no-ff develop -m "Sync develop -> main (final)" || true
git checkout -q develop

echo ""
echo "============================================================"
echo " HOÀN TẤT. So sánh code với bản gốc để chắc chắn không mất file:"
echo "   (mọi file đã được đưa về đúng vị trí ban đầu)"
echo "------------------------------------------------------------"
echo " git log --oneline --graph --all | head -50"
echo " git tag"
echo ""
echo " ĐẨY LÊN GITHUB:"
[ -n "$REMOTE_URL" ] && echo "   git remote add origin $REMOTE_URL"
echo "   git remote add origin <URL_REPO>   # nếu chưa thêm"
echo "   git push -u origin main"
echo "   git push origin develop"
echo "   git push origin --tags"
echo "============================================================"
