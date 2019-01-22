const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const formatErrors = require('../utils/formatErrors.js');
const { tryLogin } = require('../utils/auth.js');

module.exports = {
  Query: {
    me: (parent, args, { models, user }) =>
      models.User.findOne({ where: { id: user } }),
    allUsers: (parent, args, { models }) => models.User.findAll(),
    getUserName: async (parent, { userId }, { models }) => {
      const res = await models.User.findOne({
        where: { id: userId },
        attributes: ['username'],
        raw: true,
      });
      return res;
    },
  },
  User: {
    async teams({ id }, args, { models, user }) {
      const response = await models.Team.findAll({
        include: [{ model: models.User, where: { id: user } }],
        raw: true,
      });
      const modifiedResponse = response.map(res => {
        return {
          id: res.id,
          name: res.name,
          admin: res['users.member.admin'],
        };
      });
      return modifiedResponse;
    },
  },
  Mutation: {
    register: async (parent, { password, ...otherArgs }, { models }) => {
      try {
        if (password.length < 5 || password.length > 25) {
          return {
            ok: false,
            errors: [
              {
                path: 'password',
                message:
                  'Password is either less than 5 letters or more than 25 letters',
              },
            ],
          };
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await models.User.create({
          ...otherArgs,
          password: hashedPassword,
        });
        return {
          ok: true,
          user,
        };
      } catch (err) {
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
    login: async (parent, { email, password }, { models }) => {
      const SECRET = process.env.SECRET;
      const SECRET2 = process.env.SECRET2;

      if (models != null && SECRET != null && SECRET2 != null) {
        return tryLogin(email, password, models, SECRET, SECRET2);
      }
    },
  },
};
