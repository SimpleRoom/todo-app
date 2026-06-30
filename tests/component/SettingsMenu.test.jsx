import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock 依赖，使用 beforeEach 重新设置 implementation
vi.mock('@/services/importExport', () => ({
  exportTasks: vi.fn(),
  parseImportFile: vi.fn(),
  triggerDownload: vi.fn(),
}));

vi.mock('@/services/taskRepository', () => ({
  importTasks: vi.fn(),
}));

import { SettingsMenu } from '@/components/SettingsMenu';
import {
  exportTasks,
  parseImportFile,
  triggerDownload,
} from '@/services/importExport';
import { importTasks } from '@/services/taskRepository';
import { ImportFormatError } from '@/types/errors';

/** 触发文件输入 onChange（jsdom 中 userEvent.upload 偶尔不触发 React onChange） */
function uploadFile(input, file) {
  Object.defineProperty(input, 'files', {
    value: [file],
    writable: false,
    configurable: true,
  });
  fireEvent.change(input);
}

describe('SettingsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认实现
    exportTasks.mockReturnValue({ filename: 'todo-backup-test.json', content: '[]' });
    triggerDownload.mockReturnValue(undefined);
    importTasks.mockReturnValue({ imported: 0, skipped: 0 });
    parseImportFile.mockReturnValue({ tasks: [], invalid: 0 });
  });

  it('renders gear icon button', () => {
    render(<SettingsMenu tasks={[]} onImported={() => {}} />);
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument();
  });

  it('opens dropdown with 导出数据 and 导入数据 buttons when gear clicked', async () => {
    render(<SettingsMenu tasks={[]} onImported={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: '设置' }));
    expect(screen.getByRole('button', { name: '导出数据' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导入数据' })).toBeInTheDocument();
  });

  it('calls exportTasks and triggerDownload when 导出数据 clicked', async () => {
    const tasks = [{ id: 'a', title: 'A', description: '', completed: false, createdAt: 1000 }];
    render(<SettingsMenu tasks={tasks} onImported={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: '设置' }));
    await userEvent.click(screen.getByRole('button', { name: '导出数据' }));

    expect(exportTasks).toHaveBeenCalledWith(tasks);
    expect(triggerDownload).toHaveBeenCalledWith('todo-backup-test.json', '[]');
  });

  it('triggers file picker when 导入数据 clicked', async () => {
    render(<SettingsMenu tasks={[]} onImported={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: '设置' }));
    const importButton = screen.getByRole('button', { name: '导入数据' });
    const fileInput = importButton.parentElement.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(fileInput, 'click');
    await userEvent.click(importButton);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows success toast after successful import', async () => {
    parseImportFile.mockReturnValue({
      tasks: [{ id: 'a', title: 'A', description: '', completed: false, createdAt: 1000 }],
      invalid: 0,
    });
    importTasks.mockReturnValue({ imported: 1, skipped: 0 });

    const onImported = vi.fn();
    render(<SettingsMenu tasks={[]} onImported={onImported} />);

    await userEvent.click(screen.getByRole('button', { name: '设置' }));
    const fileInput = screen
      .getByRole('button', { name: '导入数据' })
      .parentElement.querySelector('input[type="file"]');

    const file = new File(
      [JSON.stringify([{ id: 'a', title: 'A', completed: false, createdAt: 1000 }])],
      'backup.json',
      { type: 'application/json' },
    );
    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('成功导入 1 条，跳过 0 条无效记录')).toBeInTheDocument();
    });
    expect(onImported).toHaveBeenCalled();
  });

  it('shows format error toast when import file is invalid JSON', async () => {
    parseImportFile.mockImplementation(() => {
      throw new ImportFormatError('文件格式无效，请选择有效的备份文件');
    });

    render(<SettingsMenu tasks={[]} onImported={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: '设置' }));
    const fileInput = screen
      .getByRole('button', { name: '导入数据' })
      .parentElement.querySelector('input[type="file"]');

    const file = new File(['not json'], 'bad.txt', { type: 'text/plain' });
    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('文件格式无效，请选择有效的备份文件')).toBeInTheDocument();
    });
  });

  it('shows toast with skipped count when some records invalid', async () => {
    parseImportFile.mockReturnValue({
      tasks: [{ id: 'a', title: 'A', description: '', completed: false, createdAt: 1000 }],
      invalid: 2,
    });
    importTasks.mockReturnValue({ imported: 1, skipped: 0 });

    render(<SettingsMenu tasks={[]} onImported={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: '设置' }));
    const fileInput = screen
      .getByRole('button', { name: '导入数据' })
      .parentElement.querySelector('input[type="file"]');

    const file = new File([JSON.stringify([])], 'backup.json', { type: 'application/json' });
    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('成功导入 1 条，跳过 2 条无效记录')).toBeInTheDocument();
    });
  });

  it('closes dropdown after clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <SettingsMenu tasks={[]} onImported={() => {}} />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: '设置' }));
    expect(screen.getByRole('button', { name: '导出数据' })).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('outside'));
    expect(screen.queryByRole('button', { name: '导出数据' })).not.toBeInTheDocument();
  });
});
