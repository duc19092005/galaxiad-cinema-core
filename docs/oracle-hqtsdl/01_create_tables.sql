-- =============================================================================
--  HỆ QUẢN TRỊ CSDL ORACLE — ĐẶT VÉ RẠP CHIẾU PHIM (PHIÊN BẢN TỐI GIẢN)
--  File: 01_create_tables.sql
--  Thứ tự: Sequence → Table → FK/CHECK đã gắn trong CREATE → Index phụ
--  Chạy:  @01_create_tables.sql
-- =============================================================================

/* Xóa theo thứ tự ngược FK (dùng khi tạo lại — comment nếu lần đầu) */
/*
BEGIN
  FOR t IN (
    SELECT table_name FROM user_tables WHERE table_name IN (
      'CHI_TIET_VE','DON_DAT','LICH_CHIEU','PHIM_THE_LOAI','PHIM',
      'THE_LOAI','DINH_DANG','GHE','PHONG_CHIEU','RAP','NGUOI_DUNG'
    )
  ) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;

  FOR s IN (
    SELECT sequence_name FROM user_sequences WHERE sequence_name LIKE 'SEQ_%'
  ) LOOP
    EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
  END LOOP;
END;
/
*/

-- -----------------------------------------------------------------------------
-- SEQUENCES
-- -----------------------------------------------------------------------------
CREATE SEQUENCE SEQ_NGUOI_DUNG  START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_RAP         START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_PHONG       START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_GHE         START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_THE_LOAI    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_PHIM        START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_DINH_DANG   START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_LICH_CHIEU  START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_DON_DAT     START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_CHI_TIET_VE START WITH 1 INCREMENT BY 1 NOCACHE;

-- -----------------------------------------------------------------------------
-- 1. NGUOI_DUNG
-- -----------------------------------------------------------------------------
CREATE TABLE NGUOI_DUNG (
    MA_ND       NUMBER          NOT NULL,
    EMAIL       VARCHAR2(100)   NOT NULL,
    MAT_KHAU    VARCHAR2(100)   NOT NULL,
    HO_TEN      NVARCHAR2(100)  NOT NULL,
    NGAY_SINH   DATE            NOT NULL,
    SDT         VARCHAR2(15),
    LOAI_ND     VARCHAR2(20)    DEFAULT 'KHACH' NOT NULL,
    TRANG_THAI  VARCHAR2(20)    DEFAULT 'HOAT_DONG' NOT NULL,
    NGAY_TAO    DATE            DEFAULT SYSDATE NOT NULL,
    CONSTRAINT PK_NGUOI_DUNG PRIMARY KEY (MA_ND),
    CONSTRAINT UK_ND_EMAIL UNIQUE (EMAIL),
    CONSTRAINT CK_ND_LOAI CHECK (LOAI_ND IN ('KHACH', 'NHANVIEN', 'QUANLY')),
    CONSTRAINT CK_ND_TT CHECK (TRANG_THAI IN ('HOAT_DONG', 'KHOA'))
);

COMMENT ON TABLE NGUOI_DUNG IS 'Nguoi dung he thong: khach, nhan vien quay, quan ly';
COMMENT ON COLUMN NGUOI_DUNG.LOAI_ND IS 'KHACH | NHANVIEN | QUANLY — phan quyen thuc te dung Oracle ROLE';

-- -----------------------------------------------------------------------------
-- 2. RAP
-- -----------------------------------------------------------------------------
CREATE TABLE RAP (
    MA_RAP      NUMBER          NOT NULL,
    TEN_RAP     NVARCHAR2(200)  NOT NULL,
    THANH_PHO   NVARCHAR2(100)  NOT NULL,
    DIA_CHI     NVARCHAR2(300)  NOT NULL,
    HOTLINE     VARCHAR2(15),
    TRANG_THAI  VARCHAR2(20)    DEFAULT 'HOAT_DONG' NOT NULL,
    CONSTRAINT PK_RAP PRIMARY KEY (MA_RAP),
    CONSTRAINT CK_RAP_TT CHECK (TRANG_THAI IN ('HOAT_DONG', 'NGUNG'))
);

COMMENT ON TABLE RAP IS 'Thong tin rap chieu phim';

-- -----------------------------------------------------------------------------
-- 3. PHONG_CHIEU
-- -----------------------------------------------------------------------------
CREATE TABLE PHONG_CHIEU (
    MA_PHONG    NUMBER          NOT NULL,
    MA_RAP      NUMBER          NOT NULL,
    TEN_PHONG   VARCHAR2(50)    NOT NULL,
    SO_HANG     NUMBER          NOT NULL,
    SO_COT      NUMBER          NOT NULL,
    TRANG_THAI  VARCHAR2(20)    DEFAULT 'HOAT_DONG' NOT NULL,
    CONSTRAINT PK_PHONG_CHIEU PRIMARY KEY (MA_PHONG),
    CONSTRAINT FK_PHONG_RAP FOREIGN KEY (MA_RAP)
        REFERENCES RAP (MA_RAP),
    CONSTRAINT UK_PHONG_TEN UNIQUE (MA_RAP, TEN_PHONG),
    CONSTRAINT CK_PHONG_HANG CHECK (SO_HANG > 0),
    CONSTRAINT CK_PHONG_COT CHECK (SO_COT > 0),
    CONSTRAINT CK_PHONG_TT CHECK (TRANG_THAI IN ('HOAT_DONG', 'BAO_TRI', 'NGUNG'))
);

COMMENT ON TABLE PHONG_CHIEU IS 'Phong chieu thuoc mot rap';

-- -----------------------------------------------------------------------------
-- 4. GHE
-- -----------------------------------------------------------------------------
CREATE TABLE GHE (
    MA_GHE      NUMBER          NOT NULL,
    MA_PHONG    NUMBER          NOT NULL,
    SO_GHE      VARCHAR2(10)    NOT NULL,
    HANG        NUMBER          NOT NULL,
    COT         NUMBER          NOT NULL,
    LOAI_GHE    VARCHAR2(20)    DEFAULT 'THUONG' NOT NULL,
    CONSTRAINT PK_GHE PRIMARY KEY (MA_GHE),
    CONSTRAINT FK_GHE_PHONG FOREIGN KEY (MA_PHONG)
        REFERENCES PHONG_CHIEU (MA_PHONG),
    CONSTRAINT UK_GHE_SO UNIQUE (MA_PHONG, SO_GHE),
    CONSTRAINT UK_GHE_TOA_DO UNIQUE (MA_PHONG, HANG, COT),
    CONSTRAINT CK_GHE_HANG CHECK (HANG > 0),
    CONSTRAINT CK_GHE_COT CHECK (COT > 0),
    CONSTRAINT CK_GHE_LOAI CHECK (LOAI_GHE IN ('THUONG', 'VIP'))
);

COMMENT ON TABLE GHE IS 'Ghe trong phong chieu; SO_GHE vi du A1, B5';

-- -----------------------------------------------------------------------------
-- 5. THE_LOAI
-- -----------------------------------------------------------------------------
CREATE TABLE THE_LOAI (
    MA_TL       NUMBER          NOT NULL,
    TEN_TL      NVARCHAR2(50)   NOT NULL,
    MO_TA       NVARCHAR2(300),
    CONSTRAINT PK_THE_LOAI PRIMARY KEY (MA_TL),
    CONSTRAINT UK_TL_TEN UNIQUE (TEN_TL)
);

COMMENT ON TABLE THE_LOAI IS 'Danh muc the loai phim';

-- -----------------------------------------------------------------------------
-- 6. PHIM
-- -----------------------------------------------------------------------------
CREATE TABLE PHIM (
    MA_PHIM     NUMBER          NOT NULL,
    TEN_PHIM    NVARCHAR2(200)  NOT NULL,
    THOI_LUONG  NUMBER          NOT NULL,
    DO_TUOI     VARCHAR2(10)    DEFAULT 'P' NOT NULL,
    DAO_DIEN    NVARCHAR2(100),
    NGAY_KC     DATE,
    TRANG_THAI  VARCHAR2(20)    DEFAULT 'SAP_CHIEU' NOT NULL,
    CONSTRAINT PK_PHIM PRIMARY KEY (MA_PHIM),
    CONSTRAINT CK_PHIM_TL CHECK (THOI_LUONG > 0),
    CONSTRAINT CK_PHIM_DOTUOI CHECK (DO_TUOI IN ('P', 'K', 'T13', 'T16', 'T18')),
    CONSTRAINT CK_PHIM_TT CHECK (TRANG_THAI IN ('SAP_CHIEU', 'DANG_CHIEU', 'NGUNG'))
);

COMMENT ON TABLE PHIM IS 'Thong tin phim';
COMMENT ON COLUMN PHIM.THOI_LUONG IS 'Thoi luong phim tinh bang phut';
COMMENT ON COLUMN PHIM.DO_TUOI IS 'Phan loai do tuoi: P, K, T13, T16, T18';

-- -----------------------------------------------------------------------------
-- 7. PHIM_THE_LOAI (N-N)
-- -----------------------------------------------------------------------------
CREATE TABLE PHIM_THE_LOAI (
    MA_PHIM     NUMBER          NOT NULL,
    MA_TL       NUMBER          NOT NULL,
    CONSTRAINT PK_PHIM_TL PRIMARY KEY (MA_PHIM, MA_TL),
    CONSTRAINT FK_PTL_PHIM FOREIGN KEY (MA_PHIM)
        REFERENCES PHIM (MA_PHIM),
    CONSTRAINT FK_PTL_TL FOREIGN KEY (MA_TL)
        REFERENCES THE_LOAI (MA_TL)
);

COMMENT ON TABLE PHIM_THE_LOAI IS 'Quan he nhieu-nhieu giua PHIM va THE_LOAI';

-- -----------------------------------------------------------------------------
-- 8. DINH_DANG
-- -----------------------------------------------------------------------------
CREATE TABLE DINH_DANG (
    MA_DD       NUMBER          NOT NULL,
    TEN_DD      VARCHAR2(30)    NOT NULL,
    GIA_CO_BAN  NUMBER(12,2)    NOT NULL,
    MO_TA       NVARCHAR2(200),
    CONSTRAINT PK_DINH_DANG PRIMARY KEY (MA_DD),
    CONSTRAINT UK_DD_TEN UNIQUE (TEN_DD),
    CONSTRAINT CK_DD_GIA CHECK (GIA_CO_BAN > 0)
);

COMMENT ON TABLE DINH_DANG IS 'Dinh dang chieu: 2D, 3D, IMAX — kem gia co ban';

-- -----------------------------------------------------------------------------
-- 9. LICH_CHIEU
-- -----------------------------------------------------------------------------
CREATE TABLE LICH_CHIEU (
    MA_LC       NUMBER          NOT NULL,
    MA_PHIM     NUMBER          NOT NULL,
    MA_PHONG    NUMBER          NOT NULL,
    MA_DD       NUMBER          NOT NULL,
    TG_BAT_DAU  DATE            NOT NULL,
    TG_KET_THUC DATE            NOT NULL,
    TRANG_THAI  VARCHAR2(20)    DEFAULT 'MO_BAN' NOT NULL,
    CONSTRAINT PK_LICH_CHIEU PRIMARY KEY (MA_LC),
    CONSTRAINT FK_LC_PHIM FOREIGN KEY (MA_PHIM)
        REFERENCES PHIM (MA_PHIM),
    CONSTRAINT FK_LC_PHONG FOREIGN KEY (MA_PHONG)
        REFERENCES PHONG_CHIEU (MA_PHONG),
    CONSTRAINT FK_LC_DD FOREIGN KEY (MA_DD)
        REFERENCES DINH_DANG (MA_DD),
    CONSTRAINT CK_LC_TG CHECK (TG_KET_THUC > TG_BAT_DAU),
    CONSTRAINT CK_LC_TT CHECK (TRANG_THAI IN ('MO_BAN', 'DONG', 'HUY'))
);

COMMENT ON TABLE LICH_CHIEU IS 'Suat chieu: 1 phim + 1 phong + 1 dinh dang + khoang thoi gian';
COMMENT ON COLUMN LICH_CHIEU.TRANG_THAI IS 'MO_BAN | DONG | HUY — trung gio phong xu ly bang TRIGGER';

CREATE INDEX IX_LC_PHONG_TG ON LICH_CHIEU (MA_PHONG, TG_BAT_DAU, TG_KET_THUC);
CREATE INDEX IX_LC_PHIM ON LICH_CHIEU (MA_PHIM);

-- -----------------------------------------------------------------------------
-- 10. DON_DAT
-- -----------------------------------------------------------------------------
CREATE TABLE DON_DAT (
    MA_DON          NUMBER          NOT NULL,
    MA_BOOKING      VARCHAR2(20)    NOT NULL,
    MA_KHACH        NUMBER,
    MA_NV           NUMBER,
    TRANG_THAI      VARCHAR2(20)    DEFAULT 'CHO_TT' NOT NULL,
    PT_THANH_TOAN   VARCHAR2(20),
    TONG_TIEN       NUMBER(12,2)    DEFAULT 0 NOT NULL,
    SO_LUONG        NUMBER          NOT NULL,
    NGAY_DAT        DATE            DEFAULT SYSDATE NOT NULL,
    CONSTRAINT PK_DON_DAT PRIMARY KEY (MA_DON),
    CONSTRAINT UK_DON_BOOKING UNIQUE (MA_BOOKING),
    CONSTRAINT FK_DON_KHACH FOREIGN KEY (MA_KHACH)
        REFERENCES NGUOI_DUNG (MA_ND),
    CONSTRAINT FK_DON_NV FOREIGN KEY (MA_NV)
        REFERENCES NGUOI_DUNG (MA_ND),
    CONSTRAINT CK_DON_TT CHECK (TRANG_THAI IN (
        'CHO_TT', 'DA_THANH_TOAN', 'DA_HUY', 'DA_HOAN', 'DA_SU_DUNG'
    )),
    CONSTRAINT CK_DON_PTTT CHECK (
        PT_THANH_TOAN IS NULL
        OR PT_THANH_TOAN IN ('TIEN_MAT', 'CHUYEN_KHOAN', 'ONLINE')
    ),
    CONSTRAINT CK_DON_TIEN CHECK (TONG_TIEN >= 0),
    CONSTRAINT CK_DON_SL CHECK (SO_LUONG BETWEEN 1 AND 10)
);

COMMENT ON TABLE DON_DAT IS 'Don dat ve (header)';
COMMENT ON COLUMN DON_DAT.MA_BOOKING IS 'Ma dat ve hien thi cho khach (unique)';
COMMENT ON COLUMN DON_DAT.MA_KHACH IS 'NULL neu ban le khong co tai khoan';
COMMENT ON COLUMN DON_DAT.MA_NV IS 'NULL neu dat online; co gia tri neu ban tai quay';

CREATE INDEX IX_DON_KHACH ON DON_DAT (MA_KHACH);
CREATE INDEX IX_DON_TT ON DON_DAT (TRANG_THAI, NGAY_DAT);

-- -----------------------------------------------------------------------------
-- 11. CHI_TIET_VE
-- -----------------------------------------------------------------------------
CREATE TABLE CHI_TIET_VE (
    MA_CT       NUMBER          NOT NULL,
    MA_DON      NUMBER          NOT NULL,
    MA_LC       NUMBER          NOT NULL,
    MA_GHE      NUMBER          NOT NULL,
    DON_GIA     NUMBER(12,2)    NOT NULL,
    CONSTRAINT PK_CHI_TIET_VE PRIMARY KEY (MA_CT),
    CONSTRAINT FK_CT_DON FOREIGN KEY (MA_DON)
        REFERENCES DON_DAT (MA_DON),
    CONSTRAINT FK_CT_LC FOREIGN KEY (MA_LC)
        REFERENCES LICH_CHIEU (MA_LC),
    CONSTRAINT FK_CT_GHE FOREIGN KEY (MA_GHE)
        REFERENCES GHE (MA_GHE),
    CONSTRAINT CK_CT_GIA CHECK (DON_GIA >= 0)
);

COMMENT ON TABLE CHI_TIET_VE IS 'Moi dong = 1 ghe tren 1 lich chieu trong 1 don';
COMMENT ON COLUMN CHI_TIET_VE.DON_GIA IS 'Gia snapshot tai thoi diem dat';

-- Khong UNIQUE (MA_LC, MA_GHE) truc tiep de cho phep ghe duoc ban lai
-- sau khi don bi HUY. Rang buoc "ghe con hieu luc khong trung" -> TRIGGER.

CREATE INDEX IX_CT_DON ON CHI_TIET_VE (MA_DON);
CREATE INDEX IX_CT_LC_GHE ON CHI_TIET_VE (MA_LC, MA_GHE);

-- =============================================================================
-- KẾT THÚC DDL BẢNG
-- Gợi ý bước tiếp:
--   - Trigger auto ID từ SEQUENCE
--   - Trigger kiem tra trung ghe / trung lich
--   - Procedure P_DAT_VE, P_THANH_TOAN, P_HUY_DON
--   - View V_GHE_TRONG, V_DOANH_THU_NGAY
--   - CREATE ROLE + GRANT (khong dung bang Permission)
-- =============================================================================
