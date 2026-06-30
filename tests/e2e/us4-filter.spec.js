import { test, expect } from '@playwright/test';

// 使用 task-title testid 定位任务，避免与筛选标签文案冲突
const taskTitle = (name) => page => page.locator('[data-testid="task-title"]', { hasText: name });

test.describe('US4 - 状态筛选', () => {
  test('切换到"未完成"仅显示未完成任务', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('未完成一');
    await page.getByRole('button', { name: '添加' }).click();
    await page.waitForTimeout(10);
    await page.getByPlaceholder('请输入任务标题').fill('未完成二');
    await page.getByRole('button', { name: '添加' }).click();
    await page.waitForTimeout(10);
    await page.getByPlaceholder('请输入任务标题').fill('已完成一');
    await page.getByRole('button', { name: '添加' }).click();

    // 标记最后添加的（顶部第一条）为已完成
    await page.getByRole('checkbox').first().click();

    await page.getByRole('button', { name: '未完成' }).click();

    await expect(page.locator('[data-testid="task-title"]', { hasText: '未完成一' })).toBeVisible();
    await expect(page.locator('[data-testid="task-title"]', { hasText: '未完成二' })).toBeVisible();
    await expect(page.locator('[data-testid="task-title"]', { hasText: '已完成一' })).toHaveCount(0);

    const activeTab = page.getByRole('button', { name: '未完成' });
    await expect(activeTab).toHaveClass(/bg-primary/);
  });

  test('切换到"已完成"仅显示已完成任务', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('未完成标题');
    await page.getByRole('button', { name: '添加' }).click();
    await page.waitForTimeout(10);
    await page.getByPlaceholder('请输入任务标题').fill('已完成标题');
    await page.getByRole('button', { name: '添加' }).click();

    // 标记最后添加的（顶部）为已完成
    await page.getByRole('checkbox').first().click();

    await page.getByRole('button', { name: '已完成' }).click();

    await expect(page.locator('[data-testid="task-title"]', { hasText: '已完成标题' })).toBeVisible();
    await expect(page.locator('[data-testid="task-title"]', { hasText: '未完成标题' })).toHaveCount(0);

    const completedTab = page.getByRole('button', { name: '已完成' });
    await expect(completedTab).toHaveClass(/bg-primary/);
  });

  test('切换到"全部"显示所有任务', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('未完成标题');
    await page.getByRole('button', { name: '添加' }).click();
    await page.waitForTimeout(10);
    await page.getByPlaceholder('请输入任务标题').fill('已完成标题');
    await page.getByRole('button', { name: '添加' }).click();
    await page.getByRole('checkbox').first().click();

    await page.getByRole('button', { name: '已完成' }).click();
    await page.getByRole('button', { name: '全部' }).click();

    await expect(page.locator('[data-testid="task-title"]', { hasText: '未完成标题' })).toBeVisible();
    await expect(page.locator('[data-testid="task-title"]', { hasText: '已完成标题' })).toBeVisible();
  });

  test('筛选状态刷新后保持', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('任务内容');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '未完成' }).click();
    await page.reload();

    const activeTab = page.getByRole('button', { name: '未完成' });
    await expect(activeTab).toHaveClass(/bg-primary/);
    await expect(page.locator('[data-testid="task-title"]', { hasText: '任务内容' })).toBeVisible();
  });

  test('筛选下无匹配任务时显示对应空状态', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('未完成任务内容');
    await page.getByRole('button', { name: '添加' }).click();

    // 切换到"已完成" — 无已完成任务
    await page.getByRole('button', { name: '已完成' }).click();
    await expect(page.getByText('暂无已完成任务')).toBeVisible();

    // 标记完成后再切到"未完成" — 无未完成任务
    await page.getByRole('button', { name: '全部' }).click();
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: '未完成' }).click();
    await expect(page.getByText('暂无未完成任务')).toBeVisible();
  });
});
