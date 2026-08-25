import { test, expect } from '@playwright/test'

test.describe('Luồng 5: Dashboard Quản trị & Điều phối Nhân sự Admin (Admin Dashboard)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('admin')
    await page.getByLabel(/Mật khẩu/i).fill('Admin@123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
  })

  test('5.1: Hiển thị Đầy đủ các Thẻ KPIs trên Dashboard Tổng quan', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'MES Admin Portal' })).toBeVisible()

    // Kiểm tra các thẻ KPI cốt lõi
    await expect(page.getByText('Tổng Nhân sự')).toBeVisible()
    await expect(page.getByText('Phòng ban').first()).toBeVisible()
    await expect(page.getByText('Nhóm Chat Tổ chức')).toBeVisible()
    await expect(page.getByText('Ca làm việc').first()).toBeVisible()
  })

  test('5.2: Quản lý Nhân sự - Tìm kiếm & Lọc danh sách nhân viên', async ({ page }) => {
    await page.getByRole('button', { name: /Quản lý Nhân sự/i }).click()

    const searchInput = page.getByPlaceholder(/Tìm theo họ tên, username/i)
    await expect(searchInput).toBeVisible()

    await searchInput.fill('admin')
    await expect(page.getByText(/Quản trị viên|admin/i).first()).toBeVisible({ timeout: 6000 })
  })

  test('5.3: Mở Modal Chỉnh sửa Phòng ban/Ca của Nhân viên', async ({ page }) => {
    await page.getByRole('button', { name: /Quản lý Nhân sự/i }).click()

    const editBtn = page.getByRole('button', { name: 'Sửa' }).first()
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click()
      await expect(page.getByRole('heading', { name: /Chỉnh sửa Tổ chức/i })).toBeVisible()
      await page.getByRole('button', { name: 'Hủy' }).click()
    }
  })

  test('5.4: Mở Modal Tạo Phòng ban Mới', async ({ page }) => {
    await page.getByRole('button', { name: /Cơ cấu Phòng ban/i }).click()

    const addDeptBtn = page.getByRole('button', { name: /Thêm phòng ban mới/i })
    await expect(addDeptBtn).toBeVisible()
    await addDeptBtn.click()

    await expect(page.getByRole('heading', { name: 'Thêm Phòng ban Mới' })).toBeVisible()
    await page.getByRole('button', { name: 'Hủy' }).click()
  })

  test('5.5: Mở Modal Tạo Ca Làm Việc Mới', async ({ page }) => {
    await page.getByRole('button', { name: /Ca làm việc/i }).click()

    const addShiftBtn = page.getByRole('button', { name: /Thêm ca làm việc/i })
    await expect(addShiftBtn).toBeVisible()
    await addShiftBtn.click()

    await expect(page.getByRole('heading', { name: 'Thêm Ca Làm Việc Mới' })).toBeVisible()
    await page.getByRole('button', { name: 'Hủy' }).click()
  })

  test('5.6: Kích hoạt nút "Đồng bộ nhóm chat" (Sync Org Groups)', async ({ page }) => {
    const syncBtn = page.getByRole('button', { name: /Đồng bộ nhóm chat|Đang đồng bộ/i })
    await expect(syncBtn).toBeVisible()
    await syncBtn.click()

    await expect(page.locator('.bg-emerald-500\\/10').or(page.getByText(/thành công/i)).first()).toBeVisible({ timeout: 10000 })
  })

  test('5.7: Chuyển đổi qua lại giữa Dashboard Admin và Ứng dụng Chat', async ({ page }) => {
    await page.getByRole('link', { name: /Mở Ứng dụng Chat/i }).click()
    await expect(page).toHaveURL(/.*chat/, { timeout: 10000 })

    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'MES Admin Portal' })).toBeVisible()
  })

  test('5.8: Đăng xuất khỏi Dashboard Admin -> Chuyển về trang Đăng nhập', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /Đăng xuất/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    await expect(page).toHaveURL(/.*login/, { timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible()
  })
})
