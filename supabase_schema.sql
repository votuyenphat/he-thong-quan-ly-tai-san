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

-- 6. Bảng lưu hồ sơ người dùng & phân quyền 2 cấp (Super Admin & Quản lý phòng)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE, -- Liên kết với auth.users(id) của Supabase Auth nếu có
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    department_id TEXT,       -- NULL hoặc 'ALL' nếu là Super Admin
    department_name TEXT,     -- Tên phòng ban quản lý
    role TEXT NOT NULL DEFAULT 'QUAN_LY_PHONG', -- 'SUPER_ADMIN' hoặc 'QUAN_LY_PHONG'
    is_super_admin BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{
        "asset_create": true,
        "asset_edit": true,
        "asset_delete": false,
        "asset_print_qr": true,
        "asset_export": true,
        "transfer_propose": true,
        "recall_propose": true,
        "liquidation_propose": false,
        "inventory_scan": true
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    force_password_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS và chính sách truy cập cho user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phep doc ghi user_profiles" ON public.user_profiles;
CREATE POLICY "Cho phep doc ghi user_profiles" ON public.user_profiles
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Bật Realtime cho user_profiles để khi Admin đổi quyền, Quản lý phòng nhận ngay lập tức
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'user_profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
    END IF;
END $$;

-- Khởi tạo tài khoản Super Admin vphat772@gmail.com mặc định
INSERT INTO public.user_profiles (
    email,
    full_name,
    role,
    is_super_admin,
    department_id,
    department_name,
    permissions,
    is_active,
    force_password_change
)
VALUES (
    'vphat772@gmail.com',
    'Võ Tuyền Phát (Super Admin)',
    'SUPER_ADMIN',
    TRUE,
    'ALL',
    'Toàn trường',
    '{
        "asset_create": true,
        "asset_edit": true,
        "asset_delete": true,
        "asset_print_qr": true,
        "asset_export": true,
        "transfer_propose": true,
        "transfer_approve": true,
        "recall_propose": true,
        "recall_approve": true,
        "liquidation_propose": true,
        "liquidation_approve": true,
        "inventory_scan": true,
        "manage_users": true,
        "manage_locations": true
    }'::jsonb,
    TRUE,
    FALSE
)
ON CONFLICT (email) DO UPDATE SET
    is_super_admin = TRUE,
    role = 'SUPER_ADMIN',
    department_id = 'ALL',
    department_name = 'Toàn trường';

-- ==============================================================================
-- HOÀN TẤT CẤU HÌNH SUPABASE!
-- Bạn có thể lấy Project URL và anon key tại: Project Settings -> API
-- ==============================================================================
