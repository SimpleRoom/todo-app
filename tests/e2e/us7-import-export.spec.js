import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

test.describe('US7 - 数据导入导出', () => {
  test('导出全部任务为 JSON 文件', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
      localStorage.removeItem('todoapp:filter:v1');
    });
    await page.reload();

    // 添加 3 条任务
    for (let i = 1; i <= 3; i++) {
      await page.getByPlaceholder('请输入任务标题').fill(`任务${i}`);
      await page.getByRole('button', { name: '添加' }).click();
      await page.waitForTimeout(10);
    }

    // 监听下载事件
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      (async () => {
        await page.getByRole('button', { name: '设置' }).click();
        await page.getByRole('button', { name: '导出数据' }).click();
      })(),
    ]);

    // 验证文件名格式
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^todo-backup-\d{8}-\d{6}\.json$/);

    // 验证文件内容是 JSON 数组且包含 3 条任务
    const downloadPath = await download.path();
    if (downloadPath) {
      const content = fs.readFileSync(downloadPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(3);
      // 每个元素含必填字段
      for (const task of parsed) {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('completed');
        expect(task).toHaveProperty('createdAt');
      }
    }
  });

  test('导出空列表仍触发下载，内容为空数组', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    // 列表为空
    await expect(page.getByText('还没有任务，添加第一条吧')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      (async () => {
        await page.getByRole('button', { name: '设置' }).click();
        await page.getByRole('button', { name: '导出数据' }).click();
      })(),
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^todo-backup-\d{8}-\d{6}\.json$/);

    const downloadPath = await download.path();
    if (downloadPath) {
      const content = fs.readFileSync(downloadPath, 'utf-8');
      expect(JSON.parse(content)).toEqual([]);
    }
  });

  test('导入合法 JSON 文件后任务恢复', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    // 准备导入文件
    const backup = [
      {
        id: 'import-1',
        title: '导入任务一',
        description: '描述一',
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: 'import-2',
        title: '导入任务二',
        description: '',
        completed: true,
        createdAt: Date.now() - 1000,
      },
    ];
    const tmpFile = path.join(os.tmpdir(), `todo-import-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(backup));

    // 设置 filechooser 事件
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      (async () => {
        await page.getByRole('button', { name: '设置' }).click();
        await page.getByRole('button', { name: '导入数据' }).click();
      })(),
    ]);
    await fileChooser.setFiles(tmpFile);

    // 验证任务恢复
    await expect(page.getByText('导入任务一')).toBeVisible();
    await expect(page.getByText('导入任务二')).toBeVisible();

    // 验证成功提示
    await expect(page.getByText(/成功导入 2 条/)).toBeVisible();

    // 刷新后保持
    await page.reload();
    await expect(page.getByText('导入任务一')).toBeVisible();
    await expect(page.getByText('导入任务二')).toBeVisible();

    fs.unlinkSync(tmpFile);
  });

  test('导入时重复 id 跳过，新 id 合并', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    // 先添加 1 条本地任务
    await page.getByPlaceholder('请输入任务标题').fill('本地任务');
    await page.getByRole('button', { name: '添加' }).click();

    // 获取本地任务的 id
    const localId = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('todoapp:tasks:v1'));
      return data.tasks[0].id;
    });

    // 准备导入文件：含相同 id 的任务 + 新任务
    const backup = [
      {
        id: localId,
        title: '远程覆盖版本',
        description: '',
        completed: true,
        createdAt: 0,
      },
      {
        id: 'new-imported',
        title: '新导入任务',
        description: '',
        completed: false,
        createdAt: Date.now(),
      },
    ];
    const tmpFile = path.join(os.tmpdir(), `todo-import-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(backup));

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      (async () => {
        await page.getByRole('button', { name: '设置' }).click();
        await page.getByRole('button', { name: '导入数据' }).click();
      })(),
    ]);
    await fileChooser.setFiles(tmpFile);

    // 本地任务保留原标题（未被子覆盖）
    await expect(page.getByText('本地任务')).toBeVisible();
    await expect(page.locator('text=远程覆盖版本')).toHaveCount(0);
    // 新任务被合并
    await expect(page.getByText('新导入任务')).toBeVisible();
    // 提示
    await expect(page.getByText(/成功导入 1 条，跳过 1 条/)).toBeVisible();

    fs.unlinkSync(tmpFile);
  });

  test('导入非 JSON 文件显示格式错误提示', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('todoapp:tasks:v1');
    });
    await page.reload();

    const tmpFile = path.join(os.tmpdir(), `bad-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'not json content');

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      (async () => {
        await page.getByRole('button', { name: '设置' }).click();
        await page.getByRole('button', { name: '导入数据' }).click();
      })(),
    ]);
    await fileChooser.setFiles(tmpFile);

    await expect(page.getByText('文件格式无效，请选择有效的备份文件')).toBeVisible();
    // 列表不变
    await expect(page.getByText('还没有任务，添加第一条吧')).toBeVisible();

    fs.unlinkSync(tmpFile);
  });
});
