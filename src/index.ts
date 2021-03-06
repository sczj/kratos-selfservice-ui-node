import express, { NextFunction, Request, Response } from 'express'
import handlebars from 'express-handlebars'
import { authHandler } from './routes/auth'
import errorHandler from './routes/error'
import dashboard from './routes/dashboard'
import debug from './routes/debug'
import config from './config'
import jwks from 'jwks-rsa'
import jwt from 'express-jwt'
import {
  getTitle,
  sortFormFields,
  toFormInputPartialName,
} from './translations'
import * as stubs from './stub/payloads'
import { FormField } from '@oryd/kratos-client'
import profileHandler from './routes/profile'
import verifyHandler from './routes/verify'
import morgan from 'morgan'

const protect = jwt({
  // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint.
  secret: jwks.expressJwtSecret({
    cache: true,
    jwksRequestsPerMinute: 5,
    jwksUri: config.jwksUrl,
  }),
  algorithms: ['RS256'],
})

const app = express()
app.use(morgan('tiny'))
app.set('view engine', 'hbs')

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.projectName = config.projectName
  res.locals.baseUrl = config.baseUrl
  next()
})
app.use(express.static('public'))
app.use(express.static('node_modules/normalize.css'))

app.engine(
  'hbs',
  handlebars({
    extname: 'hbs',
    layoutsDir: `${__dirname}/../views/layouts/`,
    partialsDir: `${__dirname}/../views/partials/`,
    defaultLayout: 'main',
    helpers: {
      json: (context: any) => JSON.stringify(context),
      jsonPretty: (context: any) => JSON.stringify(context, null, 2),
      getTitle,
      toFormInputPartialName,
    },
  })
)

if (process.env.NODE_ENV === 'only-ui') {
  // Setting NODE_ENV to "only-ui" disables all integration and only shows the UI. Useful
  // when working on CSS or HTML things.
  app.get('/', dashboard)
  app.get('/auth/registration', (_: Request, res: Response) => {
    const config = stubs.registration.methods.password.config
    res.render('registration', {
      formAction: config.action,
      formFields: (config.fields as Array<FormField>).sort(sortFormFields),
      errors: config.errors,
    })
  })
  app.get('/auth/login', (_: Request, res: Response) => {
    const config = stubs.login.methods.password.config
    res.render('login', {
      formAction: config.action,
      formFields: (config.fields as Array<FormField>).sort(sortFormFields),
      errors: config.errors,
    })
  })
  app.get('/error', (_: Request, res: Response) => res.render('error'))
} else {
  app.get('/', protect, dashboard)
  app.get('/dashboard', protect, dashboard)
  app.get('/auth/registration', authHandler('registration'))
  app.get('/auth/login', authHandler('login'))
  app.get('/error', errorHandler)
  app.get('/profile', protect, profileHandler)
  app.get('/verify', verifyHandler)
}

app.get('/health', (_: Request, res: Response) => res.send('ok'))
app.get('/debug', debug)

app.get('*', (_: Request, res: Response) => {
  res.redirect('/')
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).render('error', {
    message: JSON.stringify(err, null, 2),
  })
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`Listening on http://0.0.0.0:${port}`)
})
