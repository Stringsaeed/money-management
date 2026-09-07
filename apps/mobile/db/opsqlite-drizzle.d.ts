import type { QueryResult, Scalar } from "@op-engineering/op-sqlite";

declare module "@op-engineering/op-sqlite" {
  export interface OPSQLiteConnection {
    execute(query: string, params?: Scalar[]): QueryResult;
    executeAsync(query: string, params?: Scalar[]): Promise<QueryResult>;
    executeRawAsync(query: string, params?: Scalar[]): Promise<unknown[][]>;
    execAsync(source: string): Promise<void>;
    runAsync(
      source: string,
      ...params: unknown[]
    ): Promise<{ changes: number; lastInsertRowId: number }>;
    getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
    getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
    withTransactionAsync(task: () => Promise<void>): Promise<void>;
    withExclusiveTransactionAsync(
      task: (transaction: OPSQLiteConnection) => Promise<void>,
    ): Promise<void>;
  }
}
