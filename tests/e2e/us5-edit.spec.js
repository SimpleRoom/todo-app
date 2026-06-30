import { test, expect } from '@playwright/test';

test.describe('US5 - 编辑任务', () => {
  test('编辑任务标题与描述后保存，刷新后保持', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await page.reload();

    // 添加初始任务
    await page.getByPlaceholder('请输入任务标题').fill('买牛奶');
    await page.getByPlaceholder('描述（可选）').fill('下班顺路');
    await page.getByRole('button', { name: '添加' }).click();

    // 进入编辑态
    await page.getByRole('button', { name: '编辑' }).click();

    // 修改标题与描述（使用属性选择器，兼容 Playwright 1.45）
    const titleInput = page.locator('input[aria-label="编辑任务标题"]');
    const descInput = page.locator('input[aria-label="编辑任务描述"]');
    await titleInput.fill('买酸奶');
    await descInput.fill('早上路过超市');

    await page.getByRole('button', { name: '保存' }).click();

    // 验证列表更新
    await expect(page.getByText('买酸奶')).toBeVisible();
    await expect(page.getByText('早上路过超市')).toBeVisible();
    await expect(page.locator('text=买牛奶')).toHaveCount(0);

    // 刷新后保持
    await page.reload();
    await expect(page.getByText('买酸奶')).toBeVisible();
    await expect(page.getByText('早上路过超市')).toBeVisible();
  });

  test('编辑态取消不保存修改', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('买牛奶');
    await page.getByPlaceholder('描述（可选）').fill('下班顺路');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '编辑' }).click();
    await page.locator('input[aria-label="编辑任务标题"]').fill('改过的标题');
    await page.getByRole('button', { name: '取消' }).click();

    // 列表应显示原标题，未保存
    await expect(page.getByText('买牛奶')).toBeVisible();
    await expect(page.locator('text=改过的标题')).toHaveCount(0);
  });

  test('编辑时空标题阻止保存', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('买牛奶');
    await page.getByRole('button', { name: '添加' }).click();

    await page.getByRole('button', { name: '编辑' }).click();
    await page.locator('input[aria-label="编辑任务标题"]').fill('');
    await page.getByRole('button', { name: '保存' }).click();

    await expect(page.getByText('请输入任务标题')).toBeVisible();
    // 仍在编辑态
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
  });

  test('编辑后保留原 createdAt 与 completed 状态', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    await page.getByPlaceholder('请输入任务标题').fill('原任务');
    await page.getByRole('button', { name: '添加' }).click();

    // 记录创建时间
    const createdAtText = await page.getByText(/\d{4}年\d{2}月\d{2}日/).textContent();

    // 标记完成
    await page.getByRole('checkbox').click();
    await expect(page.getByRole('checkbox')).toBeChecked();

    // 编辑标题
    await page.getByRole('button', { name: '编辑' }).click();
    await page.locator('input[aria-label="编辑任务标题"]').fill('新任务名');
    await page.getByRole('button', { name: '保存' }).click();

    // 验证创建时间与完成状态保持
    await expect(page.getByText(createdAtText)).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeChecked();
    await expect(page.getByTestId('task-title')).toHaveClass(/line-through/);
  });
});
