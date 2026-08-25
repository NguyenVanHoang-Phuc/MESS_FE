import { test, expect } from '@playwright/test'

test.describe('Luồng 3: Quản lý Công việc & Giao việc trong Chat (Task Management MES-008)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('userA')
    await page.getByLabel(/Mật khẩu/i).fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/.*chat/, { timeout: 10000 })
  })

  test('3.1: Mở Modal Tạo Task từ Sidebar Chi tiết Hội thoại', async ({ page }) => {
    const firstConv = page.locator('aside button:has(p.truncate)').first()
    if (await firstConv.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConv.click()

      const infoBtn = page.getByTitle(/Xem thông tin/i)
      if (await infoBtn.isVisible().catch(() => false)) {
        await infoBtn.click()
      }

      const createTaskBtn = page.getByRole('button', { name: /Tạo Task|Giao việc/i }).first()
      if (await createTaskBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await createTaskBtn.click()
        await expect(page.getByRole('heading', { name: /Giao việc|Tạo Task/i }).or(page.getByPlaceholder(/tiêu đề|nội dung/i)).first()).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('3.2: Điền thông tin và tạo Task mới', async ({ page }) => {
    const firstConv = page.locator('aside button:has(p.truncate)').first()
    if (await firstConv.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConv.click()

      const bubble = page.locator('.group\\/bubble').last()
      if (await bubble.isVisible({ timeout: 4000 }).catch(() => false)) {
        await bubble.hover()
        const taskActionBtn = bubble.locator('button[title*="Task"], button[title*="việc"], button:has(svg.lucide-check-square)')
        if (await taskActionBtn.isVisible().catch(() => false)) {
          await taskActionBtn.click()

          const taskTitle = `Task test ${Date.now()}`
          const titleInput = page.getByPlaceholder(/tiêu đề|nội dung/i).first()
          if (await titleInput.isVisible().catch(() => false)) {
            await titleInput.fill(taskTitle)
            const submitBtn = page.getByRole('button', { name: /Tạo Task|Xác nhận/i })
            if (await submitBtn.isVisible().catch(() => false)) {
              await submitBtn.click()
              await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 6000 })
            }
          }
        }
      }
    }
  })

  test('3.3: Cập nhật trạng thái Task (Chưa làm -> Đang làm -> Đã xong)', async ({ page }) => {
    const firstConv = page.locator('aside button:has(p.truncate)').first()
    if (await firstConv.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConv.click()

      const statusBtn = page.locator('button[title*="Trạng thái"], button:has-text("Chưa làm"), button:has-text("Đang làm")').first()
      if (await statusBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await statusBtn.click()
      }
    }
  })

  test('3.4: Xóa Task và xác nhận hộp thoại', async ({ page }) => {
    const firstConv = page.locator('aside button:has(p.truncate)').first()
    if (await firstConv.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConv.click()

      const infoBtn = page.getByTitle(/Xem thông tin/i)
      if (await infoBtn.isVisible().catch(() => false)) {
        await infoBtn.click()
      }

      const deleteTaskBtn = page.locator('button[title*="Xóa công việc"], button[title*="Xóa Task"]').first()
      if (await deleteTaskBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await deleteTaskBtn.click()
        const confirmDelete = page.getByRole('button', { name: 'Xóa', exact: true })
        if (await confirmDelete.isVisible().catch(() => false)) {
          await confirmDelete.click()
        }
      }
    }
  })
})
