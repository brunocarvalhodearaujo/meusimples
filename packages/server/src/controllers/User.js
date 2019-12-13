/**
 * Copyright (c) 2019-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Router } from 'express'
import { User as Model } from '../models'
import OAuth2 from './OAuth2'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import isUndefined from 'lodash/isUndefined'
import mask from 'json-mask'

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

export default class User {
  model = new Model()

  /**
   * @param {Request} request
   * @param {Response} response
   * @param {NextFunction} next
   */
  async get (request, response, next) {
    try {
      const data = await this.model.find()

      response
        .status(200)
        .json(data)
    } catch (error) {
      next(error)
    }
  }

  index () {
    return Router()
      .use(OAuth2.getInstance().authenticate())
      .get('/:id([0-9]+|me)?', this.get.bind(this))
  }
}
