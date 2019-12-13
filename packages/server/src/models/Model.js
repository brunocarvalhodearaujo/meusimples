/**
 * Copyright (c) 2019-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import path from 'path'
import Knex from 'knex'
import console from 'console'
import KnexQueryBuilder from 'knex/lib/query/builder'

/**
 * @param {number} perPage
 * @param {number} currentPage
 */
function paginate (perPage = 10, currentPage = 1) {
  currentPage = (currentPage < 1) ? 1 : currentPage
  const offset = (currentPage - 1) * perPage

  return this
    .offset(offset)
    .limit(perPage)
}

/**
 * @typedef {import('knex').Config} Config
 * @typedef {import('knex').ConnectionConfig} ConnectionConfig
 * @typedef {import('knex').QueryBuilder} QueryBuilder
 * @typedef {{ client: string, connection: ConnectionConfig }} IConnection
 */

export class Model {
  /**
   * @type {Knex}
   */
  static connection = undefined

  /**
   * @returns {string}
   */
  get tableName () {
    return this.constructor.name
      .replace(/\.?([A-Z])/g, (x, y) => `_${y.toLowerCase()}`)
      .replace(/^_/, '')
  }

  /**
   * @returns {IConnection}
   */
  static get connector () {
    switch (process.env.DB_DRIVER) {
      case 'sqlite':
        return {
          client: 'sqlite3',
          connection: {
            filename: process.env.DB_SQLITE_FILENAME || path.join(process.cwd(), 'database.sqlite')
          }
        }
      case 'mysql':
        return {
          client: 'mysql',
          connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            charset: 'utf8'
          }
        }
      default:
        throw new Error('Please define an valid database driver')
    }
  }

  /**
   * @returns {Knex}
   */
  static get knex () {
    if (!Model.connection) {
      /**
       * @type {Config}
       */
      const config = {
        migrations: {
          directory: path.join(__dirname, '..', 'database', 'migrations'),
          tableName: 'migrations'
        },
        seeds: {
          directory: path.join(__dirname, '..', 'database', 'seeds')
        },
        useNullAsDefault: true,
        wrapIdentifier (value, origImpl) {
          return origImpl(value.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase())
        },
        postProcessResponse (result) {
          if (Array.isArray(result)) {
            return result.map(item => {
              if (typeof item !== 'object') {
                return item
              }
              return Object.keys(item)
                .map(key => ({
                  [key.replace(/(_\w)/g, m => m[1].toUpperCase())]: item[key]
                }))
                .reduce((previous, current) => Object.assign(previous, current), {})
            })
          }

          if (typeof result === 'string') {
            return result.replace(/(_\w)/g, m => m[1].toUpperCase())
          }

          return result
        },
        ...Model.connector
      }

      KnexQueryBuilder.prototype.paginate = paginate

      Model.connection = Knex(config)

      Model.connection.queryBuilder = function () {
        return new KnexQueryBuilder(Model.connection.client)
      }

      if (process.env.NODE_ENV === 'development') {
        Model.connection.on('query', query => console.info('Running command ["%s"]', query.sql))
      }
    }

    return Model.connection
  }

  /**
   * @param {string} [tableName]
   * @returns {QueryBuilder}
   */
  table (tableName = this.tableName) {
    return Model.knex(tableName)
  }

  /**
   * @returns {Promise<void>}
   */
  static async rebuild () {
    try {
      console.info('Iniciando a execução das migrations')

      /**
       * @type {boolean}
       */
      const hasTable = await Model.knex.schema.hasTable('migrations')

      await Model.knex.migrate.latest()

      if (!hasTable) {
        await Model.knex.seed.run()
      }

      console.info('Concluida a execução das migrations')
    } catch (error) {
      console.error('Falha na execução das migrations, motivo %s', error.message)
    }
  }
}
