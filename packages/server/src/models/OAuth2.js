/**
 * Copyright (c) 2019-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Model } from './Model'
import { User } from './User'
import moment from 'moment'
import pickBy from 'lodash/pickBy'
import omitBy from 'lodash/omitBy'
import isUndefined from 'lodash/isUndefined'

/**
 * @typedef {import('./User').IUser} IUser
 */

/**
 * @typedef {'password'|'client_credentials'} grantType
 */

/**
 * @typedef IToken
 * @property {string} accessToken
 * @property {Date} accessTokenExpiresAt
 * @property {string} refreshToken
 * @property {Date} refreshTokenExpiresAt
 * @property {string[]} scope
 */

/**
 * @typedef IClient
 * @property {string} id
 * @property {string} clientSecret
 * @property {string[]} grants
 */

/**
 * @typedef {IClientResponse}
 * @property {string} id
 * @property {string[]} redirectUris
 * @property {string[]} grants
 */

/**
 * @typedef IRefreshToken
 * @property {string} refreshToken
 * @property {string} refreshTokenExpiresAt
 * @property {string[]} scope
 * @property {IClient} client
 * @property {IUser} user
 */

/**
 * object through which some aspects of storage, retrieval and custom validation
 * are abstracted.
 *
 * @see [model specification](https://github.com/oauthjs/node-oauth2-server)
 */
export class OAuth2 extends Model {
  user = new User()

  /**
   * Invoked to retrieve an existing access token previously saved through `Model#saveToken()`
   * This model function is required if `OAuth2Server#authenticate()` is used.

   * @param {string} accessToken The access token to retrieve.
   * @returns {Promise<IToken & { userId: number }>}
   */
  getAccessToken (accessToken) {
    return this.table('oauth_token')
      .where({ accessToken })
      .limit(1)
      .then(([ token ]) => token && omitBy({
        accessToken: token.accessToken,
        clientId: token.clientId,
        client: token.clientId,
        accessTokenExpiresAt: new Date(token.accessTokenExpiresAt),
        userId: token.user,
        user: token.user
      }, isUndefined))
  }

  /**
   * Invoked to retrieve an existing refresh token previously saved through Model#saveToken().
   * This model function is required if the refresh_token grant is used.
   *
   * @param {string} refreshToken
   * @returns {Promise<IRefreshToken>}
   */
  getRefreshToken (refreshToken) {
    return this.table('oauth_token')
      .where({ refreshToken })
      .limit(1)
      .then(([ token ]) => ({
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: new Date(token.refreshTokenExpiresAt),
        scope: token.scope,
        client: {
          id: token.clientId
        },
        user: {
          id: token.user
        }
      }))
  }

  /**
   * Invoked to retrieve a client using a client id or a client id/client secret
   * combination, depending on the grant type.
   * This model function is required for all grant types.
   *
   * @param {string} clientId The client id of the client to retrieve.
   * @param {string} clientSecret The client secret of the client to retrieve. Can be `null`.
   * @returns {Promise<IClientResponse>}
   */
  getClient (clientId, clientSecret) {
    return this.table('oauth_client')
      .where(pickBy({ clientId, clientSecret }))
      .limit(1)
      .then(([ client ]) => client && {
        id: client.clientId,
        redirectUris: client.redirectUri.split(/(?:,| )+/).filter(Boolean),
        grants: client.grants.split(/(?:,| )+/).filter(Boolean)
      })
  }

  /**
   * Invoked to retrieve a user using a username/password combination.
   * This model function is required if the password grant is used.
   *
   * @param {string} username The username of the user to retrieve.
   * @param {string} password The userâ€™s password.
   * @returns {Promise<IUser>}
   */
  getUser (username, password) {
    return this.user.find({ username, password })
      .then(users => users.shift())
      .then(user => user && user)
  }

  /**
   * Invoked to save an access token and optionally a refresh token, depending on the grant type.
   * This model function is required for all grant types.
   *
   * @param {IToken} token
   * @param {IClient} client
   * @param {IUser} user
   * @returns {Promise<Partial<IToken | IRefreshToken>>}
   */
  saveToken (token, client, user) {
    return this.table('oauth_token')
      .insert({
        accessToken: token.accessToken,
        accessTokenExpiresAt: moment(token.accessTokenExpiresAt).unix(),
        clientId: client.id,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: moment(token.refreshTokenExpiresAt).unix(),
        user: typeof user.id === 'string' ? 1 : user.id
      })
      .then(Number)
      .then(id => this.table('oauth_token').where({ id }))
      .then(([ accessToken ]) => ({
        accessToken: accessToken.accessToken,
        refreshToken: accessToken.refreshToken,
        client: {
          id: accessToken.clientId
        },
        user: {
          id: accessToken.user
        }
      }))
  }

  /**
   * @param {{ id: string, redirectUris: string[], grants: grantType[] }} client
   */
  getUserFromClient (client) {
    if (client.grants.includes('client_credentials')) {
      return this.table('oauth_client')
        .where({ 'client_id': client.id })
        .then(([ result ]) => ({
          id: client.id,
          clientId: result.clientId,
          grants: client.grants
        }))
    }

    return Promise.reject(new Error('Invalid grant authentication flow'))
  }

  /**
   * Invoked to revoke a refresh token.
   * This model function is required if the refresh_token grant is used.
   *
   * @param {Partial<IToken>} token
   * @returns {Promise<boolean>}
   */
  revokeToken (token) {
    return this.table('oauth_token')
      .where({ refreshToken: token.refreshToken })
      .limit(1)
      .del()
      .then(Boolean)
  }
}
