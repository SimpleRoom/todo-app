import { test, expect } from '@playwright/test';

test.describe('跨标签页自动同步', () => {
  test('标签页 A 新增任务后，标签页 B 自动显示', async ({ browser }) => {
    // 清空存储（在 context 创建前通过一个临时页执行）
    const context = await browser.newContext();
    const setupPage = await context.newPage();
    await setupPage.goto('/');
    await setupPage.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await setupPage.close();

    // 打开两个标签页
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await pageA.goto('/');
    await pageB.goto('/');

    // 等待两个页面都加载完毕
    await expect(pageA.getByText('还没有任务，添加第一条吧')).toBeVisible();
    await expect(pageB.getByText('还没有任务，添加第一条吧')).toBeVisible();

    // 在 A 中新增任务
    await pageA.getByPlaceholder('请输入任务标题').fill('跨标签页任务');
    await pageA.getByRole('button', { name: '添加' }).click();
    await expect(pageA.getByText('跨标签页任务')).toBeVisible();

    // B 应在 1 秒内自动显示该任务，无需手动刷新
    await expect(pageB.locator('[data-testid="task-title"]', { hasText: '跨标签页任务' })).toBeVisible({ timeout: 1000 });

    await context.close();
  });

  test('标签页 B 切换任务完成状态后，标签页 A 自动同步', async ({ browser }) => {
    const context = await browser.newContext();
    const setupPage = await context.newPage();
    await setupPage.goto('/');
    await setupPage.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    // 添加一条任务到存储
    await setupPage.getByPlaceholder('请输入任务标题').fill('同步测试任务');
    await setupPage.getByRole('button', { name: '添加' }).click();
    await setupPage.close();

    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await pageA.goto('/');
    await pageB.goto('/');

    // 两个页面初始都显示未完成
    await expect(pageA.getByRole('checkbox')).not.toBeChecked();
    await expect(pageB.getByRole('checkbox')).not.toBeChecked();

    // 在 B 中标记完成
    await pageB.getByRole('checkbox').click();
    await expect(pageB.getByRole('checkbox')).toBeChecked();

    // A 应在 1 秒内同步为已完成
    await expect(pageA.getByRole('checkbox')).toBeChecked({ timeout: 1000 });
    await expect(pageA.getByTestId('task-title')).toHaveClass(/line-through/);

    await context.close();
  });

  test('标签页 B 删除任务后，标签页 A 自动同步', async ({ browser }) => {
    const context = await browser.newContext();
    const setupPage = await context.newPage();
    await setupPage.goto('/');
    await setupPage.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await setupPage.getByPlaceholder('请输入任务标题').fill('待删除任务');
    await setupPage.getByRole('button', { name: '添加' }).click();
    await setupPage.close();

    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await pageA.goto('/');
    await pageB.goto('/');

    await expect(pageA.getByText('待删除任务')).toBeVisible();
    await expect(pageB.getByText('待删除任务')).toBeVisible();

    // 在 B 中删除
    await pageB.getByRole('button', { name: '删除' }).click();
    await pageB.getByRole('button', { name: '确认' }).click();

    // A 应在 1 秒内同步（任务消失）
    await expect(pageA.locator('text=待删除任务')).toHaveCount(0, { timeout: 1000 });
    await expect(pageA.getByText('还没有任务，添加第一条吧')).toBeVisible();

    await context.close();
  });

  test('标签页 B 切换筛选状态后，标签页 A 自动同步', async ({ browser }) => {
    const context = await browser.newContext();
    const setupPage = await context.newPage();
    await setupPage.goto('/');
    await setupPage.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    // 添加一条已完成 + 一条未完成
    await setupPage.getByPlaceholder('请输入任务标题').fill('未完成任务');
    await setupPage.getByRole('button', { name: '添加' }).click();
    await setupPage.waitForTimeout(10);
    await setupPage.getByPlaceholder('请输入任务标题').fill('已完成任务');
    await setupPage.getByRole('button', { name: '添加' }).click();
    // 标记最新（顶部）为已完成
    await setupPage.getByRole('checkbox').first().click();
    await setupPage.close();

    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await pageA.goto('/');
    await pageB.goto('/');

    // 两页面初始均为全部
    await expect(pageA.getByRole('button', { name: '全部' })).toHaveClass(/bg-primary/);
    await expect(pageB.getByRole('button', { name: '全部' })).toHaveClass(/bg-primary/);

    // 在 B 中切换到"未完成"
    await pageB.getByRole('button', { name: '未完成' }).click();
    await expect(pageB.getByRole('button', { name: '未完成' })).toHaveClass(/bg-primary/);

    // A 应在 1 秒内同步筛选状态
    await expect(pageA.getByRole('button', { name: '未完成' })).toHaveClass(/bg-primary/, { timeout: 1000 });

    await context.close();
  });
});
