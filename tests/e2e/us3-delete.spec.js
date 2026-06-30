import { test, expect } from '@playwright/test';

test.describe('US3 - 删除任务', () => {
  test('点击删除按钮弹出确认弹窗，提示"确定要删除该任务吗？"', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('买牛奶');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '删除' }).click();

    // 弹窗显示
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('确定要删除该任务吗？')).toBeVisible();
    await expect(page.getByRole('button', { name: '确认' })).toBeVisible();
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible();

    // 列表暂未变化
    await expect(page.getByText('买牛奶')).toBeVisible();
  });

  test('弹窗中点击取消，任务保持不变', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('买牛奶');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '取消' }).click();

    // 弹窗关闭
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // 任务仍在
    await expect(page.getByText('买牛奶')).toBeVisible();
  });

  test('弹窗中点击确认，任务被删除并持久化', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('买牛奶');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();

    // 任务从列表消失
    await expect(page.locator('text=买牛奶')).toHaveCount(0);

    // 刷新后依然不存在
    await page.reload();
    await expect(page.locator('text=买牛奶')).toHaveCount(0);
    await expect(page.getByText('还没有任务，添加第一条吧')).toBeVisible();
  });

  test('多条任务独立删除', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('任务一');
    await page.getByRole('button', { name: '添加' }).click();
    await page.waitForTimeout(10);
    await page.getByPlaceholder('请输入任务标题').fill('任务二');
    await page.getByRole('button', { name: '添加' }).click();

    // 删除第一条（最新添加的在顶部）
    const deleteButtons = page.getByRole('button', { name: '删除' });
    await deleteButtons.first().click();
    await page.getByRole('button', { name: '确认' }).click();

    // 仅剩一条
    await expect(page.locator('text=任务一')).toBeVisible();
    await expect(page.locator('text=任务二')).toHaveCount(0);
  });
});
