/**
 * Copyright (c) 2019-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import express from 'express'
import { createServer } from 'http'
import { version } from '../package.json'
import cors from 'cors'
import parser from 'body-parser'
import router from 'express-slim-router'
import errorHandler from '@brunocarvalho/error-handler'
import { Model } from './models'

const app = express()
const server = createServer(app)

app.get('/heartbeat', (req, res) => res.sendStatus(200))

if (process.env.NODE_ENV === 'development') {
  // set configs
  app.set('json spaces', 2)
}

// show api version
app.get('/', (req, res) => res.json({ version }))

// load 3rd party middleware
app.use(cors())
app.use(parser.json()) // Parse HTTP JSON bodies
app.use(parser.urlencoded({ extended: true })) // Parse URL-encoded params

/// other configs
app.disable('etag')
app.disable('x-powered-by')

// load routes in `controllers` folder into v1 group
router({ cwd: __dirname, verbose: process.env.NODE_ENV === 'development' })
  .when('controllers')
  .into(app)

// load routes and error on not found
app.all('/*', (req, res, next) => {
  const error = new Error('Could not find resource for current path')
  error.statusCode = 404
  error.reason = 'ENDPOINT_NOT_FOUND'

  next(error)
})

app.use(errorHandler())

server.on('listening', async () => Model.rebuild())

export default server
