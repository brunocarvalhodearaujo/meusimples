/**
 * Copyright (c) 2019-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Model } from './Model'
import moment from 'moment'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import isUndefined from 'lodash/isUndefined'
import { createHash } from 'crypto'

/**
 * @typedef IUser
 * @property {number} id
 * @property {string} name
 * @property {string} username
 * @property {string} [password]
 * @property {number} createdAt
 * @property {number} updatedAt
 */

export class User extends Model {
  /**
   * @param {Partial<IUser>} condition
   * @returns {Promise<IUser[]>}
   */
  find (condition = {}) {
    condition = pick(condition, ['id', 'username', 'password', 'password'])

    if (condition.password) {
      condition.password = createHash('sha256')
        .update(condition.password)
        .digest('hex')
        .toString()
    }

    return this.table()
      .column(!condition.id && ['id', 'name', 'username'])
      .where(omitBy(condition, isUndefined))
      .limit(50)
      .map(item => ({
        ...omit(item, 'password'),
        phoneNumber: item.phoneNumber && item.phoneNumber.match(/\d+/g)[0],
        disabled: item.disabled && typeof item.disabled !== 'undefined' && Boolean(item.disabled).valueOf(),
        createdAt: item.createdAt && moment(item.createdAt).unix(),
        updatedAt: (item.updatedAt || item.createdAt) && moment(item.updatedAt || item.createdAt).unix()
      }))
  }
}
