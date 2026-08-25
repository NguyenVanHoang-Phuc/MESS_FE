import { test, expect } from '@playwright/test'

test.describe('Luồng 6: Giả lập Đẩy Thông Báo Ca Học Zalo OA (Zalo Simulator Flow)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('admin')
    await page.getByLabel(/Mật khẩu/i).fill('Admin@123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
  })

  test('6.1: Mở Modal Đẩy Thông Báo Zalo OA từ Dashboard', async ({ page }) => {
    const zaloBtn = page.getByRole('button', { name: /Gửi Zalo OA|Zalo OA/i }).first()
    await expect(zaloBtn).toBeVisible()
    await zaloBtn.click()

    await expect(page.getByRole('heading', { name: /Đẩy Thông Báo Ca Học Qua Zalo OA/i })).toBeVisible()
    await expect(page.getByText('Simulator 100% Free')).toBeVisible()
  })

  test('6.2: Chọn khách hàng và điền thông tin ca học -> Mở Phone Simulator', async ({ page }) => {
    const zaloBtn = page.getByRole('button', { name: /Gửi Zalo OA|Zalo OA/i }).first()
    await zaloBtn.click()

    await expect(page.getByRole('heading', { name: /Đẩy Thông Báo Ca Học Qua Zalo OA/i })).toBeVisible()

    // Bấm Gửi thông báo Zalo OA
    const sendBtn = page.getByRole('button', { name: /Đẩy thông báo Zalo OA/i })
    await expect(sendBtn).toBeEnabled({ timeout: 5000 })
    await sendBtn.click()

    // Kỳ vọng Widget Mô Phỏng Điện Thoại Zalo xuất hiện
    await expect(page.getByText('Zalo Simulator Hub')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Trung Tâm MES OA')).toBeVisible()
    await expect(page.getByRole('link', { name: /Vào Lớp Học Ngay/i })).toBeVisible()
  })

  test('6.3: Chuyển đổi giữa Màn hình khóa và Trong App Zalo trên Phone Simulator', async ({ page }) => {
    const zaloBtn = page.getByRole('button', { name: /Gửi Zalo OA|Zalo OA/i }).first()
    await zaloBtn.click()

    const sendBtn = page.getByRole('button', { name: /Đẩy thông báo Zalo OA/i })
    await expect(sendBtn).toBeEnabled({ timeout: 5000 })
    await sendBtn.click()

    await expect(page.getByText('Zalo Simulator Hub')).toBeVisible({ timeout: 10000 })

    // Chuyển sang Màn hình khóa (Lock Screen)
    await page.getByRole('button', { name: 'Màn hình khóa' }).click()
    await expect(page.getByText(/Chạm vào thông báo để mở Zalo/i)).toBeVisible()

    // Chạm vào thông báo để quay lại trong App Zalo
    await page.getByText('Trung Tâm Đào Tạo MES').first().click()
    await expect(page.getByText(/ZNS Verified|Doanh nghiệp xác thực/i).first()).toBeVisible()
  })
})
