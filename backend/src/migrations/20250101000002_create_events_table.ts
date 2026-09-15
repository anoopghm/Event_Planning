import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("events");
  if (!exists) {
    // Check if users.id is unsigned to match foreign key sign exactly
    const userCol: any = await knex("information_schema.columns")
      .whereRaw("table_schema = DATABASE() AND table_name = 'users' AND column_name = 'id'")
      .select("column_type")
      .first();
    const colType = userCol?.COLUMN_TYPE || userCol?.column_type || "";
    const isUserUnsigned = colType.toLowerCase().includes("unsigned");

    await knex.schema.createTable("events", (table) => {
      table.increments("id").primary();
      table.string("title", 255).notNullable();
      table.text("description").nullable();
      table.string("date", 50).notNullable();
      table.string("time", 50).notNullable();
      table.string("location", 255).nullable();
      table.string("image_url", 500).nullable();
      table.json("tags").nullable();
      table.string("status", 50).defaultTo("Upcoming");

      const createdByCol = isUserUnsigned
        ? table.integer("created_by").unsigned().notNullable()
        : table.integer("created_by").notNullable();

      createdByCol.references("id").inTable("users").onDelete("CASCADE");

      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

      table.index(["created_by"], "idx_events_created_by");
      table.index(["date"], "idx_events_date");
    });
  } else {
    const hasImageUrl = await knex.schema.hasColumn("events", "image_url");
    if (!hasImageUrl) {
      await knex.schema.alterTable("events", (table) => {
        table.string("image_url", 500).nullable();
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("events");
}

