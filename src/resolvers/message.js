const { ApolloError, withFilter } = require('apollo-server');

const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

const shortid = require('shortid');
const fs = require('fs');

const storeFS = ({ stream, filename }) => {
  const id = shortid.generate();
  const url = `images/${id}-${filename}`;
  return new Promise((resolve, reject) =>
    stream
      .on('error', error => {
        if (stream.truncated)
          // Delete the truncated file.
          fs.unlinkSync(path);
        reject(error);
      })
      .pipe(fs.createWriteStream(url))
      .on('error', error => reject(error))
      .on('finish', () => resolve({ id, url }))
  );
};

const processUpload = async upload => {
  const { createReadStream, filename, mimetype } = await upload;
  const stream = createReadStream();
  const { id, url } = await storeFS({ stream, filename });
  return { url, filetype: mimetype };
};

module.exports = {
  Mutation: {
    createMessage: async (
      parent,
      { file, ...args },
      { models, user, pubsub }
    ) => {
      try {
        let messageData = args;
        if (file) {
          const { url, filetype } = await processUpload(file);
          messageData.url = url;
          messageData.filetype = filetype;
        }

        const message = await models.Message.create({ ...args, userId: user });
        pubsub.publish(NEW_CHANNEL_MESSAGE, {
          newChannelMessage: message.dataValues,
          channelId: args.channelId,
        });
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    },
  },
  Query: {
    async messages(parent, { channelId }, { models, user }) {
      try {
        const messages = await models.Message.findAll({
          order: [['created_at', 'ASC']],
          where: { channelId },
          raw: true,
        });
        return messages;
      } catch (e) {
        throw new ApolloError(e.message);
      }
    },
  },
  Subscription: {
    newChannelMessage: {
      subscribe: withFilter(
        (parent, { channelId }, { pubsub, models, ...otherArgs }, info) => {
          return pubsub.asyncIterator(NEW_CHANNEL_MESSAGE);
        },
        (payload, args) => {
          return payload.channelId === args.channelId;
        }
      ),
    },
  },

  Message: {
    async user({ userId }, args, { models, ...otherArgs }) {
      return models.User.findOne({ where: { id: userId }, raw: true });
    },
  },
};
