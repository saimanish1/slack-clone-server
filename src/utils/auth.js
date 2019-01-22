const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const createTokens = async (user, secret, secret2) => {
  const { id } = user;
  const createToken = jwt.sign(
    {
      user: id,
      name: user.username,
    },
    secret,
    {
      expiresIn: '7d',
    }
  );

  const createRefreshToken = jwt.sign(
    {
      user: id,
    },
    secret2,
    {
      expiresIn: '7d',
    }
  );

  return [createToken, createRefreshToken];
};

const refreshTokens = async (token, refreshToken, models, SECRET, SECRET2) => {
  let userId = 0;
  console.log('refreshToken');

  console.log(refreshToken);

  try {
    const {
      user: { id },
    } = jwt.decode(refreshToken);
    userId = id;
  } catch (err) {
    return {};
  }

  if (!userId) {
    return {};
  }

  const user = await models.User.findOne({ where: { id: userId }, raw: true });

  if (!user) {
    throw new Error('User not found');
  }

  const refreshSecret = user.password + SECRET2;
  try {
    jwt.verify(refreshToken, refreshSecret);
  } catch (err) {
    return {};
  }

  const [newToken, newRefreshToken] = createTokens(user, SECRET, refreshSecret);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user: user.id,
  };
};

const tryLogin = async (email, password, models, SECRET, SECRET2) => {
  const user = await models.User.findOne({ where: { email }, raw: true });
  if (!user) {
    // user with provided email not found
    return {
      ok: false,
      errors: [{ path: 'email', message: 'Wrong email' }],
    };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    // bad password
    return {
      ok: false,
      errors: [{ path: 'password', message: 'Wrong password' }],
    };
  }

  const refreshTokenSecret = user.password + SECRET2;

  const [token, refreshToken] = await createTokens(
    user,
    SECRET,
    refreshTokenSecret
  );

  return {
    ok: true,
    token,
    refreshToken,
  };
};

module.exports = {
  tryLogin,
  refreshTokens,
  createTokens,
};
