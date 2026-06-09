<?php
// config/constants.php  (API version - khong dung session)

// Khoa bi mat de ky JWT - DOI sang chuoi ngau nhien cua ban trong production
define('JWT_SECRET', 'hkt_shop_super_secret_key_doi_truoc_khi_deploy_2026');
define('JWT_ISSUER', 'hkt-shop-api');
define('JWT_EXPIRE', 60 * 60 * 8); // 8 gio

// Vai tro
define('ROLE_ADMIN', 'admin');
define('ROLE_MANAGER', 'manager');
define('ROLE_CASHIER', 'cashier');
define('ROLE_STOCK_KEEPER', 'stock_keeper');

// Thu muc luu anh upload
define('UPLOAD_DIR', dirname(__DIR__) . '/public/uploads/products/');
define('UPLOAD_URL', '/uploads/products/');
