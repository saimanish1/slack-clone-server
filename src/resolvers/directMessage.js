const { ApolloError, withFilter } = require('apollo-server');

const NEW_DIRECT_MESSAGE = 'NEW_DIRECT_MESSAGE';

module.exports = {
  Mutation: {
    createDirectMessage: async (parent, args, { models, user, pubsub }) => {
      try {
        const directMessage = await models.DirectMessage.create({
          ...args,
          senderId: user.toString(),
        });
        pubsub.publish(NEW_DIRECT_MESSAGE, {
          newDirectMessage: {
            ...directMessage.dataValues,
          },
        });
        return true;
      } catch (err) {
        throw new ApolloError('Error creating DirectMessage');
      }
    },
  },
  Query: {
    async directMessages(parent, { teamId, otherUserId }, { models, user }) {
      try {
        const Op = models.Sequelize.Op;
        const directMessages = await models.DirectMessage.findAll({
          order: [['created_at', 'ASC']],
          where: {
            teamId,
            [Op.or]: [
              {
                [Op.and]: [{ receiverId: otherUserId }, { senderId: user }],
              },
              {
                [Op.and]: [{ receiverId: user }, { senderId: otherUserId }],
              },
            ],
          },
          raw: true,
        });

        return directMessages;
      } catch (e) {}
    },
  },

  Message: {
    async user({ userId }, args, { models, ...otherArgs }) {
      return models.User.findOne({ where: { id: userId } }, { raw: true });
    },
  },
  DirectMessage: {
    async sender({ senderId }, args, { models }) {
      if (!senderId) {
        throw new ApolloError('SenderId not found');
      }
      return models.User.findOne({ where: { id: senderId }, raw: true });
    },
  },
  Subscription: {
    newDirectMessage: {
      subscribe: withFilter(
        (
          parent,
          { teamId, userId },
          { pubsub, models, ...otherArgs },
          info
        ) => {
          return pubsub.asyncIterator(NEW_DIRECT_MESSAGE);
        },
        (payload, args, { user }) => {
          return (
            (payload.newDirectMessage.teamId == args.teamId &&
              (payload.newDirectMessage.senderId == user.id &&
                payload.newDirectMessage.receiverId == args.userId)) ||
            (payload.newDirectMessage.senderId == args.userId &&
              payload.newDirectMessage.receiverId == user.id)
          );
        }
      ),
    },
  },
};
