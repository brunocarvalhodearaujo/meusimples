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
export function seed (knex) {
  return Promise.all([
    knex.table('oauth_client').insert({
      id: 1,
      client_id: 'b921b25ebe3ee70c6b1',
      client_secret: '8f4d45d9a363d922b2eb7',
      grants: 'password,refresh_token'
    }),
    knex.table('oauth_client').insert({
      id: 2,
      client_id: 'b921b25ebe3ee70c6b2',
      client_secret: '8f4d45d9a363d922b2eb8',
      grants: 'client_credentials'
    })
  ])
}
