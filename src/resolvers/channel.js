const { ApolloError } = require('apollo-server');

module.exports = {
  Mutation: {
    createChannel: async (parent, args, { models, user }) => {
      try {
        const member = await models.Member.findOne(
          { where: { teamId: args.teamId, userId: user } },
          { raw: true }
        );
        if (!member.admin) {
          throw new ApolloError('You are not the owner');
        }
        const channel = await models.Channel.create(args);
        return {
          ok: true,
          channel,
        };
      } catch (err) {
        return err;
      }
    },
  },
};
