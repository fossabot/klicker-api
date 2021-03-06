require('dotenv').config()

const mongoose = require('mongoose')
const JWT = require('jsonwebtoken')

const { UserInputError } = require('apollo-server-express')

mongoose.Promise = require('bluebird')

const {
  isAuthenticated,
  isValidJWT,
  signup,
  login,
  logout,
  requireAuth,
  getToken,
  changePassword,
} = require('./auth')
const { UserModel } = require('../models')
const { initializeDb } = require('../lib/test/setup')
const { Errors } = require('../constants')

const appSecret = process.env.APP_SECRET

describe('AuthService', () => {
  beforeAll(async () => {
    await initializeDb({
      mongoose,
      email: 'testauth@bf.uzh.ch',
      shortname: 'auth',
    })
  })
  afterAll((done) => {
    mongoose.disconnect(done)
  })

  describe('isAuthenticated', () => {
    it('correctly validates authentication state', () => {
      const auth1 = null
      const auth2 = {}
      const auth3 = { sub: null }
      const auth4 = { sub: 'abcd' }

      expect(isAuthenticated(auth1)).toEqual(false)
      expect(isAuthenticated(auth2)).toEqual(false)
      expect(isAuthenticated(auth3)).toEqual(false)
      expect(isAuthenticated(auth4)).toEqual(true)
    })
  })

  describe('requireAuth', () => {
    it('restricts access to authenticated users', () => {
      const auth1 = null
      const auth2 = {}
      const auth3 = { sub: null }
      const auth4 = { sub: 'abcd' }

      const wrappedFunction = requireAuth(() => 'something')

      expect(() => wrappedFunction(null, null, { auth: auth1 })).toThrow(
        'INVALID_LOGIN',
      )
      expect(() => wrappedFunction(null, null, { auth: auth2 })).toThrow(
        'INVALID_LOGIN',
      )
      expect(() => wrappedFunction(null, null, { auth: auth3 })).toThrow(
        'INVALID_LOGIN',
      )
      expect(wrappedFunction(null, null, { auth: auth4 })).toEqual('something')
    })
  })

  describe('isValidJWT', () => {
    it('correctly validates JWTs', () => {
      const jwt1 = null
      const jwt2 = 'abcd'
      const jwt3 = JWT.sign({ id: 'abcd' }, appSecret)

      expect(isValidJWT(jwt1, appSecret)).toBeFalsy()
      expect(isValidJWT(jwt2, appSecret)).toBeFalsy()
      expect(isValidJWT(jwt3, appSecret)).toBeTruthy()
    })
  })

  describe('getToken', () => {
    const baseReq = {
      cookies: {},
      headers: {},
    }
    const validJWT = JWT.sign({ id: 'abcd' }, appSecret)

    it('handles nonexistent tokens', () => {
      expect(getToken(baseReq)).toBeNull()
    })

    it('extracts tokens from cookies', () => {
      // invalid JWT handling
      expect(
        getToken({
          ...baseReq,
          cookies: {
            jwt: 'invalid-token',
          },
        }),
      ).toBeNull()

      // valid JWT handling
      expect(
        getToken({
          ...baseReq,
          cookies: {
            jwt: validJWT,
          },
        }),
      ).toEqual(validJWT)
    })

    it('extracts tokens from headers', () => {
      // invalid JWT handling
      expect(
        getToken({
          ...baseReq,
          headers: {
            authorization: 'Bearer invalid-token',
          },
        }),
      ).toBeNull()

      // valid JWT handling
      expect(
        getToken({
          ...baseReq,
          headers: {
            authorization: `Bearer ${validJWT}`,
          },
        }),
      ).toEqual(validJWT)
    })
  })

  describe('signup', () => {
    it.each`
      email                | password       | expected
      ${'invalidEmail'}    | ${'validPass'} | ${new UserInputError(Errors.INVALID_EMAIL)}
      ${'valid@bf.uzh.ch'} | ${'ps'}        | ${new UserInputError(Errors.INVALID_PASSWORD)}
    `(
  'fails with invalid email or password',
  ({ email, password, expected }) => {
    expect(
      signup(email, password, 'validsrt', 'Institution', 'Testing...'),
    ).rejects.toThrowError(expected)
  },
)
    it.each`
      shortname
      ${'toolongshort'}
      ${'sh'}
      ${'srt-inv'}
    `('fails with invalid shortname', ({ shortname }) => {
  expect(signup(shortname, 'Institution', 'Testing...')).rejects.toThrow()
})

    it.each`
      email                  | expected
      ${'Abc.Abc@BF.uzh.CH'} | ${'abc.abc@bf.uzh.ch'}
      ${'abc.abc@gmail.com'} | ${'abcabc@gmail.com'}
    `('normalizes emails', async ({ email, expected }) => {
  await UserModel.findOneAndRemove({ email: expected })

  const newUser = await signup(
    email,
    'somePassword',
    'normaliz',
    'IBF Test',
    'Testing...',
  )
  expect(newUser.email).toEqual(expected)

  await UserModel.findOneAndRemove({ email: expected })
})

    it('works with valid user data', async () => {
      // remove a user with the given test email if he already exists
      await UserModel.findOneAndRemove({ email: 'testsignup@bf.uzh.ch' })

      // try creating a new user with valid data
      const newUser = await signup(
        'testsignup@bf.uzh.ch',
        'somePassword',
        'signup',
        'IBF Testitution',
        'Work stuff..',
      )

      // expect the new user to contain correct data
      expect(newUser).toEqual(
        expect.objectContaining({
          email: 'testsignup@bf.uzh.ch',
          shortname: 'signup',
          institution: 'IBF Testitution',
          useCase: 'Work stuff..',
          isAAI: false,
          isActive: false,
        }),
      )

      // expect the password to not be the same (as it is hashed)
      expect(newUser.password).not.toEqual('somePassword')
    })
  })

  describe('login', () => {
    // mock the response object
    // let it save the params to res.cookie(...) into a temporary cookieStore
    let cookieStore
    const res = {
      cookie: (...params) => {
        cookieStore = params
      },
    }

    afterAll(() => {
      cookieStore = undefined
    })

    it('fails with invalid email', () => {
      expect(login(res, 'thisisinvalid', 'abcd')).rejects.toEqual(
        new UserInputError(Errors.INVALID_EMAIL),
      )

      // expect that cookies should not have been touched
      expect(cookieStore).toBeUndefined()
    })

    it('fails with wrong email/password combination', () => {
      // expect the login to fail and the promise to reject
      expect(login(res, 'blaa@bluub.com', 'abcd')).rejects.toEqual(
        new Error('INVALID_LOGIN'),
      )

      // expect that cookies should not have been touched
      expect(cookieStore).toBeUndefined()
    })

    it('works with a real user', async () => {
      const userId = await login(res, 'testauth@bf.uzh.ch', 'somePassword')

      // expect the returned user to contain the correct email and shortname
      // the shortname is only saved in the database (thus the connection must work)
      expect(userId).toBeTruthy()

      // expect a new cookie to have been set
      expect(cookieStore[0]).toEqual('jwt')
    })

    it('allows changing the password', async () => {
      // expect the old login to work and the promise to resolve
      const userId = await login(res, 'testauth@bf.uzh.ch', 'somePassword')
      expect(userId).toBeTruthy()

      // change the user's password
      const updatedUser = await changePassword(userId, 'someOtherPassword')
      expect(updatedUser).toEqual(
        expect.objectContaining({
          email: 'testauth@bf.uzh.ch',
          shortname: 'auth',
        }),
      )

      // expect the old login to fail and the promise to reject
      expect(login(res, 'testauth@bf.uzh.ch', 'somePassword')).rejects.toEqual(
        new Error('INVALID_LOGIN'),
      )

      // expect the new login to work
      expect(
        login(res, 'testauth@bf.uzh.ch', 'someOtherPassword'),
      ).resolves.toBeTruthy()
    })

    it('allows logging the user out', async () => {
      // expect the login to work and the promise to resolve
      const userId = await login(res, 'testauth@bf.uzh.ch', 'someOtherPassword')
      expect(userId).toBeTruthy()

      // expect a new cookie to have been set
      expect(cookieStore[0]).toEqual('jwt')

      // logout
      await logout(res)

      // TODO: expect something
    })

    it('allows requesting a password reset link', async () => {})
  })
})
