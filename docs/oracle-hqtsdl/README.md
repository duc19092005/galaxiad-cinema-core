# Hệ quản trị CSDL Oracle - Đặt vé rạp chiếu phim

> **Nội dung Báo cáo 3:** Thiết kế cài đặt - Implementation Design.  
> **Phạm vi:** Mô hình CSDL Oracle độc lập cho bài tập quản lý đặt vé rạp chiếu phim.

## 1. Bảng cài đặt Business Requirement / Business Rule

| Business Requirement / Business Rule | Cách cài đặt | Lý do lựa chọn |
|---|---|---|
| **BR1 - Giá vé và hệ số giá phải lớn hơn 0** | `CHECK` trên `LICH_CHIEU.GIA_CO_BAN`, `CHI_TIET_VE.DON_GIA`, `GHE.HE_SO_GIA` | Ràng buộc dữ liệu đơn giản, xử lý ngay tại cột. |
| **BR2 - Email khách hàng không trùng** | `UNIQUE (EMAIL)` trên `NGUOI_DUNG` | Đảm bảo mỗi tài khoản có một email duy nhất. |
| **BR3 - Ghế không trùng trong cùng phòng** | `UNIQUE (MA_PHONG, HANG_GHE, SO_GHE)` trên `GHE` | Xác định rõ một vị trí ghế trong phòng chiếu. |
| **BR4 - Lịch chiếu không trùng phòng và có 15 phút dọn phòng** | Trigger `BIU_LICH_CHIEU_KHONG_TRUNG` | Cần kiểm tra khoảng thời gian nhiều dòng, `CHECK` không xử lý được. |
| **BR5 - Không bán trùng ghế trong cùng lịch chiếu** | Bảng giữ chỗ `GHE_DA_DAT` có khóa chính `(MA_LC, MA_GHE)` và trigger `AI_CHI_TIET_VE_GIU_GHE` | Khóa chính tránh được cả tranh chấp đồng thời khi nhiều người đặt cùng một ghế. |
| **BR6 - Đơn chờ thanh toán quá 10 phút tự hủy** | Procedure `P_HUY_DON_QUA_HAN` | Có thể gọi theo lịch job hoặc từ ứng dụng; dễ kiểm soát và kiểm thử. |
| **BR7 - Đơn ở trạng thái cuối không được sửa sai** | Trigger `BIU_DON_DAT_STATUS` | Bảo vệ luồng trạng thái kể cả khi cập nhật trực tiếp bằng SQL. |
| **BR8 - Doanh thu chỉ tính đơn đã thanh toán/đã sử dụng** | View `V_DOANH_THU_NGAY` | Báo cáo luôn dùng cùng một định nghĩa doanh thu, loại đơn hủy/hoàn. |
| **BR9 - Người dùng phải đủ tuổi theo vai trò** | Trigger `BIU_NGUOI_DUNG_TUOI` | Kiểm tra tuổi phụ thuộc vào giá trị vai trò, không thể chỉ dùng `CHECK`. |

## 2. Danh sách Procedure

| Procedure | Nhóm | Mục đích | Related BR | Input | Output |
|---|---|---|---|---|---|
| `P_DAT_VE` | Business | Tạo đơn, tính giá và giữ ghế | BR4 - Lịch không trùng; BR5 - Không bán trùng ghế | `MA_KHACH`, `MA_NV`, `MA_LC`, danh sách ghế, phương thức TT | `MA_DON` |
| `P_THANH_TOAN` | Business | Chuyển đơn chờ thanh toán sang đã thanh toán | BR7 - Trạng thái đơn hợp lệ | `MA_DON`, phương thức TT | Trạng thái |
| `P_HUY_DON` | Business | Hủy đơn hợp lệ và giải phóng ghế | BR7 - Trạng thái đơn hợp lệ | `MA_DON`, lý do | Trạng thái |
| `P_HUY_DON_QUA_HAN` | Utility | Hủy các đơn `CHO_TT` quá 10 phút | BR6 - Tự hủy đơn quá hạn | Không có | Số đơn đã hủy |
| `P_THEM_LICH_CHIEU` | Business | Tạo lịch chiếu mới | BR4 - Lịch không trùng phòng/giờ | Phim, phòng, định dạng, thời gian, giá | `MA_LC` |
| `P_BAO_CAO_DOANH_THU` | Report | Mở cursor doanh thu theo khoảng ngày | BR8 - Doanh thu đơn hợp lệ | Từ ngày, đến ngày | `SYS_REFCURSOR` |
| `P_BAO_CAO_GHE_TRONG` | Report | Mở cursor ghế trống của một lịch chiếu | BR5 - Không bán trùng ghế | `MA_LC` | `SYS_REFCURSOR` |

## 3. Danh sách Trigger

| Trigger | Table | BEFORE/AFTER | Event | Business Rule |
|---|---|---|---|---|
| `BI_*_ID` | Các bảng có khóa chính đơn | BEFORE | INSERT | Tự động sinh ID bằng sequence khi ID chưa được truyền vào. |
| `BIU_NGUOI_DUNG_TUOI` | `NGUOI_DUNG` | BEFORE | INSERT, UPDATE | Khách từ 16 tuổi; nhân viên/quản lý từ 18 tuổi. |
| `BIU_LICH_CHIEU_KHONG_TRUNG` | `LICH_CHIEU` | BEFORE | INSERT, UPDATE | Không trùng phòng/giờ và có 15 phút dọn phòng. |
| `BIU_CHI_TIET_VE_GHE` | `CHI_TIET_VE` | BEFORE | INSERT, UPDATE | Ghế phải thuộc đúng phòng của lịch chiếu. |
| `AI_CHI_TIET_VE_GIU_GHE` | `CHI_TIET_VE` | AFTER | INSERT | Ghi vào `GHE_DA_DAT`; khóa chính chặn bán trùng ghế. |
| `BIU_DON_DAT_STATUS` | `DON_DAT` | BEFORE | INSERT, UPDATE | Kiểm tra chuyển trạng thái đơn hợp lệ. |
| `AU_DON_DAT_GIAI_PHONG_GHE` | `DON_DAT` | AFTER | UPDATE | Khi hủy/hoàn đơn thì vô hiệu và giải phóng ghế. |

## 4. Reporting Procedure / View

| Report | Procedure / View | Mô tả |
|---|---|---|
| Dashboard doanh thu | `V_DOANH_THU_NGAY`, `P_BAO_CAO_DOANH_THU` | Tổng hợp số đơn và doanh thu hợp lệ theo ngày. |
| Ghế trống | `V_GHE_TRONG`, `P_BAO_CAO_GHE_TRONG` | Liệt kê ghế chưa được giữ chỗ trong từng lịch đang mở. |
| Lịch hôm nay | `V_LICH_CHIEU_HOM_NAY` | Hiển thị phim, rạp, phòng, định dạng, giờ chiếu và giá. |

## 5. Transaction Design

| Transaction | Các bước |
|---|---|
| Đặt hàng / đặt vé | Kiểm tra lịch đang mở -> Kiểm tra ghế thuộc phòng và chưa được giữ -> Tạo `DON_DAT` -> Tạo `CHI_TIET_VE` -> Trigger ghi `GHE_DA_DAT` -> Tính tổng tiền -> `COMMIT`. |
| Thanh toán | Kiểm tra đơn `CHO_TT` -> Cập nhật phương thức thanh toán và trạng thái `DA_THANH_TOAN` -> `COMMIT`. |
| Hủy đơn | Kiểm tra điều kiện hủy -> Cập nhật `DA_HUY` -> Trigger vô hiệu chi tiết và xóa giữ ghế -> `COMMIT`. |
| Tạo lịch chiếu | Kiểm tra giá/thời gian -> Trigger kiểm tra trùng phòng giờ -> Thêm lịch chiếu -> `COMMIT`. |

## Phân quyền Role

Dựa trên source hiện tại, bài Oracle dùng bốn role quản trị trong sơ đồ và bổ sung role `Cashier` để xử lý bán vé tại quầy.

| Role Oracle | Tương ứng source | Tài khoản demo | Được phép làm |
|---|---|---|---|
| `R_ADMIN_HE_THONG` | `Admin` | `CINEMA_ADMIN / Admin123` | Toàn quyền dữ liệu của bài: quản lý người dùng, rạp, phim, lịch chiếu, đơn vé và xem báo cáo. |
| `R_QUAN_LY_RAP` | `TheaterManager` | `CINEMA_THEATER_MGR / Theater123` | Thêm/sửa rạp, phòng, ghế; xem phim/lịch và gọi `P_THEM_LICH_CHIEU`. |
| `R_QUAN_LY_PHIM` | `MovieManager` | `CINEMA_MOVIE_MGR / Movie123` | Thêm/sửa phim, thể loại, liên kết phim-thể loại và định dạng chiếu. |
| `R_PHONG_VAN_HANH` | `FacilitiesManager` | `CINEMA_FACILITIES / Facility123` | Xem lịch, ghế trống, doanh thu; gọi `P_DAT_VE`, `P_THANH_TOAN`, `P_HUY_DON`, `P_HUY_DON_QUA_HAN`. |
| `R_THU_NGAN` | `Cashier` | `CINEMA_CASHIER / Cashier123` | Xem lịch, ghế trống; gọi `P_DAT_VE`, `P_THANH_TOAN`, `P_HUY_DON`. Không có quyền quản lý rạp, phim hoặc xem doanh thu. |
| Schema owner | Không áp dụng | `CINEMA_APP / Cinema123` | Sở hữu các bảng, trigger, procedure, view và role; chỉ dùng để cài đặt/bảo trì CSDL. |

Các tài khoản demo được tạo trong `docker-init/01_create_user.sql`; năm role được tạo, cấp quyền và gán tài khoản trong `sql/cinema_oracle_all.sql`.
## Cấu trúc files

| Đường dẫn | Nội dung |
|---|---|
| `docker-compose.oracle.yml` | Oracle Database Free chạy độc lập qua Docker Compose. |
| `docker-init/` | Script tạo schema user và chạy project lúc container khởi tạo lần đầu. |
| `sql/cinema_oracle_all.sql` | **File SQL tổng hợp duy nhất**: schema, trigger, procedure, view, quyền và dữ liệu mẫu. |
| `sql/` | Các script thành phần, phục vụ tham khảo và chạy riêng khi cần. |

## Cách chạy Oracle Free bằng Docker

Yêu cầu: Docker Desktop đang chạy và đã đăng nhập Oracle Container Registry để tải image `container-registry.oracle.com/database/free:latest` nếu máy chưa có image.

Từ thư mục gốc của repository, chạy:

```powershell
docker compose -f docs/oracle-hqtsdl/docker-compose.oracle.yml up -d
docker logs -f cinema-oracle-free
```

Chỉ khởi tạo lần đầu mới chạy các script trong `docker-init`. Chờ đến khi log báo database sẵn sàng, sau đó kết nối bằng SQL Developer hoặc DBeaver:

| Thuộc tính | Giá trị |
|---|---|
| Host | `localhost` |
| Port | `1521` |
| Service name | `FREEPDB1` |
| User | `CINEMA_APP` |
| Password | `Cinema123` |
| SYS/SYSTEM password demo | `Oracle123` |

Chạy toàn bộ bài bằng một file sau khi đăng nhập `CINEMA_APP`:

```sql
@cinema_oracle_all.sql
```

Kiểm tra object lỗi:

```sql
SELECT object_name, object_type, status
FROM user_objects
WHERE status <> 'VALID';
```

Chạy thử đặt vé và thanh toán:

```sql
VAR v_ma_don NUMBER
VAR v_trang_thai VARCHAR2(20)

EXEC P_DAT_VE(1, 2, 1, SYS.ODCINUMBERLIST(2, 3), 'MOMO', :v_ma_don);
EXEC P_THANH_TOAN(:v_ma_don, 'MOMO', :v_trang_thai);

SELECT * FROM V_DOANH_THU_NGAY;
SELECT * FROM V_GHE_TRONG WHERE MA_LC = 1;
```

Để tạo lại từ đầu, dừng và xóa volume (thao tác này sẽ xóa toàn bộ dữ liệu Oracle):

```powershell
docker compose -f docs/oracle-hqtsdl/docker-compose.oracle.yml down -v
docker compose -f docs/oracle-hqtsdl/docker-compose.oracle.yml up -d
```

> Mật khẩu trong tài liệu này chỉ dùng cho môi trường học tập. Không sử dụng trực tiếp trong hệ thống production.

