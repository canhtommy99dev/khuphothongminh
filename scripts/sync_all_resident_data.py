import os
import sys
import json
import urllib.request
import urllib.error
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://wjdgaobhipkgzveidtra.supabase.co"
SERVICE_ROLE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZGdhb2JoaXBrZ3p2ZWlkdHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg1OTQzNCwiZXhwIjoyMTA3NDM1NDM0fQ."
    "qlheohPPyspOM0ezFa-wr_D6vIQNrAFrmaPpSD_v_zo"
)

def clean_cccd(val):
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
    """Chuẩn hóa ngày sang định dạng chuỗi hiển thị DD/MM/YYYY hoặc chuỗi sạch"""
    if pd.isna(v) or v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() == 'nan':
        return None
    # Nếu là timestamp ISO '2028-08-07 00:00:00'
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

def read_data_file(base_path):
    if os.path.exists(f"{base_path}.xlsx"):
        return pd.read_excel(f"{base_path}.xlsx")
    elif os.path.exists(f"{base_path}.ods"):
        return pd.read_excel(f"{base_path}.ods", engine='odf')
    raise FileNotFoundError(f"Không tìm thấy {base_path}.xlsx hoặc {base_path}.ods")

print("1. ĐỌC DỮ LIỆU TỪ 2 FILE...")
df_tt = read_data_file("D:/Download/KP3thuongtru")
df_tam = read_data_file("D:/Download/KP3tamtru")

print(f"  - Thường trú: {len(df_tt)} dòng")
print(f"  - Tạm trú: {len(df_tam)} dòng")

df_tt['cccd_clean'] = df_tt['CCCD'].apply(clean_cccd)
df_tt['dob_clean'] = df_tt['NGÀY THÁNG NĂM SINH'].apply(parse_dob)

df_tam['cccd_clean'] = df_tam['CCCD'].apply(clean_cccd)
df_tam['dob_clean'] = df_tam['NGÀY THÁNG NĂM SINH'].apply(parse_dob)

residents_to_sync = []
seen_cccd = set()

# 2. XỬ LÝ CƯ DÂN THƯỜNG TRÚ
print("\n2. XỬ LÝ DỮ LIỆU THƯỜNG TRÚ...")
for _, row in df_tt.iterrows():
    cccd = row['cccd_clean']
    if not cccd or cccd in seen_cccd:
        continue
    seen_cccd.add(cccd)

    full_name = clean_text(row['HỌ VÀ TÊN'])
    owner_name = clean_text(row.get('HỌ TÊN CHỦ HỘ'))
    relation = "Chủ hộ" if full_name == owner_name else "Thành viên hộ"
    dob = row['dob_clean']

    # Cột H: ĐỊA CHỈ THƯỜNG TRÚ
    perm_addr = clean_text(row.get('ĐỊA CHỈ THƯỜNG TRÚ')) or "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"
    # Cột J: CHỔ Ở HIỆN TẠI
    curr_addr = clean_text(row.get('CHỔ Ở HIỆN TẠI')) or perm_addr

    father_name = clean_text(row.get('HỌ TÊN CHA'))
    mother_name = clean_text(row.get('HỌ TÊN MẸ'))
    mgmt_status = clean_text(row.get('TÌNH TRẠNG QUẢN LÝ'))

    residents_to_sync.append({
        'cccd': cccd,
        'full_name': full_name,
        'gender': clean_text(row.get('GIỚI TÍNH')) if row.get('GIỚI TÍNH') in ['Nam', 'Nữ'] else None,
        'birth_date': dob,
        'phone': None,
        'address': curr_addr,
        'permanent_address': perm_addr,
        'current_address': curr_addr,
        'father_name': father_name,
        'mother_name': mother_name,
        'temporary_reg_date': None,
        'temporary_exp_date': None,
        'management_status': mgmt_status,
        'household_code': clean_text(row.get('MÃ HỘ KHẨU')),
        'relation_to_owner': relation,
        'status': 'Thường trú',
        'workplace': None,
        'is_elderly': is_elderly_person(dob)
    })

print(f"  ✓ Đã chuẩn bị {len(residents_to_sync)} cư dân Thường trú.")

# 3. XỬ LÝ CƯ DÂN TẠM TRÚ
print("\n3. XỬ LÝ DỮ LIỆU TẠM TRÚ...")
df_tam_sorted = df_tam.sort_values(by=['STT'], ascending=False)
tam_count = 0

for _, row in df_tam_sorted.iterrows():
    cccd = row['cccd_clean']
    if not cccd or cccd in seen_cccd:
        continue
    seen_cccd.add(cccd)

    full_name = clean_text(row['HỌ VÀ TÊN'])
    owner_name = clean_text(row.get('HỌ TÊN CHỦ HỘ'))
    relation = "Người đứng tên tạm trú" if full_name == owner_name else "Thành viên tạm trú"
    dob = row['dob_clean']

    # Cột G: ĐỊA CHỈ TẠM TRÚ (nơi ở hiện tại / tạm trú KP3)
    tam_addr = clean_text(row.get('ĐỊA CHỈ TẠM TRÚ')) or "Khu phố 3, Phường An Phú, TP. Hồ Chí Minh"
    # Cột J: ĐỊA CHỈ THƯỜNG TRÚ (địa chỉ quê quán / thường trú gốc)
    perm_addr = clean_text(row.get('ĐỊA CHỈ THƯỜNG TRÚ')) or "Chưa cập nhật"

    reg_date = clean_date_str(row.get('NGÀY ĐĂNG KÝ'))
    exp_date = clean_date_str(row.get('NGÀY HẾT HẠN'))
    mgmt_status = clean_text(row.get('Unnamed: 11'))

    # Tách SĐT chủ trọ nếu có
    phone = None
    if tam_addr and '(' in tam_addr and ')' in tam_addr:
        p_start = tam_addr.find('(')
        p_end = tam_addr.find(')')
        possible_phone = tam_addr[p_start+1:p_end].strip()
        if possible_phone.isdigit() and len(possible_phone) in [10, 11]:
            phone = possible_phone

    residents_to_sync.append({
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
        'temporary_reg_date': reg_date,
        'temporary_exp_date': exp_date,
        'management_status': mgmt_status,
        'household_code': None,
        'relation_to_owner': relation,
        'status': 'Tạm trú',
        'workplace': None,
        'is_elderly': is_elderly_person(dob)
    })
    tam_count += 1

print(f"  ✓ Đã chuẩn bị {tam_count} cư dân Tạm trú.")
print(f"  => Tổng cộng sẽ đồng bộ: {len(residents_to_sync)} cư dân vào Supabase.")

# 4. THỰC HIỆN BATCH UPSERT VÀO SUPABASE
print("\n4. BẮT ĐẦU ĐỒNG BỘ VÀO SUPABASE THEO TỪNG LÔ...")
BATCH_SIZE = 300
total = len(residents_to_sync)
inserted = 0

endpoint = f"{SUPABASE_URL}/rest/v1/residents?on_conflict=cccd"
headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal'
}

for i in range(0, total, BATCH_SIZE):
    batch = residents_to_sync[i:i + BATCH_SIZE]
    data_bytes = json.dumps(batch, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(endpoint, data=data_bytes, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in [200, 201, 204]:
                inserted += len(batch)
                pct = (inserted / total) * 100
                print(f"  [+] Đã đồng bộ {inserted:5d}/{total} hồ sơ ({pct:5.1f}%)")
            else:
                print(f"  [-] HTTP status {resp.status} tại batch {i}")
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8')
        print(f"  [!] HTTP Error {e.code} tại batch {i}: {err[:400]}")
        sys.exit(1)

print("\n" + "="*70)
print(f"HOÀN TẤT ĐỒNG BỘ THÀNH CÔNG {inserted} CƯ DÂN VÀO DATABASE SUPABASE!")
print("="*70)
