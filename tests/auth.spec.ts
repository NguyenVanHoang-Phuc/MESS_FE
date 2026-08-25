import { test, expect } from '@playwright/test'

test.describe('Luồng 1: Xác thực & Phân quyền Điều hướng (Auth & Role Routing)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
  })

  test('1.1: Truy cập Landing Page và điều hướng sang trang Đăng nhập', async ({ page }) => {
    await expect(page).toHaveTitle(/MES/i)
    await expect(page.getByRole('heading', { name: /Nền Tảng Nhắn Tin & Quản Trị/i })).toBeVisible()

    await page.getByRole('link', { name: 'Đăng nhập' }).first().click()
    await expect(page).toHaveURL(/.*login/)
    await expect(page.getByRole('heading', { name: 'Đăng nhập vào MES' })).toBeVisible()
  })

  test('1.2: Đăng nhập bằng tài khoản User thông thường (userA) -> Chuyển hướng vào /chat', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('userA')
    await page.getByLabel(/Mật khẩu/i).fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await expect(page).toHaveURL(/.*chat/, { timeout: 10000 })
    await expect(page.getByText('Nguyễn Văn A').first()).toBeVisible()
  })

  test('1.3: Đăng nhập bằng tài khoản Admin (admin) -> Chuyển hướng vào /dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('admin')
    await page.getByLabel(/Mật khẩu/i).fill('Admin@123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'MES Admin Portal' })).toBeVisible()
  })

  test('1.4: Đăng nhập sai mật khẩu -> Hiển thị thông báo lỗi', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('userA')
    await page.getByLabel(/Mật khẩu/i).fill('WrongPassword999')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await expect(page.locator('.text-destructive').or(page.getByText(/không chính xác|không hợp lệ|lỗi/i)).first()).toBeVisible({ timeout: 5000 })
  })

  test('1.5: Đăng xuất người dùng -> Trở về trang Đăng nhập và xóa phiên', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('userA')
    await page.getByLabel(/Mật khẩu/i).fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/.*chat/)

    await page.getByRole('button', { name: 'Đăng xuất' }).first().click()
    await expect(page).toHaveURL(/.*login/)
  })
})
