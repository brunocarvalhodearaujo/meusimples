/**
 * Copyright (c) 2019-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * @typedef {import('knex')} Knex
 */

/**
 * @param {Knex} knex
 */
export function up (knex) {
  return knex.schema
    .createTable('user', table => {
      table.increments('id').notNullable().primary().unsigned()
      table.string('name', 100).notNullable()
      table.string('username').unique().nullable()
      table.string('password', 100).nullable()
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.timestamp('updated_at').nullable()
    })
    .createTable('oauth_client', table => {
      table.increments('id').notNullable().primary().unsigned()
      table.string('client_id').unique().notNullable()
      table.string('client_secret').unique().notNullable()
      table.string('redirect_uri').notNullable().defaultTo('')
      table.string('grants').notNullable().defaultTo('')
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.timestamp('updated_at').nullable()
    })
    .createTable('oauth_token', table => {
      table.increments('id').notNullable().primary().unsigned()
      table.string('access_token').nullable()
      table.string('access_token_expires_at').nullable()
      table.string('refresh_token').nullable()
      table.string('refresh_token_expires_at').nullable()
      table.integer('user').index().nullable().unsigned().references('id').inTable('user').onDelete('CASCADE')
      table.string('client_id').index().notNullable().references('client_id').inTable('oauth_client').onDelete('CASCADE')
      table.string('scope').nullable()
    })
}

/**
 * @param {Knex} knex
 */
export function down (knex) {
  return knex.schema
    .dropTable('user')
    .dropTable('oauth_clients')
    .dropTable('oauth_tokens')
}

export const config = {
  transaction: true
}
