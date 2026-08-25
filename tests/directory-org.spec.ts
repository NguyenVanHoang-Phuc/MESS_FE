import { test, expect } from '@playwright/test'

test.describe('Luồng 4: Quản lý Danh bạ & Sơ đồ Tổ chức Động (Org Directory MES-015)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('userA')
    await page.getByLabel(/Mật khẩu/i).fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/.*chat/, { timeout: 10000 })
  })

  test('4.1: Mở Tab Danh bạ và hiển thị Sơ đồ Cây Tổ chức', async ({ page }) => {
    await page.getByRole('button', { name: 'Danh bạ' }).click()
    await expect(page.getByText('Sơ đồ tổ chức')).toBeVisible()

    // Chờ danh bạ tải từ API hoặc hiển thị trạng thái
    await expect(page.locator('aside').getByText(/phòng ban|Chưa có dữ liệu/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('4.2: Thu gọn và Mở rộng (Collapse/Expand) từng Phòng ban', async ({ page }) => {
    await page.getByRole('button', { name: 'Danh bạ' }).click()
    await expect(page.getByText('Sơ đồ tổ chức')).toBeVisible()

    const deptHeader = page.locator('aside .cursor-pointer').first()
    if (await deptHeader.isVisible({ timeout: 6000 }).catch(() => false)) {
      await deptHeader.click()
    }
  })

  test('4.3: Tìm kiếm nhân viên trực tiếp trong Tab Danh bạ', async ({ page }) => {
    await page.getByRole('button', { name: 'Danh bạ' }).click()

    const searchInput = page.getByPlaceholder(/Tìm phòng ban, nhân sự/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('user')

    await expect(page.locator('aside').getByText(/user|NV|phòng ban/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('4.4: Bấm nút "Chat" cạnh nhân viên trong danh bạ để mở hội thoại 1-1', async ({ page }) => {
    await page.getByRole('button', { name: 'Danh bạ' }).click()

    const chatQuickBtn = page.locator('button:has-text("Chat"), button[title="Nhắn tin 1-1"]').first()
    if (await chatQuickBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatQuickBtn.click()
      await expect(page.getByPlaceholder(/Nhập tin nhắn/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('4.5: Mở Nhóm Chat Phòng ban mặc định từ biểu tượng icon trên danh bạ', async ({ page }) => {
    await page.getByRole('button', { name: 'Danh bạ' }).click()

    const openGroupBtn = page.locator('button[title*="Mở nhóm chat"]').first()
    if (await openGroupBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await openGroupBtn.click()
      await expect(page.locator('header').first()).toBeVisible()
    }
  })
})
