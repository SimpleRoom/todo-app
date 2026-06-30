export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends Error {
  constructor(id) {
    super(`任务不存在: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ImportFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImportFormatError';
  }
}
