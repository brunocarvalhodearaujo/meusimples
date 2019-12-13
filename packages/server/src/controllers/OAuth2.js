/**
 * Copyright (c) 2019-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import { OAuth2 as Model } from '../models'
import OAuthServer from 'express-oauth-server'
import Request from 'oauth2-server/lib/request'
import Response from 'oauth2-server/lib/response'
import { Router } from 'express'
import UnauthorizedRequestError from 'oauth2-server/lib/errors/unauthorized-request-error'
import Promise from 'bluebird'

/**
 * @typedef {import('oauth2-server').AuthenticateOptions} AuthenticateOptions
 * @typedef {import('oauth2-server').Token} Token
 * @typedef {import('oauth2-server').TokenOptions} TokenOptions
 * @typedef {import('oauth2-server').Request} OAuth2Request
 * @typedef {import('oauth2-server').Response} OAuth2Response
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * express wrapper for [oauth2-server](https://github.com/oauthjs/node-oauth2-server).
 *
 * @see [oauth2-server docs(https://oauth2-server.readthedocs.io/en/latest/index.html)
 * @see [adapters](https://oauth2-server.readthedocs.io/en/latest/docs/adapters.html)
 */
export default class OAuth2 extends OAuthServer {
  constructor () {
    super({
      model: new Model(),
      useErrorHandler: true,
      continueMiddleware: false,
      allowBearerTokensInQueryString: true
    })
  }

  /**
   * Grant Middleware.
   *
   * Returns middleware that will grant tokens to valid requests.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-3.2
   *
   * @returns {Promise<Token>}
   */
  token () {
    /**
     * @type {TokenOptions}
     */
    const options = {
      requireClientAuthentication: false,
      extendedGrantTypes: {}
    }

    return super.token(options)
  }

  /**
   * Authentication Middleware.
   *
   * Returns a middleware that will validate a token.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-7
   * @param {AuthenticateOptions & { continueMiddleware: boolean }} options
   */
  authenticate (options = {}) {
    if (['test','development'].includes(process.env.NODE_ENV)) {
      return (request, response, next) => {
        response.locals.oauth = { token: { userId: 1 } }

        next()
      }
    }

    return [
      // @override super.authenticate
      (req, res, next) => {
        if (!options.continueMiddleware) {
          return super.authenticate(options)(req, res, next)
        }

        const request = new Request(req)
        const response = new Response(res)

        return Promise.bind(super.authenticate)
          .then(() => this.server.authenticate(request, response, options))
          .tap(token => {
            res.locals.oauth = { ...res.locals.oauth, token }

            next()
          })
          .catch(e => {
            if (!options.continueMiddleware) {
              // eslint-disable-next-line no-useless-call
              return this.handleError.call(this, e, req, res, null, next)
            }
            // on continueMiddleware is enabled
            res.locals.oauth = { ...res.locals.oauth, token: {}, unauthenticated: true }

            next()
          })
      },
      (request, response, next) => {
        const { token: { userId, clientId } } = response.locals.oauth || { token: {} }

        if (!userId) {
          response.locals.oauth = { ...response.locals.oauth, token: {} }
        } else if (!isNaN(userId)) {
          // parse userId to number
          response.locals.oauth.token.userId = parseInt(userId, 10)
        } else if (userId === clientId) {
          response.locals.oauth.token.clientCredential = true
        }

        next()
      }
    ]
  }

  /**
   * Handle error.
   *
   * @param {Error} e
   * @param {OAuth2Request} req
   * @param {OAuth2Response} res
   * @param {Response} response
   * @param {NextFunction} next
   */
  handleError (e, req, res, response, next) {
    if (this.useErrorHandler === true) {
      next(e)
    } else {
      if (response) {
        res.set(response.headers)
      }

      res.status(e.code)

      if (e instanceof UnauthorizedRequestError) {
        return res.send()
      }

      res.send({ error: e.name, error_description: e.message })
    }
  }

  /**
   * @param {Request} request
   * @param {Response} response
   * @param {NextFunction} next
   */
  async revoke (request, response, next) {
    /**
     * @type {{ model: Model }}
     */
    const { model } = this.server.options
    const { token: refreshToken } = request.body

    const success = await model.revokeToken({ refreshToken })
      .then(Boolean)

    response
      .status(success ? 200 : 503)
      .end()
  }

  /**
   * @returns {OAuth2}
   */
  static getInstance () {
    if (!OAuth2.hasOwnProperty('singleton')) {
      OAuth2.singleton = new OAuth2()
    }

    return OAuth2.singleton
  }

  /**
   * @returns {Router}
   */
  index () {
    return Router()
      .all('/token', this.token())
      .post('/revoke', this.revoke.bind(this))
  }
}
