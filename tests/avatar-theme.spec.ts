import { test, expect } from '@playwright/test'

test.describe('Luồng 7: Thiết lập Avatar & Giao diện (Avatar & Theme Settings)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

  test.beforeEach(async ({ page }) => {
    // Đăng nhập bằng tài khoản userA
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('userA')
    await page.getByLabel(/Mật khẩu/i).fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/.*chat/, { timeout: 10000 })
  })

  test('7.1: Mở Modal Cài đặt & Chọn Avatar Gradient / Emoji', async ({ page }) => {
    // Click vào Avatar / Hồ sơ ở góc dưới thanh Sidebar
    const profileBtn = page.getByTitle(/Nhấn để đổi Ảnh đại diện/i)
    await expect(profileBtn).toBeVisible({ timeout: 5000 })
    await profileBtn.click()

    // Kiểm tra Modal Cài đặt mở ra
    const modalTitle = page.getByText(/Cài đặt & Tùy chỉnh/i)
    await expect(modalTitle).toBeVisible({ timeout: 5000 })

    // Kiểm tra Tab Ảnh đại diện hiển thị
    await expect(page.getByText(/Bộ sưu tập Avatar Màu sắc Gradient/i)).toBeVisible()
    await expect(page.getByText(/Biểu tượng 3D Emoji/i)).toBeVisible()

    // Chọn một biểu tượng Emoji (ví dụ 🚀)
    const rocketEmojiBtn = page.getByRole('button', { name: '🚀' })
    if (await rocketEmojiBtn.isVisible().catch(() => false)) {
      await rocketEmojiBtn.click()
    }

    // Nhấn Lưu thay đổi
    const saveBtn = page.getByRole('button', { name: /Lưu thay đổi/i })
    await saveBtn.click()

    // Kiểm tra thông báo thành công
    await expect(page.getByText(/Đã lưu cài đặt và cập nhật ảnh đại diện thành công/i)).toBeVisible({ timeout: 5000 })

    // Đóng modal
    await page.getByLabel('Đóng', { exact: true }).click()
    await expect(modalTitle).not.toBeVisible()
  })

  test('7.2: Chuyển đổi Giao diện Sáng / Tối (Light / Dark Theme)', async ({ page }) => {
    // Click vào nút Palette cài đặt Theme
    const themeBtn = page.getByTitle(/Cài đặt Giao diện & Tông màu/i).first()
    await expect(themeBtn).toBeVisible({ timeout: 5000 })
    await themeBtn.click()

    // Kiểm tra Tab Giao diện mở ra
    await expect(page.getByText(/Chế độ hiển thị/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Chế độ Tối/i)).toBeVisible()
    await expect(page.getByText(/Chế độ Sáng/i)).toBeVisible()

    // Chọn Chế độ Tối
    const darkModeBtn = page.locator('button:has-text("Chế độ Tối")')
    await darkModeBtn.click()

    // Kiểm tra thẻ html có class 'dark'
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(isDark).toBe(true)

    // Chọn Chế độ Sáng
    const lightModeBtn = page.locator('button:has-text("Chế độ Sáng")')
    await lightModeBtn.click()

    const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'))
    expect(isLight).toBe(true)

    // Đóng modal
    await page.getByLabel('Đóng', { exact: true }).click()
  })

  test('7.3: Nút chuyển đổi nhanh Dark/Light Mode trên Chat Header', async ({ page }) => {
    const quickThemeBtn = page.getByLabel(/Chuyển đổi giao diện Sáng \/ Tối|Đổi chế độ Sáng \/ Tối/i).first()
    if (await quickThemeBtn.isVisible().catch(() => false)) {
      const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      await quickThemeBtn.click()
      const toggledDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      expect(toggledDark).toBe(!initialDark)
    }
  })
})
