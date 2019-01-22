module.exports = (e, models) => {
  if (e instanceof models.sequelize.ValidationError) {
    return e.errors.map(x => {
      const { path, message } = x;
      console.log(path);
      console.log(message);
      return {
        path,
        message,
      };
    });
  }
  return [{ path: 'name', message: 'something went wrong' }];
};
