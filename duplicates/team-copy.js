import formatErrors from '../src/utils/formatErrors.js';
import jwt from 'jsonwebtoken';
export default {
  Mutation: {
    createTeam: async (parent, args, { models, req, res, SECRET, SECRET2 }) => {
      try {
        const token = req.headers['x-token'];
        const refreshToken = req.headers['x-refresh-token'];
        console.log('token', token);
        console.log('refreshtoken', refreshToken);

        if (token == null || refreshToken == null) {
          return {
            ok: false,
            errors: [
              {
                path: 'token',
                message: 'tokens not provided',
              },
            ],
          };
        } else if (token.length < 1 || refreshToken.length < 1) {
          return {
            ok: false,
            errors: [
              {
                path: 'token',
                message: 'tokens are empty',
              },
            ],
          };
        }

        try {
          jwt.verify(token, SECRET);
        } catch (e) {
          let decodedRefreshToken;
          try {
            decodedRefreshToken = jwt.decode(refreshToken);
            if (!decodedRefreshToken.user) {
              throw new Error('refresh not provided');
            }
          } catch (e) {
            console.log('inside');

            return {
              ok: false,
              errors: [
                {
                  path: 'refreshToken',
                  message: e.message,
                },
              ],
            };
          }

          const validUser = await models.User.findById(
            decodedRefreshToken.user,
            {
              raw: true,
            }
          ); //TODO check docs to set raw=true on constructor
          if (!validUser) {
            return {
              ok: false,
              errors: [
                {
                  path: 'user in refreshToken',
                  message: 'User not found',
                },
              ],
            };
          }

          try {
            jwt.verify(refreshToken, validUser.password + SECRET2);
          } catch (err) {
            return {
              ok: false,
              errors: [
                {
                  path: 'refreshToken',
                  message: err.message,
                },
                {
                  path: 'token',
                  message: e.message,
                },
              ],
            };
          }
          const newToken = jwt.sign({ user: validUser.id }, SECRET, {
            expiresIn: '1h',
          });
          const newRefreshToken = jwt.sign(
            { user: validUser.id },
            validUser.password + SECRET2,
            { expiresIn: '7d' }
          );

          res.set('x-token', newToken);
          res.set('x-refresh-token', newRefreshToken);
          await models.Team.create({ ...args, owner: validUser.id });
          return {
            ok: true,
          };
        }
        let decodedToken;
        try {
          decodedToken = jwt.decode(token);
          if (!decodedToken.user) {
            throw new Error('Token not provided');
          }
        } catch (e) {
          return {
            ok: false,
            errors: [
              {
                path: 'token',
                message: e.message,
              },
            ],
          };
        }
        console.log('decodedToken');

        console.log(decodedToken);

        const validUser = await models.User.findById(decodedToken.user);
        if (!validUser) {
          return {
            ok: false,
            errors: [
              {
                path: 'user in token',
                message: 'User not found',
              },
            ],
          };
        }
        await models.Team.create({ ...args, owner: validUser.id });
        return {
          ok: true,
        };
      } catch (err) {
        console.log(err);
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
  },
};
