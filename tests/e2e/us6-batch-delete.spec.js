import { test, expect } from '@playwright/test';

test.describe('US6 - 批量删除任务', () => {
  test('进入多选模式显示复选框与工具栏，新增区域隐藏', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('任务一');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '批量操作' }).click();

    // 多选模式 UI
    await expect(page.getByRole('button', { name: '全选' })).toBeVisible();
    await expect(page.getByRole('button', { name: '删除所选' })).toBeVisible();
    await expect(page.getByRole('button', { name: '退出多选' })).toBeVisible();
    // 新增区域隐藏
    await expect(page.getByPlaceholder('请输入任务标题')).toHaveCount(0);
  });

  test('点击全选选中所有可见任务，按钮变为"取消全选"', async ({ page }) => {
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

    await page.getByRole('button', { name: '批量操作' }).click();
    await page.getByRole('button', { name: '全选' }).click();

    // 所有 select-checkbox 应被勾选（不含完成切换的 checkbox）
    const selectCheckboxes = page.locator('input[data-testid="select-checkbox"]');
    await expect(selectCheckboxes).toHaveCount(2);
    for (const checkbox of await selectCheckboxes.all()) {
      await expect(checkbox).toBeChecked();
    }

    // 按钮变为"取消全选"
    await expect(page.getByRole('button', { name: '取消全选' })).toBeVisible();

    // 点击取消全选
    await page.getByRole('button', { name: '取消全选' }).click();
    for (const checkbox of await selectCheckboxes.all()) {
      await expect(checkbox).not.toBeChecked();
    }
  });

  test('批量删除弹出确认弹窗，提示选中数量', async ({ page }) => {
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

    await page.getByRole('button', { name: '批量操作' }).click();
    // 选中 2 条
    const selectCheckboxes = page.locator('input[data-testid="select-checkbox"]');
    await selectCheckboxes.first().click();
    await selectCheckboxes.last().click();

    await page.getByRole('button', { name: /删除所选/ }).click();

    // 弹窗显示，提示数量
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('确定要删除选中的 2 条任务吗？')).toBeVisible();
    // 列表暂未变化
    await expect(page.locator('[data-testid="task-title"]')).toHaveCount(2);
  });

  test('确认批量删除后任务消失并持久化，多选模式保持', async ({ page }) => {
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
    await page.waitForTimeout(10);
    await page.getByPlaceholder('请输入任务标题').fill('任务三');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '批量操作' }).click();
    const selectCheckboxes = page.locator('input[data-testid="select-checkbox"]');
    // 选中第 1 和第 3 个
    await selectCheckboxes.nth(0).click();
    await selectCheckboxes.nth(2).click();

    await page.getByRole('button', { name: /删除所选/ }).click();
    await page.getByRole('button', { name: '确认' }).click();

    // 仅剩 1 条
    await expect(page.locator('[data-testid="task-title"]')).toHaveCount(1);
    // 多选模式保持
    await expect(page.getByRole('button', { name: '退出多选' })).toBeVisible();
    // 选中数量重置为 0
    await expect(page.getByRole('button', { name: /删除所选/ })).toBeVisible();

    // 刷新后依然消失
    await page.reload();
    await expect(page.locator('[data-testid="task-title"]')).toHaveCount(1);
  });

  test('取消批量删除弹窗后列表与选中状态保持', async ({ page }) => {
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

    await page.getByRole('button', { name: '批量操作' }).click();
    await page.locator('input[data-testid="select-checkbox"]').first().click();
    await page.getByRole('button', { name: /删除所选/ }).click();

    await page.getByRole('button', { name: '取消' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-testid="task-title"]')).toHaveCount(2);
    // 选中状态保持
    await expect(page.locator('input[data-testid="select-checkbox"]').first()).toBeChecked();
  });

  test('退出多选恢复新增区域，清空选中状态', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('任务一');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '批量操作' }).click();
    await page.locator('input[data-testid="select-checkbox"]').first().click();
    await page.getByRole('button', { name: '退出多选' }).click();

    // 新增区域恢复
    await expect(page.getByPlaceholder('请输入任务标题')).toBeVisible();
    // 工具栏消失
    await expect(page.getByRole('button', { name: '退出多选' })).toHaveCount(0);
    // 复选框消失
    await expect(page.locator('input[data-testid="select-checkbox"]')).toHaveCount(0);
  });

  test('未选中时点击"删除所选"显示提示', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('任务一');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '批量操作' }).click();
    await page.getByRole('button', { name: /删除所选/ }).click();

    await expect(page.getByText('请先选择要删除的任务')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
