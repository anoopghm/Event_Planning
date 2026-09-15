import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("event_presence");
  if (!exists) {
    const userCol: any = await knex("information_schema.columns")
      .whereRaw("table_schema = DATABASE() AND table_name = 'users' AND column_name = 'id'")
      .select("column_type")
      .first();
    const isUserUnsigned = (userCol?.COLUMN_TYPE || userCol?.column_type || "").toLowerCase().includes("unsigned");

    const eventCol: any = await knex("information_schema.columns")
      .whereRaw("table_schema = DATABASE() AND table_name = 'events' AND column_name = 'id'")
      .select("column_type")
      .first();
    const isEventUnsigned = (eventCol?.COLUMN_TYPE || eventCol?.column_type || "").toLowerCase().includes("unsigned");

    await knex.schema.createTable("event_presence", (table) => {
      table.increments("id").primary();

      const eventIdCol = isEventUnsigned
        ? table.integer("event_id").unsigned().notNullable()
        : table.integer("event_id").notNullable();
      eventIdCol.references("id").inTable("events").onDelete("CASCADE");

      const userIdCol = isUserUnsigned
        ? table.integer("user_id").unsigned().notNullable()
        : table.integer("user_id").notNullable();
      userIdCol.references("id").inTable("users").onDelete("CASCADE");

      table.specificType("status", "ENUM('yes', 'no', 'maybe')").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

      table.index(["event_id"], "idx_presence_event");
      table.index(["user_id"], "idx_presence_user");
      table.unique(["event_id", "user_id"], "uq_event_user");
    });
  } else {
    try {
      await knex.raw("ALTER TABLE event_presence MODIFY COLUMN status ENUM('yes', 'no', 'maybe') NOT NULL");
    } catch {
      // safe fallback if already modified
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("event_presence");
}

