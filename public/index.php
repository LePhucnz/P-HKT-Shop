<?php
// public/index.php - Front controller cho REST API
// Tat ca request /api/... deu di qua day.

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Jwt.php';
require_once __DIR__ . '/../core/Auth.php';

// ===== CORS (cho phep goi tu frontend / Postman) =====
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ===== Autoload controllers =====
spl_autoload_register(function ($className) {
    $path = __DIR__ . '/../app/controllers/' . $className . '.php';
    if (file_exists($path)) require_once $path;
});

// ===== Lay path =====
// Ho tro ca ?url=... (rewrite) lan PATH_INFO
$url = $_GET['url'] ?? '';
$url = trim($url, '/');
// Bo tien to 'api' neu co
if (strpos($url, 'api/') === 0) $url = substr($url, 4);
elseif ($url === 'api') $url = '';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$segments = $url === '' ? [] : explode('/', $url);

// ===== Bang dinh tuyen =====
// Moi route: [METHOD, regex pattern, Controller, action]
// {id} -> ([0-9]+)
$routes = [
    // Auth
    ['POST',   'auth/login',          'AuthController',          'login'],
    ['POST',   'auth/register',       'AuthController',          'register'],
    ['GET',    'auth/me',             'AuthController',          'me'],

    // Dashboard
    ['GET',    'dashboard',           'DashboardController',     'index'],

    // Products
    ['GET',    'products',            'ProductController',       'index'],
    ['POST',   'products',            'ProductController',       'store'],
    ['GET',    'products/{id}',       'ProductController',       'show'],
    ['PUT',    'products/{id}',       'ProductController',       'update'],
    ['POST',   'products/{id}',       'ProductController',       'update'],   // cho upload anh (multipart)
    ['DELETE', 'products/{id}',       'ProductController',       'destroy'],

    // Categories
    ['GET',    'categories',          'CategoryController',      'index'],
    ['POST',   'categories',          'CategoryController',      'store'],
    ['GET',    'categories/{id}',     'CategoryController',      'show'],
    ['PUT',    'categories/{id}',     'CategoryController',      'update'],
    ['DELETE', 'categories/{id}',     'CategoryController',      'destroy'],

    // Customers
    ['GET',    'customers',           'CustomerController',      'index'],
    ['POST',   'customers',           'CustomerController',      'store'],
    ['GET',    'customers/{id}',      'CustomerController',      'show'],
    ['PUT',    'customers/{id}',      'CustomerController',      'update'],
    ['DELETE', 'customers/{id}',      'CustomerController',      'destroy'],

    // Orders (don hang) - San pham -> Don hang -> Hoa don
    ['GET',    'orders',              'OrderController',         'index'],
    ['POST',   'orders',              'OrderController',         'store'],
    ['GET',    'orders/{id}',         'OrderController',         'show'],
    ['PUT',    'orders/{id}',          'OrderController',         'update'],
    ['DELETE', 'orders/{id}',         'OrderController',         'destroy'],
    ['POST',   'orders/{id}/pay',     'OrderController',         'pay'],
    ['POST',   'orders/{id}/cancel',  'OrderController',         'cancel'],

    // Invoices
    ['GET',    'invoices',            'InvoiceController',       'index'],
    ['POST',   'invoices',            'InvoiceController',       'store'],
    ['GET',    'invoices/{id}',       'InvoiceController',       'show'],
    ['DELETE', 'invoices/{id}',       'InvoiceController',       'destroy'],

    // Purchase orders (nhap kho)
    ['GET',    'purchase-orders',     'PurchaseOrderController', 'index'],
    ['POST',   'purchase-orders',     'PurchaseOrderController', 'store'],
    ['GET',    'purchase-orders/{id}','PurchaseOrderController', 'show'],
    ['DELETE', 'purchase-orders/{id}','PurchaseOrderController', 'destroy'],

    // Promotions
    ['GET',    'promotions',          'PromotionController',     'index'],
    ['GET',    'promotions/active',   'PromotionController',     'active'],
    ['POST',   'promotions',          'PromotionController',     'store'],
    ['GET',    'promotions/{id}',     'PromotionController',     'show'],
    ['PUT',    'promotions/{id}',     'PromotionController',     'update'],
    ['PATCH',  'promotions/{id}/toggle','PromotionController',   'toggle'],
    ['DELETE', 'promotions/{id}',     'PromotionController',     'destroy'],

    // Users (chi admin)
    ['GET',    'users',               'UserController',          'index'],
    ['POST',   'users',               'UserController',          'store'],
    ['GET',    'users/{id}',          'UserController',          'show'],
    ['PUT',    'users/{id}',          'UserController',          'update'],
    ['DELETE', 'users/{id}',          'UserController',          'destroy'],

    // Reports
    ['GET',    'reports/revenue',     'ReportController',        'revenue'],
    ['GET',    'reports/inventory',   'ReportController',        'inventory'],

    // Tra hang (returns)
    ['GET',    'returns',                 'ReturnController',    'index'],
    ['POST',   'returns',                 'ReturnController',    'store'],
    ['GET',    'returns/invoice/{id}',    'ReturnController',    'byInvoice'],
    ['GET',    'returns/{id}',            'ReturnController',    'show'],
];

// Trang goc -> thong tin API
if ($url === '') {
    Response::success([
        'name'    => 'HKT Shop API',
        'version' => '1.0',
        'docs'    => 'Xem README_API.md',
    ], 'API dang chay');
}

// ===== Khop route =====
$pathMethodExists = false; // co path khop nhung sai method -> 405

foreach ($routes as [$rMethod, $rPattern, $rController, $rAction]) {
    // Bien pattern thanh regex
    $regex = '#^' . str_replace('{id}', '([0-9]+)', $rPattern) . '$#';
    if (preg_match($regex, $url, $m)) {
        $pathMethodExists = true;
        if ($rMethod === $method) {
            array_shift($m); // bo phan tu khop toan bo
            $controller = new $rController();
            call_user_func_array([$controller, $rAction], $m);
            exit;
        }
    }
}

if ($pathMethodExists) {
    Response::error('Phuong thuc ' . $method . ' khong duoc ho tro cho endpoint nay', 405);
}

Response::error('Khong tim thay endpoint: /' . $url, 404);
