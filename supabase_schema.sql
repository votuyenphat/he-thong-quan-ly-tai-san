-- ==============================================================================
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU SUPABASE (POSTGRESQL + REALTIME)
-- DỰ ÁN: HỆ THỐNG QUẢN LÝ & KIỂM KÊ TÀI SẢN
-- HƯỚNG DẪN:
-- 1. Đăng nhập https://supabase.com -> Chọn Project của bạn.
-- 2. Vào mục "SQL Editor" ở thanh menu bên trái.
-- 3. Nhấn "New query", dán toàn bộ nội dung script này vào và nhấn nút "Run" (▶).
-- ==============================================================================

-- 1. Tạo bảng lưu trữ dữ liệu đồng bộ trung tâm (JSONB siêu tốc)
CREATE TABLE IF NOT EXISTS public.app_database (
    id TEXT PRIMARY KEY DEFAULT 'main',
    data JSONB NOT NULL,
    last_updated BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật replica identity full để Realtime gửi đầy đủ payload khi có UPDATE
ALTER TABLE public.app_database REPLICA IDENTITY FULL;

-- 2. Thiết lập quyền truy cập (Row Level Security - RLS)
ALTER TABLE public.app_database ENABLE ROW LEVEL SECURITY;

-- Cho phép ứng dụng (sử dụng anon key) đọc và ghi dữ liệu đồng bộ
DROP POLICY IF EXISTS "Cho phep doc ghi public" ON public.app_database;
CREATE POLICY "Cho phep doc ghi public" ON public.app_database
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 3. Kích hoạt tính năng đồng bộ thời gian thực (Supabase Realtime)
-- Giúp các thiết bị (Điện thoại, Laptop) tự động nhận thay đổi tức thì
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'app_database'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_database;
    END IF;
END $$;

-- 4. Khởi tạo bản ghi mặc định ban đầu nếu chưa có
INSERT INTO public.app_database (id, data, last_updated)
VALUES (
    'main',
    jsonb_build_object(
        'assets', '[]'::jsonb,
        'departments', '[]'::jsonb,
        'locations', '[]'::jsonb,
        'transfers', '[]'::jsonb,
        'recalls', '[]'::jsonb,
        'liquidations', '[]'::jsonb,
        'inventorySessions', '[]'::jsonb,
        'auditLogs', '[]'::jsonb,
        'assetTypeOptions', '[]'::jsonb,
        'conditionOptions', '[]'::jsonb,
        'statusOptions', '[]'::jsonb
    ),
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
)
ON CONFLICT (id) DO NOTHING;

-- 5. Tạo các VIEW quan hệ để dễ dàng xem và truy vấn trực tiếp trên Supabase Table Editor
CREATE OR REPLACE VIEW public.v_assets AS
SELECT 
    (elem->>'id') AS id,
    (elem->>'code') AS code,
    (elem->>'name') AS name,
    (elem->>'type') AS type,
    (elem->>'departmentName') AS department_name,
    (elem->>'locationPath') AS location_path,
    (elem->>'condition') AS condition,
    (elem->>'status') AS status,
    (elem->>'price')::NUMERIC AS price,
    (elem->>'responsiblePerson') AS responsible_person,
    (elem->>'currentUser') AS current_user,
    (elem->>'purchaseDate') AS purchase_date
FROM public.app_database d,
LATERAL jsonb_array_elements(COALESCE(d.data->'assets', '[]'::jsonb)) elem
WHERE d.id = 'main';

CREATE OR REPLACE VIEW public.v_departments AS
SELECT 
    (elem->>'id') AS id,
    (elem->>'code') AS code,
    (elem->>'name') AS name,
    (elem->>'manager') AS manager,
    (elem->>'phone') AS phone
FROM public.app_database d,
LATERAL jsonb_array_elements(COALESCE(d.data->'departments', '[]'::jsonb)) elem
WHERE d.id = 'main';

CREATE OR REPLACE VIEW public.v_inventory_sessions AS
SELECT 
    (elem->>'id') AS id,
    (elem->>'name') AS name,
    (elem->>'status') AS status,
    (elem->>'startDate') AS start_date,
    (elem->>'endDate') AS end_date,
    (elem->>'notes') AS notes
FROM public.app_database d,
LATERAL jsonb_array_elements(COALESCE(d.data->'inventorySessions', '[]'::jsonb)) elem
WHERE d.id = 'main';

-- ==============================================================================
-- HOÀN TẤT CẤU HÌNH SUPABASE!
-- Bạn có thể lấy Project URL và anon key tại: Project Settings -> API
-- ==============================================================================
