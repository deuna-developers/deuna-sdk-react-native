export class Completer<T> {
  private promise: Promise<T>;
  private resolvePromise: ((value: T | PromiseLike<T>) => void) | null = null;
  private rejectPromise: ((reason?: any) => void) | null = null;
  private completed = false;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });
  }

  get wait(): Promise<T> {
    return this.promise;
  }

  complete(value: T): void {
    if (this.completed) return;
    this.completed = true;
    this.resolvePromise?.(value);
  }

  completeError(error: any): void {
    if (this.completed) return;
    this.completed = true;
    this.rejectPromise?.(error);
  }

  isCompleted(): boolean {
    return this.completed;
  }
}
