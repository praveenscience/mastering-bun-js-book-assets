export type NewEvent = {
  ts: number;
  type: string;
  userId: string;
  ms: number;
};

// The operations every store implements, so they can be compared.
export interface Store {
  name: string;
  insertBatch(events: NewEvent[]): Promise<void>;
  countByType(): Promise<{ type: string; n: number }[]>;
  findById(id: number): Promise<{ id: number; type: string } | null>;
  close(): Promise<void>;
}
