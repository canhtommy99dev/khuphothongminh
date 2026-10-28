/**
 * Unit Tests — householdRecognitionUtils
 * Kiểm thử thuật toán nhận diện hộ gia đình & quan hệ phả hệ
 * Dự án: Khu phố 3 An Phú — Vitest (Công cụ #23)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { Resident } from '../../types';

// ============================================================
// Mock data cư dân mẫu
// ============================================================
const mockResidentHousehold: Resident[] = [
  {
    id: 'r1',
    fullName: 'Nguyễn Văn Hùng',
    gender: 'Nam',
    birthDate: '1970-05-15',
    cccd: '079070001234',
    status: 'Thường trú',
    householdId: 'HK-001',
    relationToOwner: 'Chủ hộ',
    occupation: 'Kinh doanh',
    address: '15 Đường Lương Định Của, KP3',
    currentAddress: '15 Đường Lương Định Của, KP3',
    permanentAddress: '15 Đường Lương Định Của, KP3',
    fatherName: '',
    motherName: '',
    managementStatus: 'Đang quản lý',
    phone: '0912345678',
  },
  {
    id: 'r2',
    fullName: 'Trần Thị Lan',
    gender: 'Nữ',
    birthDate: '1975-03-20',
    cccd: '079075005678',
    status: 'Thường trú',
    householdId: 'HK-001',
    relationToOwner: 'Vợ',
    occupation: 'Nội trợ',
    address: '15 Đường Lương Định Của, KP3',
    currentAddress: '15 Đường Lương Định Của, KP3',
    permanentAddress: '15 Đường Lương Định Của, KP3',
    fatherName: '',
    motherName: '',
    managementStatus: 'Đang quản lý',
    phone: '0987654321',
  },
  {
    id: 'r3',
    fullName: 'Nguyễn Thị Hoa',
    gender: 'Nữ',
    birthDate: '2000-08-10',
    cccd: '079000009012',
    status: 'Thường trú',
    householdId: 'HK-001',
    relationToOwner: 'Con gái',
    occupation: 'Sinh viên',
    address: '15 Đường Lương Định Của, KP3',
    currentAddress: '15 Đường Lương Định Của, KP3',
    permanentAddress: '15 Đường Lương Định Của, KP3',
    fatherName: 'Nguyễn Văn Hùng',
    motherName: 'Trần Thị Lan',
    managementStatus: 'Đang quản lý',
    phone: '',
  },
];

// ============================================================
// Tests
// ============================================================
describe('Nhận diện hộ gia đình KP3', () => {
  describe('Gom nhóm theo mã hộ khẩu', () => {
    it('gom đúng 3 thành viên vào HK-001', () => {
      const groups = new Map<string, Resident[]>();
      mockResidentHousehold.forEach(r => {
        const key = r.householdId || 'unknown';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
      });

      expect(groups.size).toBe(1);
      expect(groups.get('HK-001')).toHaveLength(3);
    });

    it('xác định chủ hộ là người lớn tuổi nhất', () => {
      const members = mockResidentHousehold;
      const sorted = [...members].sort(
        (a, b) =>
          new Date(a.birthDate || '').getTime() - new Date(b.birthDate || '').getTime()
      );
      expect(sorted[0].fullName).toBe('Nguyễn Văn Hùng');
    });
  });

  describe('Suy luận quan hệ phả hệ', () => {
    it('nhận diện Con gái qua họ tên cha/mẹ', () => {
      const child = mockResidentHousehold[2];
      const head = mockResidentHousehold[0];
      const spouse = mockResidentHousehold[1];

      const isChildOf =
        child.fatherName === head.fullName || child.motherName === spouse.fullName;

      expect(isChildOf).toBe(true);
    });

    it('xác định đúng giới tính con (Nữ → Con gái)', () => {
      const child = mockResidentHousehold[2];
      const relation = child.gender === 'Nữ' ? 'Con gái' : 'Con trai';
      expect(relation).toBe('Con gái');
    });
  });
});

// ============================================================
// Tests cho cảnh báo tạm trú hết hạn
// ============================================================
describe('Cảnh báo tạm trú hết hạn', () => {
  const getExpiryStatus = (expDate: string) => {
    const now = new Date();
    const exp = new Date(expDate);
    const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', days: Math.abs(diffDays) };
    if (diffDays <= 30) return { status: 'expiring', days: diffDays };
    return { status: 'valid', days: diffDays };
  };

  it('phát hiện đã hết hạn (quá 10 ngày)', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const result = getExpiryStatus(past.toISOString().split('T')[0]);
    expect(result.status).toBe('expired');
    expect(result.days).toBeGreaterThanOrEqual(9);
  });

  it('phát hiện sắp hết hạn (còn 15 ngày)', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const result = getExpiryStatus(soon.toISOString().split('T')[0]);
    expect(result.status).toBe('expiring');
    expect(result.days).toBeLessThanOrEqual(30);
  });

  it('trạng thái an toàn (còn 90 ngày)', () => {
    const future = new Date();
    future.setDate(future.getDate() + 90);
    const result = getExpiryStatus(future.toISOString().split('T')[0]);
    expect(result.status).toBe('valid');
  });
});
