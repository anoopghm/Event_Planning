import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("users");
  if (!exists) {
    await knex.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("name", 255).notNullable();
      table.string("email", 255).notNullable().unique();
      table.string("password", 255).notNullable();
      table.boolean("is_verified").notNullable().defaultTo(false);
      table.string("verification_token", 255).nullable();
      table.dateTime("verification_token_expires").nullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());

      table.index(["verification_token"], "idx_users_verification_token");
    });
  } else {
    const hasIsVerified = await knex.schema.hasColumn("users", "is_verified");
    if (!hasIsVerified) {
      await knex.schema.alterTable("users", (table) => {
        table.boolean("is_verified").notNullable().defaultTo(false);
      });
    }

    const hasVerificationToken = await knex.schema.hasColumn("users", "verification_token");
    if (!hasVerificationToken) {
      await knex.schema.alterTable("users", (table) => {
        table.string("verification_token", 255).nullable();
        table.index(["verification_token"], "idx_users_verification_token");
      });
    }

    const hasVerificationExpires = await knex.schema.hasColumn("users", "verification_token_expires");
    if (!hasVerificationExpires) {
      await knex.schema.alterTable("users", (table) => {
        table.dateTime("verification_token_expires").nullable();
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}

