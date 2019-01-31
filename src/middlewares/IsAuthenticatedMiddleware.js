const { AuthenticationError, ApolloError } = require('apollo-server');

const isAuthenticated = async (resolve, parent, args, ctx, info) => {
  if (!ctx.user) {
    throw new AuthenticationError('must authenticate');
  }

  if (!(await ctx.models.User.findById(ctx.user))) {
    throw new ApolloError('User not found', 'USER_NOT_FOUND');
  }

  return await resolve(parent, args, ctx, info);
};

const newChannelMessageMiddleware = async (
  resolve,
  parent,
  args,
  ctx,
  info
) => {
  const channel = await ctx.models.Channel.findOne({
    where: { id: args.channelId },
  });
  if (!channel) {
    throw new ApolloError('ChannelId not found');
  }
  const member = await ctx.models.Member.findOne({
    where: {
      teamId: channel.teamId,
      userId: ctx.user.id,
    },
  });
  if (!member) {
    throw new ApolloError(
      'You have to be member of the team to subscribe to messages'
    );
  }
  return await resolve(parent, args, ctx, info);
};
const newDirectMessageMiddleware = async (resolve, parent, args, ctx, info) => {
  const team = await ctx.models.Team.findOne({
    where: { id: args.teamId },
  });
  if (!team) {
    throw new ApolloError('TeamId not found');
  }
  const models = ctx.models;
  const members = await ctx.models.Member.findAll({
    where: {
      teamId: args.teamId,
      [models.sequelize.Op.or]: [
        { userId: args.userId },
        { userId: ctx.user.id },
      ],
    },
    raw: true,
  });
  if (members.length !== 2) {
    throw new ApolloError('You have to be part of the team ');
  }
  return await resolve(parent, args, ctx, info);
};

const middleware1 = {
  Mutation: {
    createTeam: isAuthenticated,
    createChannel: isAuthenticated,
    addTeamMember: isAuthenticated,
    createMessage: isAuthenticated,
    createDirectMessage: isAuthenticated,
  },
  Query: {
    me: isAuthenticated,
    directMessages: isAuthenticated,
    messages: isAuthenticated,
    getAllTeamMembers: isAuthenticated,
  },
  Subscription: {
    newChannelMessage: newChannelMessageMiddleware,
    newDirectMessage: newDirectMessageMiddleware,
  },
};

module.exports = middleware1;
