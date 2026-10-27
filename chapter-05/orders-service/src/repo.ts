import { Database } from "bun:sqlite";

export type Order = {
  id: string;
  customerId: string;
  total: number;
  chargeId: string;
  createdAt: string;
};

export function createRepo(db: Database) {
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, customerId TEXT NOT NULL,
    total INTEGER NOT NULL, chargeId TEXT NOT NULL,
    createdAt TEXT NOT NULL)`);
  const insert = db.query(
    `INSERT INTO orders VALUES
     ($id, $customerId, $total, $chargeId, $createdAt)`,
  );
  const byId = db.query("SELECT * FROM orders WHERE id = ?");
  return {
    save(order: Order) {
      insert.run({
        $id: order.id,
        $customerId: order.customerId,
        $total: order.total,
        $chargeId: order.chargeId,
        $createdAt: order.createdAt,
      });
    },
    find(id: string) {
      return byId.get(id) as Order | null;
    },
  };
}

export type Repo = ReturnType<typeof createRepo>;
