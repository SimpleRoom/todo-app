import { test, expect } from '@playwright/test';

test.describe('US2 - 完成状态切换', () => {
  test('点击复选框标记任务为已完成，刷新后保持', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await page.reload();

    // 添加任务
    await page.getByPlaceholder('请输入任务标题').fill('写周报');
    await page.getByRole('button', { name: '添加' }).click();

    // 点击复选框标记完成
    const checkbox = page.getByRole('checkbox', { name: /写周报/ });
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // 标题应有删除线样式
    const title = page.getByTestId('task-title');
    await expect(title).toHaveClass(/line-through/);

    // 刷新后保持已完成状态
    await page.reload();
    await expect(page.getByRole('checkbox', { name: /写周报/ })).toBeChecked();
    await expect(page.getByTestId('task-title')).toHaveClass(/line-through/);
  });

  test('再次点击复选框取消完成状态', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('写周报');
    await page.getByRole('button', { name: '添加' }).click();

    const checkbox = page.getByRole('checkbox', { name: /写周报/ });
    // 标记完成
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    // 取消完成
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    // 标题不应有删除线
    await expect(page.getByTestId('task-title')).not.toHaveClass(/line-through/);
  });

  test('多条任务可独立切换完成状态', async ({ page }) => {
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

    const checkboxes = page.getByRole('checkbox');
    await expect(checkboxes).toHaveCount(2);

    // 仅切换第一个
    await checkboxes.first().click();
    await expect(checkboxes.first()).toBeChecked();
    await expect(checkboxes.last()).not.toBeChecked();

    // 刷新后状态保持
    await page.reload();
    const refreshedCheckboxes = page.getByRole('checkbox');
    await expect(refreshedCheckboxes.first()).toBeChecked();
    await expect(refreshedCheckboxes.last()).not.toBeChecked();
  });
});
