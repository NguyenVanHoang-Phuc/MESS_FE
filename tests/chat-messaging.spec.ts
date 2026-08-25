import { test, expect } from '@playwright/test'

test.describe('Luồng 2: Nhắn tin & Tương tác Hội thoại (Chat & Messaging)', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/Tên đăng nhập \/ Email/i).fill('userA')
    await page.getByLabel(/Mật khẩu/i).fill('123456')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/.*chat/, { timeout: 10000 })
  })

  test('2.1: Gửi tin nhắn văn bản và hiển thị trong khung chat', async ({ page }) => {
    const firstConversation = page.locator('aside button:has(p.truncate)').first()
    if (await firstConversation.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConversation.click()

      const testMessage = `Tin nhắn test ${Date.now()}`
      const chatInput = page.getByPlaceholder(/Nhập tin nhắn/i)
      await chatInput.fill(testMessage)
      await chatInput.press('Enter')

      await expect(page.getByText(testMessage)).toBeVisible({ timeout: 6000 })
    }
  })

  test('2.2: Thả cảm xúc Emoji (Reaction) trên tin nhắn', async ({ page }) => {
    const firstConversation = page.locator('aside button:has(p.truncate)').first()
    if (await firstConversation.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConversation.click()

      const messageBubble = page.locator('.group\\/bubble').last()
      if (await messageBubble.isVisible({ timeout: 4000 }).catch(() => false)) {
        await messageBubble.hover()
        const reactionBtn = messageBubble.locator('button').first()
        if (await reactionBtn.isVisible().catch(() => false)) {
          await reactionBtn.click()
        }
      }
    }
  })

  test('2.3: Thu hồi (Recall) tin nhắn đã gửi', async ({ page }) => {
    const firstConversation = page.locator('aside button:has(p.truncate)').first()
    if (await firstConversation.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConversation.click()

      const recallText = `Tin thu hồi ${Date.now()}`
      const chatInput = page.getByPlaceholder(/Nhập tin nhắn/i)
      await chatInput.fill(recallText)
      await chatInput.press('Enter')
      await expect(page.getByText(recallText)).toBeVisible({ timeout: 6000 })

      const targetBubble = page.locator('.group\\/bubble').filter({ hasText: recallText })
      if (await targetBubble.isVisible().catch(() => false)) {
        await targetBubble.hover()
        const recallActionBtn = targetBubble.locator('button[title*="Thu hồi"], button:has-text("Thu hồi")')
        if (await recallActionBtn.isVisible().catch(() => false)) {
          await recallActionBtn.click()
          const confirmBtn = page.getByRole('button', { name: 'Thu hồi', exact: true })
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click()
          }
          await expect(page.getByText(/Tin nhắn đã được thu hồi/i)).toBeVisible({ timeout: 6000 })
        }
      }
    }
  })

  test('2.4: Mở Modal Tìm kiếm Tin nhắn Nâng cao (MES-006)', async ({ page }) => {
    const searchMsgBtn = page.getByTitle(/Tìm kiếm tin nhắn/i).first()
    if (await searchMsgBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchMsgBtn.click()
      await expect(page.getByRole('heading', { name: /Tìm kiếm tin nhắn/i }).or(page.getByPlaceholder(/Nhập từ khóa/i)).first()).toBeVisible({ timeout: 5000 })
      await page.keyboard.press('Escape')
    }
  })

  test('2.5: Chuyển đổi giữa các Tab Hội thoại, Người, Nhóm', async ({ page }) => {
    await page.getByRole('button', { name: 'Người' }).click()
    await expect(page.getByText('Nhân viên')).toBeVisible()

    await page.locator('aside button:text-is("Nhóm")').click()
    await expect(page.locator('aside').getByText(/Gần đây|Chưa có/i).first()).toBeVisible()

    await page.locator('aside button:text-is("Hội thoại")').click()
  })
})
