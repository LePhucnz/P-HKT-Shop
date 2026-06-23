<?php

require_once __DIR__ . '/BaseModel.php';


class Product extends BaseModel
{


    protected $table = 'san_pham';




    // Lấy tất cả sản phẩm + danh mục
    public function getAllWithCategory()
    {


        $stmt = $this->db->query(

            "SELECT 
                sp.*,
                dm.ten_danh_muc

             FROM san_pham sp

             LEFT JOIN danh_muc dm

             ON sp.danh_muc_id = dm.id

             ORDER BY sp.id DESC"

        );


        return $stmt->fetchAll();

    }







    // Tìm kiếm sản phẩm
    public function search($keyword)
    {


        $stmt = $this->db->prepare(

            "SELECT 
                sp.*,
                dm.ten_danh_muc

             FROM san_pham sp

             LEFT JOIN danh_muc dm

             ON sp.danh_muc_id = dm.id

             WHERE 
                sp.ten_sp LIKE :kw1

             OR 
                sp.ma_sp LIKE :kw2

             ORDER BY sp.id DESC"

        );


        $stmt->execute([

            'kw1' => '%' . $keyword . '%',

            'kw2' => '%' . $keyword . '%'

        ]);


        return $stmt->fetchAll();

    }








    // Thêm sản phẩm
    public function create($data)
    {



        // chống dữ liệu âm

        if (($data['gia_ban'] ?? 0) < 0) {

            throw new Exception(
                'Gia ban khong duoc am'
            );

        }



        if (($data['so_luong_ton'] ?? 0) < 0) {

            throw new Exception(
                'So luong ton khong duoc am'
            );

        }




        $sql =

            "INSERT INTO san_pham

        (
            ma_sp,
            ten_sp,
            danh_muc_id,
            don_vi_tinh,
            gia_ban,
            so_luong_ton,
            mo_ta,
            hinh_anh
        )

        VALUES

        (
            :ma_sp,
            :ten_sp,
            :danh_muc_id,
            :don_vi_tinh,
            :gia_ban,
            :so_luong_ton,
            :mo_ta,
            :hinh_anh
        )";



        return $this->db

            ->prepare($sql)

            ->execute($data);

    }








    // Cập nhật sản phẩm
    public function update($id, $data)
    {



        if (($data['gia_ban'] ?? 0) < 0) {

            throw new Exception(
                'Gia ban khong duoc am'
            );

        }




        if (!empty($data['hinh_anh'])) {


            $sql =

                "UPDATE san_pham SET

                ten_sp=:ten_sp,

                danh_muc_id=:danh_muc_id,

                don_vi_tinh=:don_vi_tinh,

                gia_ban=:gia_ban,

                mo_ta=:mo_ta,

                hinh_anh=:hinh_anh


             WHERE id=:id";



        } else {


            unset($data['hinh_anh']);



            $sql =

                "UPDATE san_pham SET


                ten_sp=:ten_sp,

                danh_muc_id=:danh_muc_id,

                don_vi_tinh=:don_vi_tinh,

                gia_ban=:gia_ban,

                mo_ta=:mo_ta


             WHERE id=:id";

        }




        $data['id'] = $id;



        return $this->db

            ->prepare($sql)

            ->execute($data);


    }









    // Trừ tồn kho khi bán
    public function decreaseStock($productId, $quantity)
    {



        if ($quantity <= 0) {

            return false;

        }



        return $this->db->prepare(

            "UPDATE san_pham

             SET so_luong_ton = so_luong_ton - :q

             WHERE id=:id

             AND so_luong_ton >= :q2"

        )

            ->execute([

                'id' => $productId,

                'q' => $quantity,

                'q2' => $quantity

            ]);

    }










    // Cộng tồn kho khi nhập
    public function increaseStock($productId, $quantity)
    {



        if ($quantity <= 0) {

            return false;

        }



        return $this->db->prepare(

            "UPDATE san_pham

             SET so_luong_ton = so_luong_ton + :q

             WHERE id=:id"

        )

            ->execute([

                'id' => $productId,

                'q' => $quantity

            ]);

    }









    // Sản phẩm còn hàng
    public function getInStock()
    {


        return $this->db->query(

            "SELECT *

             FROM san_pham

             WHERE so_luong_ton > 0

             ORDER BY ten_sp ASC"

        )

            ->fetchAll();

    }









    // Kiểm tra sản phẩm đã phát sinh hóa đơn chưa
    public function isUsedInOrdersOrInvoices($id)
    {



        $stmt = $this->db->prepare(

            "SELECT

            (

                SELECT COUNT(*)

                FROM chi_tiet_don_hang

                WHERE san_pham_id=:id1


            )

            +

            (

                SELECT COUNT(*)

                FROM chi_tiet_hoa_don

                WHERE san_pham_id=:id2


            )

            AS total"

        );



        $stmt->execute([

            'id1' => $id,

            'id2' => $id

        ]);



        return (int) $stmt->fetchColumn() > 0;

    }


}