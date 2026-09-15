import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("refresh_tokens");
  if (!exists) {
    const userCol: any = await knex("information_schema.columns")
      .whereRaw("table_schema = DATABASE() AND table_name = 'users' AND column_name = 'id'")
      .select("column_type")
      .first();
    const isUserUnsigned = (userCol?.COLUMN_TYPE || userCol?.column_type || "").toLowerCase().includes("unsigned");

    await knex.schema.createTable("refresh_tokens", (table) => {
      table.increments("id").primary();

      const userIdCol = isUserUnsigned
        ? table.integer("user_id").unsigned().notNullable()
        : table.integer("user_id").notNullable();
      userIdCol.references("id").inTable("users").onDelete("CASCADE");

      table.string("token_hash", 64).notNullable().unique();
      table.dateTime("expires_at").notNullable();
      table.boolean("revoked").defaultTo(false);
      table.timestamp("created_at").defaultTo(knex.fn.now());

      table.index(["user_id"], "idx_refresh_tokens_user");
      table.index(["token_hash"], "idx_refresh_tokens_hash");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("refresh_tokens");
}

