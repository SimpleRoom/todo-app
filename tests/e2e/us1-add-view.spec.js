import { test, expect } from '@playwright/test';

test.describe('US1 - 新增与查看任务', () => {
  test('新增任务后任务出现在列表中并持久化', async ({ page }) => {
    await page.goto('/');
    // 清空 localStorage 以确保干净环境
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await page.reload();

    // 添加第一条任务
    await page.getByPlaceholder('请输入任务标题').fill('买牛奶');
    await page.getByPlaceholder('描述（可选）').fill('下班顺路');
    await page.getByRole('button', { name: '添加' }).click();

    // 验证任务出现在列表中
    await expect(page.getByText('买牛奶')).toBeVisible();
    await expect(page.getByText('下班顺路')).toBeVisible();

    // 刷新后验证持久化
    await page.reload();
    await expect(page.getByText('买牛奶')).toBeVisible();
    await expect(page.getByText('下班顺路')).toBeVisible();
  });

  test('空标题阻止添加并显示提示', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByRole('button', { name: '添加' }).click();
    await expect(page.getByText('请输入任务标题')).toBeVisible();
  });

  test('描述为可选，仅标题即可添加', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('写周报');
    await page.getByRole('button', { name: '添加' }).click();
    await expect(page.getByText('写周报')).toBeVisible();
  });

  test('多条任务按创建时间倒序展示', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('第一条');
    await page.getByRole('button', { name: '添加' }).click();
    await page.waitForTimeout(10);
    await page.getByPlaceholder('请输入任务标题').fill('第二条');
    await page.getByRole('button', { name: '添加' }).click();
    await page.waitForTimeout(10);
    await page.getByPlaceholder('请输入任务标题').fill('第三条');
    await page.getByRole('button', { name: '添加' }).click();

    const items = page.locator('[data-testid="task-title"]');
    await expect(items.first()).toContainText('第三条');
    await expect(items.last()).toContainText('第一条');
  });

  test('空列表显示空状态提示', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await expect(page.getByText('还没有任务，添加第一条吧')).toBeVisible();
  });
});
