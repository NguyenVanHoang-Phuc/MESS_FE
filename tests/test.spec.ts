import { test, expect } from '@playwright/test'

test.describe('Smoke Test: Tổng thể Hệ thống MES (End-to-End Smoke Test)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

  test('Kiểm tra luồng chính: Landing Page -> Đăng nhập -> Chat -> Danh bạ -> Đăng xuất', async ({ page }) => {
    // 1. Vào Landing Page
    await page.goto(BASE_URL)
    await expect(page).toHaveTitle(/MES/i)

    // 2. Vào trang Đăng nhập
    await page.getByRole('link', { name: 'Đăng nhập' }).first().click()
    await expect(page).toHaveURL(/.*login/)

    // 3. Đăng nhập với userA
    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('userA')
    await page.getByLabel(/Mật khẩu/i).fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/.*chat/, { timeout: 10000 })

    // 4. Mở Tab Danh bạ
    await page.getByRole('button', { name: 'Danh bạ' }).click()
    await expect(page.getByText('Sơ đồ tổ chức')).toBeVisible()

    // 5. Đăng xuất
    await page.getByRole('button', { name: 'Đăng xuất' }).click()
    await expect(page).toHaveURL(/.*login/)
  })
})