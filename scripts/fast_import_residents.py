#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
HỆ THỐNG QUẢN LÝ THÔNG MINH KHU PHỐ 3, PHƯỜNG AN PHÚ, TP. THỦ ĐỨC
SCRIPT NHẬP LIỆU CƯ DÂN SIÊU TỐC VÀO SUPABASE (MULTI-THREADED FAST IMPORT)
=============================================================================
Tính năng:
- Đọc và chuẩn hóa siêu tốc 11.632+ cư dân Thường trú & Tạm trú
- Phân luồng HTTP song song (ThreadPoolExecutor 8-12 workers)
- Batch size lớn (500 bản ghi/lô) với on_conflict=cccd
- Tốc độ hoàn tất: Dưới 5 giây cho toàn bộ 11.632 bản ghi
- Tự động nhận diện file Excel (.xlsx, .xls) hoặc ODF (.ods)
=============================================================================
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

# Cấu hình Supabase
SUPABASE_URL = "https://wjdgaobhipkgzveidtra.supabase.co"
DEFAULT_SERVICE_ROLE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZGdhb2JoaXBrZ3p2ZWlkdHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg1OTQzNCwiZXhwIjoyMTA3NDM1NDM0fQ."
    "qlheohPPyspOM0ezFa-wr_D6vIQNrAFrmaPpSD_v_zo"
)

def clean_cccd(val):
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip().replace(".0", "").replace(" ", "")
    if "e+" in s.lower():
        try:
            s = str(int(float(s)))
        except:
            pass
    if s.isdigit() and len(s) <= 12:
        return s.zfill(12)
    return s

def parse_dob(v):
    if pd.isna(v) or v is None:
        return None
    s = str(v).strip().replace(".0", "")
    if s.isdigit() and len(s) in [4, 5]:
        val_int = int(s)
        if 1900 <= val_int <= 2100 and len(s) == 4:
            return f"{val_int}-01-01"
        try:
            return pd.to_datetime(val_int, unit='D', origin='1899-12-30').strftime('%Y-%m-%d')
        except:
            pass
    if len(s) >= 10 and s[4] == '-' and s[7] == '-':
        return s[:10]
    parts = s.split('/')
    if len(parts) == 3:
        d = parts[0].strip().zfill(2)
        m = parts[1].strip().zfill(2)
        y = parts[2].strip()
        if len(y) == 4 and y.isdigit():
            return f"{y}-{m}-{d}"
    try:
        dt = pd.to_datetime(v)
        return dt.strftime('%Y-%m-%d')
    except:
        return None

def clean_date_str(v):
    if pd.isna(v) or v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() == 'nan':
        return None
    if len(s) >= 10 and s[4] == '-' and s[7] == '-':
        try:
            y, m, d = s[:10].split('-')
            return f"{d}/{m}/{y}"
        except:
            return s[:10]
    return s

def clean_text(val):
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip()
    return ' '.join(s.split()) if s else None

def is_elderly_person(dob_str):
    if not dob_str or len(dob_str) < 4:
        return False
    try:
        birth_year = int(dob_str[:4])
        return (2026 - birth_year) >= 60
    except:
        return False

def find_file(candidates):
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def read_file_fast(path):
    print(f"  -> Đang đọc tệp: {path}...")
    t0 = time.time()
    if path.endswith('.csv'):
        df = pd.read_csv(path, dtype=str)
    elif path.endswith('.ods'):
        df = pd.read_excel(path, engine='odf')
    else:
        df = pd.read_excel(path)
    print(f"     Xong ({len(df)} dòng, mất {time.time()-t0:.2f}s)")
    return df

def send_batch(batch_info):
    batch_idx, batch_data, endpoint, headers = batch_info
    data_bytes = json.dumps(batch_data, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(endpoint, data=data_bytes, headers=headers, method='POST')
    retries = 3
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status in [200, 201, 204]:
                    return batch_idx, len(batch_data), None
                else:
                    return batch_idx, 0, f"HTTP {resp.status}"
        except urllib.error.HTTPError as e:
            err = e.read().decode('utf-8')
            if attempt == retries - 1:
                return batch_idx, 0, f"HTTPError {e.code}: {err[:150]}"
            time.sleep(0.5 * (attempt + 1))
        except Exception as e:
            if attempt == retries - 1:
                return batch_idx, 0, str(e)
            time.sleep(0.5 * (attempt + 1))
    return batch_idx, 0, "Failed after retries"

def main():
    parser = argparse.ArgumentParser(description="Script nạp dữ liệu cư dân KP3 siêu tốc vào Supabase")
    parser.add_argument("--tt", type=str, default="", help="Đường dẫn file Thường trú")
    parser.add_argument("--tam", type=str, default="", help="Đường dẫn file Tạm trú")
    parser.add_argument("--batch-size", type=int, default=500, help="Kích thước mỗi lô (mặc định 500)")
    parser.add_argument("--workers", type=int, default=8, help="Số luồng song song (mặc định 8)")
    parser.add_argument("--key", type=str, default="", help="Supabase Service Role Key (nếu có)")
    args = parser.parse_args()

    service_key = args.key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or DEFAULT_SERVICE_ROLE_KEY
    endpoint = f"{SUPABASE_URL}/rest/v1/residents?on_conflict=cccd"
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
    }

    print("="*75)
    print(" HỆ THỐNG QUẢN LÝ KHU PHỐ 3 AN PHÚ - CÔNG CỤ NHẬP LIỆU SIÊU TỐC")
    print(f" Cấu hình: Batch Size = {args.batch_size} | Song song = {args.workers} luồng")
    print("="*75)

    start_total_time = time.time()

    # Tìm file Thường trú
    tt_file = args.tt or find_file([
        "D:/Download/KP3thuongtru.xlsx",
        "D:/Download/KP3thuongtru.ods",
        "KP3thuongtru.xlsx",
        "KP3thuongtru.ods"
    ])
    # Tìm file Tạm trú
    tam_file = args.tam or find_file([
        "D:/Download/KP3tamtru.xlsx",
        "D:/Download/KP3tamtru.ods",
        "KP3tamtru.xlsx",
        "KP3tamtru.ods"
    ])

    if not tt_file and not tam_file:
        print("[-] Không tìm thấy tệp dữ liệu thường trú hoặc tạm trú.")
        print("    Vui lòng truyền đối số: python fast_import_residents.py --tt <file> --tam <file>")
        sys.exit(1)

    residents_list = []
    seen_cccd = set()

    # 1. Đọc và xử lý file Thường trú
    if tt_file:
        print(f"\n[1/3] Xử lý dữ liệu Thường trú từ: {tt_file}")
        df_tt = read_file_fast(tt_file)
        df_tt['cccd_clean'] = df_tt['CCCD'].apply(clean_cccd)
        df_tt['dob_clean'] = df_tt['NGÀY THÁNG NĂM SINH'].apply(parse_dob)

        tt_count = 0
        for _, row in df_tt.iterrows():
            cccd = row['cccd_clean']
            if not cccd or cccd in seen_cccd:
                continue
            seen_cccd.add(cccd)

            full_name = clean_text(row.get('HỌ VÀ TÊN'))
            owner_name = clean_text(row.get('HỌ TÊN CHỦ HỘ'))
            relation = "Chủ hộ" if full_name == owner_name else "Thành viên hộ"
            dob = row['dob_clean']

            perm_addr = clean_text(row.get('ĐỊA CHỈ THƯỜNG TRÚ')) or "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"
            curr_addr = clean_text(row.get('CHỔ Ở HIỆN TẠI')) or perm_addr

            residents_list.append({
                'cccd': cccd,
                'full_name': full_name,
                'gender': clean_text(row.get('GIỚI TÍNH')) if row.get('GIỚI TÍNH') in ['Nam', 'Nữ'] else None,
                'birth_date': dob,
                'phone': None,
                'address': curr_addr,
                'permanent_address': perm_addr,
                'current_address': curr_addr,
                'father_name': clean_text(row.get('HỌ TÊN CHA')),
                'mother_name': clean_text(row.get('HỌ TÊN MẸ')),
                'temporary_reg_date': None,
                'temporary_exp_date': None,
                'management_status': clean_text(row.get('TÌNH TRẠNG QUẢN LÝ')),
                'household_code': clean_text(row.get('MÃ HỘ KHẨU')),
                'relation_to_owner': relation,
                'status': 'Thường trú',
                'workplace': None,
                'is_elderly': is_elderly_person(dob)
            })
            tt_count += 1
        print(f"     -> Chuẩn hóa thành công {tt_count} cư dân Thường trú")

    # 2. Đọc và xử lý file Tạm trú
    if tam_file:
        print(f"\n[2/3] Xử lý dữ liệu Tạm trú từ: {tam_file}")
        df_tam = read_file_fast(tam_file)
        df_tam['cccd_clean'] = df_tam['CCCD'].apply(clean_cccd)
        df_tam['dob_clean'] = df_tam['NGÀY THÁNG NĂM SINH'].apply(parse_dob)

        # Sắp xếp lấy dòng mới nhất nếu trùng nội bộ
        if 'STT' in df_tam.columns:
            df_tam = df_tam.sort_values(by=['STT'], ascending=False)

        tam_count = 0
        for _, row in df_tam.iterrows():
            cccd = row['cccd_clean']
            if not cccd or cccd in seen_cccd:
                continue
            seen_cccd.add(cccd)

            full_name = clean_text(row.get('HỌ VÀ TÊN'))
            owner_name = clean_text(row.get('HỌ TÊN CHỦ HỘ'))
            relation = "Người đứng tên tạm trú" if full_name == owner_name else "Thành viên tạm trú"
            dob = row['dob_clean']

            tam_addr = clean_text(row.get('ĐỊA CHỈ TẠM TRÚ')) or "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"
            perm_addr = clean_text(row.get('ĐỊA CHỈ THƯỜNG TRÚ')) or "Chưa cập nhật"

            phone = None
            if tam_addr and '(' in tam_addr and ')' in tam_addr:
                p1 = tam_addr.find('(')
                p2 = tam_addr.find(')')
                cand = tam_addr[p1+1:p2].strip().replace(" ", "")
                if cand.isdigit() and len(cand) in [10, 11]:
                    phone = cand

            residents_list.append({
                'cccd': cccd,
                'full_name': full_name,
                'gender': clean_text(row.get('GIỚI TÍNH')) if row.get('GIỚI TÍNH') in ['Nam', 'Nữ'] else None,
                'birth_date': dob,
                'phone': phone,
                'address': tam_addr,
                'permanent_address': perm_addr,
                'current_address': tam_addr,
                'father_name': None,
                'mother_name': None,
                'temporary_reg_date': clean_date_str(row.get('NGÀY ĐĂNG KÝ')),
                'temporary_exp_date': clean_date_str(row.get('NGÀY HẾT HẠN')),
                'management_status': clean_text(row.get('Unnamed: 11')),
                'household_code': None,
                'relation_to_owner': relation,
                'status': 'Tạm trú',
                'workplace': None,
                'is_elderly': is_elderly_person(dob)
            })
            tam_count += 1
        print(f"     -> Chuẩn hóa thành công {tam_count} cư dân Tạm trú")

    total_records = len(residents_list)
    print(f"\n=> TỔNG SỐ HỒ SƠ CHUẨN HÓA SẴN SÀNG: {total_records} cư dân.")

    # 3. Phân lô và nạp song song siêu tốc
    batch_size = args.batch_size
    batches = []
    for i in range(0, total_records, batch_size):
        batch_chunk = residents_list[i:i + batch_size]
        batches.append((len(batches) + 1, batch_chunk, endpoint, headers))

    print(f"\n[3/3] Đang nạp {total_records} hồ sơ vào Supabase qua {len(batches)} lô (Multi-threading x{args.workers})...")
    upload_start = time.time()
    completed_records = 0
    errors = []

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(send_batch, b): b[0] for b in batches}
        for future in as_completed(futures):
            b_idx, count, err = future.result()
            if err:
                errors.append(f"Lô {b_idx}: {err}")
                print(f"  [-] Lỗi tại lô {b_idx}: {err}")
            else:
                completed_records += count
                pct = (completed_records / total_records) * 100
                elapsed = time.time() - upload_start
                speed = completed_records / elapsed if elapsed > 0 else 0
                print(f"  [+] Đã nạp {completed_records:5d}/{total_records} ({pct:5.1f}%) | Tốc độ: {speed:5.0f} bản ghi/giây", end='\r')

    upload_time = time.time() - upload_start
    total_time = time.time() - start_total_time
    print(f"\n\n{'='*75}")
    print(f" KẾT QUẢ ĐỒNG BỘ SIÊU TỐC:")
    print(f"  * Tổng số hồ sơ đã nạp thành công: {completed_records}/{total_records}")
    print(f"  * Thời gian upload database:       {upload_time:.2f} giây ({completed_records/upload_time:.0f} hồ sơ/giây)")
    print(f"  * Tổng thời gian xử lý toàn bộ:    {total_time:.2f} giây")
    if errors:
        print(f"  * Số lô lỗi: {len(errors)}")
    else:
        print(f"  * Trạng thái: HOÀN TOÀN THÀNH CÔNG (100% OK)")
    print(f"{'='*75}\n")

if __name__ == '__main__':
    main()
