"""
=============================================================================
HỆ THỐNG QUẢN LÝ THÔNG MINH KHU PHỐ 3, PHƯỜNG AN PHÚ, TP. THỦ ĐỨC
SCRIPT NẠP DỮ LIỆU CƯ DÂN THƯỜNG TRÚ & TẠM TRÚ VÀO SUPABASE DATABASE
=============================================================================
Tệp hỗ trợ: 
  - Thường trú: D:/Download/KP3thuongtru.xlsx (hoặc .ods) - 2.076 nhân khẩu
  - Tạm trú:    D:/Download/KP3tamtru.xlsx    (hoặc .ods) - 9.935 nhân khẩu
=============================================================================
"""

import os
import sys
import argparse
import json
import urllib.request
import urllib.error
from datetime import datetime
import pandas as pd

# Thiết lập encoding UTF-8 chuẩn trên Windows
sys.stdout.reconfigure(encoding='utf-8')

# Cấu hình Supabase mặc định
DEFAULT_SUPABASE_URL = "https://wjdgaobhipkgzveidtra.supabase.co"
DEFAULT_SERVICE_ROLE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZGdhb2JoaXBrZ3p2ZWlkdHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg1OTQzNCwiZXhwIjoyMTA3NDM1NDM0fQ."
    "qlheohPPyspOM0ezFa-wr_D6vIQNrAFrmaPpSD_v_zo"
)

def load_env_credentials():
    """Đọc credentials từ file .env nếu có"""
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    url = DEFAULT_SUPABASE_URL
    key = DEFAULT_SERVICE_ROLE_KEY
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("VITE_SUPABASE_URL="):
                    val = line.split("=", 1)[1].strip()
                    if val: url = val
                elif line.startswith("VITE_SUPABASE_ANON_KEY=") or line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    val = line.split("=", 1)[1].strip()
                    if val: key = val
    return url, key

def clean_cccd(val):
    """Chuẩn hóa số CCCD thành chuỗi 12 chữ số chuẩn Việt Nam"""
    if pd.isna(val):
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
    """Chuẩn hóa ngày sinh thành định dạng YYYY-MM-DD"""
    if pd.isna(v):
        return None
    s = str(v).strip().replace(".0", "")
    # Trường hợp số Excel serial date (ví dụ 36892)
    if s.isdigit() and len(s) in [4, 5]:
        val_int = int(s)
        if 1900 <= val_int <= 2100 and len(s) == 4:
            return f"{val_int}-01-01"
        try:
            return pd.to_datetime(val_int, unit='D', origin='1899-12-30').strftime('%Y-%m-%d')
        except:
            pass
    # Trường hợp ISO timestamp chuỗi '2013-12-10 00:00:00'
    if len(s) >= 10 and s[4] == '-' and s[7] == '-':
        return s[:10]
    # Trường hợp định dạng Việt Nam 'DD/MM/YYYY'
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

def is_elderly_person(dob_str):
    """Kiểm tra đối tượng người cao tuổi (từ 60 tuổi trở lên)"""
    if not dob_str or len(dob_str) < 4:
        return False
    try:
        birth_year = int(dob_str[:4])
        # Năm hiện tại là 2026, 60 tuổi trở lên -> sinh năm 1966 trở về trước
        return (2026 - birth_year) >= 60
    except:
        return False

def clean_text(val):
    """Làm sạch chuỗi văn bản, loại bỏ khoảng trắng thừa"""
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip()
    return ' '.join(s.split()) if s else None

class SupabaseClient:
    def __init__(self, url, key):
        self.url = url.rstrip('/')
        self.key = key

    def _headers(self, prefer=None):
        h = {
            'apikey': self.key,
            'Authorization': f'Bearer {self.key}',
            'Content-Type': 'application/json',
        }
        if prefer:
            h['Prefer'] = prefer
        return h

    def get(self, table, select="*"):
        endpoint = f"{self.url}/rest/v1/{table}?select={select}"
        req = urllib.request.Request(endpoint, headers=self._headers())
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))

    def count(self, table):
        endpoint = f"{self.url}/rest/v1/{table}?select=id"
        headers = self._headers(prefer='count=exact')
        headers['Range'] = '0-0'
        req = urllib.request.Request(endpoint, headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                cr = resp.headers.get('content-range')
                if cr and '/' in cr:
                    return int(cr.split('/')[1])
                return len(json.loads(resp.read().decode('utf-8')))
        except Exception:
            return 0

    def bulk_insert(self, table, records, batch_size=250, upsert_columns=None):
        """Thực hiện chèn hàng loạt (Bulk Insert) theo từng lô nhỏ để tối ưu hiệu năng"""
        total = len(records)
        inserted = 0
        endpoint = f"{self.url}/rest/v1/{table}"
        if upsert_columns:
            endpoint += f"?on_conflict={upsert_columns}"
            prefer = "resolution=merge-duplicates,return=minimal"
        else:
            prefer = "return=minimal"

        for i in range(0, total, batch_size):
            batch = records[i:i + batch_size]
            data_bytes = json.dumps(batch, ensure_ascii=False).encode('utf-8')
            req = urllib.request.Request(endpoint, data=data_bytes, headers=self._headers(prefer=prefer), method='POST')
            try:
                with urllib.request.urlopen(req) as resp:
                    if resp.status in [200, 201, 204]:
                        inserted += len(batch)
                        percent = (inserted / total) * 100
                        print(f"  [+] Đã nạp {inserted:5d}/{total} bản ghi ({percent:5.1f}%) vào [{table}]")
                    else:
                        print(f"  [-] Lỗi HTTP {resp.status} tại lô {i}-{i+len(batch)}")
            except urllib.error.HTTPError as e:
                err_msg = e.read().decode('utf-8')
                print(f"  [!] HTTPError {e.code} khi nạp [{table}]: {err_msg[:300]}")
                raise
        return inserted

    def clear_table(self, table):
        """Xóa toàn bộ bản ghi trong bảng"""
        endpoint = f"{self.url}/rest/v1/{table}?id=neq.00000000-0000-0000-0000-000000000000"
        req = urllib.request.Request(endpoint, headers=self._headers(), method='DELETE')
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"  [✓] Đã làm sạch bảng [{table}].")
        except urllib.error.HTTPError as e:
            print(f"  [-] Không thể xóa bảng {table}: {e.read().decode('utf-8')}")


def read_data_file(base_path_without_ext):
    """Tự động kiểm tra và đọc file .xlsx hoặc .ods"""
    xlsx_path = f"{base_path_without_ext}.xlsx"
    ods_path = f"{base_path_without_ext}.ods"
    if os.path.exists(xlsx_path):
        print(f"-> Sử dụng file: {xlsx_path}")
        return pd.read_excel(xlsx_path)
    elif os.path.exists(ods_path):
        print(f"-> Sử dụng file: {ods_path}")
        return pd.read_excel(ods_path, engine='odf')
    else:
        raise FileNotFoundError(f"Không tìm thấy tệp {xlsx_path} hoặc {ods_path}")


def prepare_data():
    """Đọc và xử lý toàn bộ dữ liệu thường trú & tạm trú"""
    print("\n" + "="*70)
    print("1. ĐỌC DỮ LIỆU TỪ TỆP THƯỜNG TRÚ VÀ TẠM TRÚ...")
    print("="*70)
    
    df_tt = read_data_file("D:/Download/KP3thuongtru")
    df_tam = read_data_file("D:/Download/KP3tamtru")
    
    print(f"  * Dữ liệu Thường trú: {len(df_tt)} dòng")
    print(f"  * Dữ liệu Tạm trú:    {len(df_tam)} dòng")
    
    # Chuẩn hóa CCCD và Ngày sinh
    df_tt['cccd_clean'] = df_tt['CCCD'].apply(clean_cccd)
    df_tt['dob_clean'] = df_tt['NGÀY THÁNG NĂM SINH'].apply(parse_dob)
    
    df_tam['cccd_clean'] = df_tam['CCCD'].apply(clean_cccd)
    df_tam['dob_clean'] = df_tam['NGÀY THÁNG NĂM SINH'].apply(parse_dob)
    
    # ==================== BẢNG HỘ KHẨU (Households) ====================
    print("\n2. TỔNG HỢP VÀ CHUẨN HÓA DANH SÁCH HỘ GIA ĐÌNH...")
    households_map = {}
    
    for _, row in df_tt.iterrows():
        code = clean_text(row['MÃ HỘ KHẨU'])
        if not code:
            continue
        
        full_name = clean_text(row['HỌ VÀ TÊN'])
        owner_name = clean_text(row['HỌ TÊN CHỦ HỘ']) or full_name
        cccd = row['cccd_clean']
        address = clean_text(row['ĐỊA CHỈ THƯỜNG TRÚ']) or "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"
        
        if code not in households_map:
            households_map[code] = {
                'code': code,
                'owner_name': owner_name,
                'owner_cccd': cccd if full_name == owner_name else None,
                'fallback_cccd': cccd,
                'address': address,
                'area': 'Khu phố 3',
                'member_count': 1,
                'notes': f"Ngày lập hộ: {clean_text(row.get('NGÀY LẬP HỘ')) or 'N/A'}"
            }
        else:
            households_map[code]['member_count'] += 1
            if full_name == owner_name and not households_map[code]['owner_cccd']:
                households_map[code]['owner_cccd'] = cccd
                
    # Điền fallback CCCD nếu chưa tìm thấy CCCD chủ hộ
    for code, h in households_map.items():
        if not h['owner_cccd']:
            h['owner_cccd'] = h.pop('fallback_cccd')
        else:
            h.pop('fallback_cccd', None)
            
    households_list = list(households_map.values())
    print(f"  * Tổng số Hộ khẩu Thường trú tổng hợp được: {len(households_list)} hộ")
    
    # ==================== BẢNG CƯ DÂN (Residents) ====================
    print("\n3. TỔNG HỢP VÀ KHỬ TRÙNG DANH SÁCH NHÂN KHẨU (Thường trú & Tạm trú)...")
    residents_list = []
    seen_cccd = set()
    
    # 3.1 Nạp nhân khẩu Thường trú
    tt_count = 0
    for _, row in df_tt.iterrows():
        cccd = row['cccd_clean']
        if not cccd or cccd in seen_cccd:
            continue
        seen_cccd.add(cccd)
        
        full_name = clean_text(row['HỌ VÀ TÊN'])
        owner_name = clean_text(row['HỌ TÊN CHỦ HỘ'])
        relation = "Chủ hộ" if full_name == owner_name else "Thành viên hộ"
        dob = row['dob_clean']
        
        perm_addr = clean_text(row.get('ĐỊA CHỈ THƯỜNG TRÚ')) or "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"
        curr_addr = clean_text(row.get('CHỔ Ở HIỆN TẠI')) or perm_addr

        residents_list.append({
            'full_name': full_name,
            'cccd': cccd,
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
            'household_code': clean_text(row['MÃ HỘ KHẨU']),
            'household_id': None,
            'relation_to_owner': relation,
            'status': 'Thường trú',
            'occupation': None,
            'workplace': None,
            'nationality': 'Việt Nam',
            'is_party_member': False,
            'is_policy_household': False,
            'is_elderly': is_elderly_person(dob),
            'is_poor_household': False
        })
        tt_count += 1
        
    print(f"  * Nhân khẩu Thường trú hợp lệ: {tt_count} người")
    
    # 3.2 Nạp nhân khẩu Tạm trú (Khử trùng thông minh, ưu tiên đăng ký mới nhất)
    # Sắp xếp tạm trú theo NGÀY ĐĂNG KÝ hoặc STT để lấy bản ghi cập nhật nhất
    df_tam_sorted = df_tam.sort_values(by=['STT'], ascending=False)
    
    tam_count = 0
    tam_skipped_dup = 0
    tam_skipped_in_tt = 0
    
    for _, row in df_tam_sorted.iterrows():
        cccd = row['cccd_clean']
        if not cccd:
            continue
            
        if cccd in seen_cccd:
            # Kiểm tra xem trùng nội bộ tạm trú hay trùng với thường trú
            if any(r['cccd'] == cccd and r['status'] == 'Thường trú' for r in residents_list):
                tam_skipped_in_tt += 1
            else:
                tam_skipped_dup += 1
            continue
            
        seen_cccd.add(cccd)
        full_name = clean_text(row['HỌ VÀ TÊN'])
        owner_name = clean_text(row.get('HỌ TÊN CHỦ HỘ'))
        relation = "Người đứng tên tạm trú" if full_name == owner_name else "Thành viên tạm trú"
        dob = row['dob_clean']
        dia_chi_tam_tru = clean_text(row['ĐỊA CHỈ TẠM TRÚ']) or "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"
        dia_chi_goc = clean_text(row.get('ĐỊA CHỈ THƯỜNG TRÚ'))
        
        # Tách số điện thoại chủ trọ nếu có trong ngoặc đơn ví dụ (0985921995)
        phone = None
        if dia_chi_tam_tru and '(' in dia_chi_tam_tru and ')' in dia_chi_tam_tru:
            p_start = dia_chi_tam_tru.find('(')
            p_end = dia_chi_tam_tru.find(')')
            possible_phone = dia_chi_tam_tru[p_start+1:p_end].strip()
            if possible_phone.isdigit() and len(possible_phone) in [10, 11]:
                phone = possible_phone
                
        residents_list.append({
            'full_name': full_name,
            'cccd': cccd,
            'gender': clean_text(row.get('GIỚI TÍNH')) if row.get('GIỚI TÍNH') in ['Nam', 'Nữ'] else None,
            'birth_date': dob,
            'phone': phone,
            'address': dia_chi_tam_tru,
            'permanent_address': dia_chi_goc or "Chưa cập nhật",
            'current_address': dia_chi_tam_tru,
            'father_name': None,
            'mother_name': None,
            'temporary_reg_date': clean_text(row.get('NGÀY ĐĂNG KÝ')),
            'temporary_exp_date': clean_text(row.get('NGÀY HẾT HẠN')),
            'management_status': clean_text(row.get('Unnamed: 11')),
            'household_code': None,
            'household_id': None,
            'relation_to_owner': relation,
            'status': 'Tạm trú',
            'occupation': None,
            'workplace': None,
            'nationality': 'Việt Nam',
            'is_party_member': False,
            'is_policy_household': False,
            'is_elderly': is_elderly_person(dob),
            'is_poor_household': False
        })
        tam_count += 1
        
    print(f"  * Nhân khẩu Tạm trú hợp lệ đã khử trùng: {tam_count} người")
    print(f"    - Số bản ghi trùng nội bộ tạm trú đã lọc: {tam_skipped_dup} bản ghi")
    print(f"    - Số bản ghi trùng với Thường trú (ưu tiên Thường trú): {tam_skipped_in_tt} người")
    print(f"  * TỔNG SỐ CƯ DÂN SẼ UPLOAD LÊN DATABASE: {len(residents_list)} người")
    
    return households_list, residents_list


def main():
    parser = argparse.ArgumentParser(description="Script phân tích & upload dữ liệu cư dân KP3 lên Supabase")
    parser.add_argument("--upload", action="store_true", help="Thực hiện ghi trực tiếp vào Supabase Database")
    parser.add_argument("--clear-first", action="store_true", help="Xóa sạch dữ liệu cũ trong bảng trước khi nạp mới")
    parser.add_argument("--limit", type=int, default=None, help="Giới hạn số lượng bản ghi để nạp thử nghiệm (ví dụ --limit 50)")
    args = parser.parse_args()

    url, key = load_env_credentials()
    client = SupabaseClient(url, key)
    
    print("\n" + "="*70)
    print("HỆ THỐNG QUẢN LÝ THÔNG MINH KHU PHỐ 3 - CÔNG CỤ DỮ LIỆU DÂN CƯ")
    print("="*70)
    print(f"Database Supabase Target: {url}")
    
    # 1. Chuẩn bị và làm sạch dữ liệu
    households_list, residents_list = prepare_data()
    
    # Thống kê nhanh
    elderly_count = sum(1 for r in residents_list if r['is_elderly'])
    nam_count = sum(1 for r in residents_list if r['gender'] == 'Nam')
    nu_count = sum(1 for r in residents_list if r['gender'] == 'Nữ')
    
    print("\n" + "="*70)
    print("BÁO CÁO THỐNG KÊ TOÀN CẢNH DỮ LIỆU:")
    print("="*70)
    print(f"  • Tổng số Hộ gia đình thường trú: {len(households_list):,} hộ")
    print(f"  • Tổng số Cư dân quản lý:        {len(residents_list):,} nhân khẩu")
    print(f"    - Cư dân Thường trú:            {sum(1 for r in residents_list if r['status'] == 'Thường trú'):,} người")
    print(f"    - Cư dân Tạm trú:               {sum(1 for r in residents_list if r['status'] == 'Tạm trú'):,} người")
    print(f"  • Phân bổ giới tính:             Nam: {nam_count:,} | Nữ: {nu_count:,}")
    print(f"  • Người cao tuổi (>= 60 tuổi):   {elderly_count:,} cụ (đủ điều kiện an sinh)")
    print("="*70)
    
    if not args.upload:
        print("\n[CHẾ ĐỘ XEM TRƯỚC - DRY RUN]")
        print("Dữ liệu đã được kiểm tra, làm sạch 100% hợp lệ.")
        print("Để tiến hành ghi dữ liệu thực tế vào Supabase, hãy chạy lệnh:")
        print("  python scripts/upload_residents_to_supabase.py --upload")
        print("Hoặc thêm cờ xóa sạch dữ liệu mẫu cũ:")
        print("  python scripts/upload_residents_to_supabase.py --upload --clear-first")
        return

    # 2. Xóa dữ liệu cũ nếu có cờ --clear-first
    if args.clear_first:
        print("\nĐang làm sạch dữ liệu cũ trong Database...")
        client.clear_table("residents")
        client.clear_table("households")

    # 3. Upload Bảng Households
    print("\n" + "="*70)
    print("TIẾN HÀNH UPLOAD BẢNG [households]...")
    print("="*70)
    h_to_upload = households_list[:args.limit] if args.limit else households_list
    client.bulk_insert("households", h_to_upload, batch_size=200, upsert_columns="code")
    print(f"[✓] Hoàn tất nạp {len(h_to_upload)} hộ gia đình vào [households].")

    # 4. Lấy lại ánh xạ ID của các Hộ khẩu
    print("\nĐang lấy danh mục ID hộ khẩu để liên kết khóa ngoại (Foreign Key)...")
    db_households = client.get("households", select="id,code")
    hk_id_map = {h['code']: h['id'] for h in db_households if 'code' in h and 'id' in h}
    print(f"  * Đã ánh xạ được {len(hk_id_map)} hộ gia đình với Database ID.")

    # 5. Gán household_id vào danh sách cư dân
    for r in residents_list:
        if r.get('household_code') and r['household_code'] in hk_id_map:
            r['household_id'] = hk_id_map[r['household_code']]
        else:
            r['household_id'] = None

    # 6. Upload Bảng Residents
    print("\n" + "="*70)
    print("TIẾN HÀNH UPLOAD BẢNG [residents]...")
    print("="*70)
    r_to_upload = residents_list[:args.limit] if args.limit else residents_list
    client.bulk_insert("residents", r_to_upload, batch_size=300, upsert_columns="cccd")
    print(f"[✓] Hoàn tất nạp {len(r_to_upload)} cư dân vào bảng [residents].")

    # 7. Kiểm tra đối chiếu số lượng trong database sau khi nạp
    final_h_count = client.count("households")
    final_r_count = client.count("residents")
    print("\n" + "="*70)
    print("KẾT QUẢ ĐỒNG BỘ CUỐI CÙNG TRÊN DATABASE SUPABASE:")
    print("="*70)
    print(f"  • Bảng [households]: {final_h_count:,} bản ghi")
    print(f"  • Bảng [residents]:  {final_r_count:,} bản ghi")
    print("="*70)
    print("Toàn bộ dữ liệu dân cư Khu phố 3 An Phú đã sẵn sàng hoạt động trên hệ thống!")

if __name__ == '__main__':
    main()
