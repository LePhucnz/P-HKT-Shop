<?php
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/PurchaseOrder.php';
require_once __DIR__ . '/../models/PurchaseOrderDetail.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class PurchaseOrderController {

    private function guard() {
        return Auth::requireRole([
            ROLE_ADMIN,
            ROLE_MANAGER,
            ROLE_STOCK_KEEPER
        ]);
    }


    // GET /api/purchase-orders
    public function index() {

        $this->guard();

        $db = Database::getConnection();

        $rows = $db->query(
            "SELECT p.*, 
                    u.ho_ten as ten_nv 
             FROM phieu_nhap_kho p
             LEFT JOIN users u 
             ON p.nhan_vien_id = u.id
             ORDER BY p.id DESC"
        )->fetchAll();


        Response::success(
            $rows,
            'Danh sach phieu nhap'
        );
    }



    // GET /api/purchase-orders/{id}
    public function show($id) {

        $this->guard();


        $order = (new PurchaseOrder())
                    ->getOrderWithDetails($id);


        if(!$order){

            Response::error(
                'Khong tim thay phieu nhap',
                404
            );

            return;
        }


        Response::success(
            $order,
            'Chi tiet phieu nhap'
        );
    }




    // POST /api/purchase-orders
    public function store() {


        $user = $this->guard();


        $data = Request::body();



        $supplier = trim(
            $data['nha_cung_cap'] ?? ''
        );


        $rawItems = $data['items'] ?? [];



        if(empty($supplier)){

            Response::error(
                'Vui long nhap nha cung cap',
                422
            );

            return;
        }




        $items = [];



        foreach($rawItems as $it){


            $pid = $it['product_id'] ?? null;


            $qty = (int)(
                $it['quantity'] ?? 0
            );


            $price = (float)(
                $it['price'] ?? 0
            );



            // CHẶN SỐ ÂM
            if(
                !$pid ||
                $qty <= 0 ||
                $price < 0
            ){

                Response::error(
                    'So luong phai lon hon 0 va gia nhap khong duoc am',
                    422
                );

                return;
            }




            $items[] = [

                'product_id' => $pid,

                'quantity' => $qty,

                'price' => $price
            ];

        }




        if(empty($items)){


            Response::error(
                'Vui long them it nhat mot san pham',
                422
            );


            return;

        }





        try {


            $orderId =
                (new PurchaseOrder())
                ->createOrder(
                    $supplier,
                    $user['sub'],
                    $items
                );



            $order =
                (new PurchaseOrder())
                ->getOrderWithDetails($orderId);



            Response::success(
                $order,
                'Nhap kho thanh cong',
                201
            );



        }
        catch(Exception $e){


            Response::error(
                'Loi nhap kho: '.$e->getMessage(),
                500
            );

        }

    }






    // DELETE /api/purchase-orders/{id}
    public function destroy($id){


        $this->guard();



        $order =
            (new PurchaseOrder())
            ->getOrderWithDetails($id);



        if(!$order){

            Response::error(
                'Khong tim thay phieu nhap',
                404
            );

            return;

        }





        try{


            (new PurchaseOrder())
            ->deleteOrder($id);



            Response::success(
                null,
                'Da xoa phieu nhap va hoan lai ton kho'
            );



        }
        catch(Exception $e){


            Response::error(
                'Loi: '.$e->getMessage(),
                500
            );

        }

    }

}