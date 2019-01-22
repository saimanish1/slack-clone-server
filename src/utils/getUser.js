const jwt = require('jsonwebtoken');

const getDataFromToken = req => {
  return req.headers['x-token'] || '';
};

const SECRET = process.env.SECRET;
const getUser = async (req, res) => {
  let token;

  token = getDataFromToken(req);

  if (token.length > 0) {
    try {
      const { user } = await jwt.verify(token, SECRET);
      //  here i'm returning only user(i.e userId ) but not returning name(i.e username) from token
      // in token i receive
      // token {
      // user( i.e userId)
      // name (i.e username)
      // }
      return user;
    } catch {
      return null;
    }
  } else {
    return null;
  }
};

const validateToken = async token => {
  try {
    const { user } = await jwt.verify(token, SECRET);
    return user;
  } catch (e) {
    return null;
  }
};

module.exports = { getUser, validateToken };
