import type { Pool } from "mysql2/promise";

export async function notifyUser(
  pool: Pool,
  userId: number,
  title: string,
  body: string | null
): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)`,
    [userId, title.slice(0, 255), body ? body.slice(0, 5000) : null]
  );
}
