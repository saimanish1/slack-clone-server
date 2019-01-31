const {
  ApolloServer,
  ApolloError,
  AuthenticationError,
} = require('apollo-server');
const { PubSub } = require('graphql-subscriptions');
const { makeExecutableSchema } = require('graphql-tools');
const { applyMiddleware } = require('graphql-middleware');
const express = require('express');
const { GraphQLServer } = require('graphql-yoga');

const IsAuthenticatedMiddleware = require('./middlewares/IsAuthenticatedMiddleware');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const {
  fileLoader,
  mergeTypes,
  mergeResolvers,
} = require('merge-graphql-schemas');
const { getUser, validateToken } = require('./utils/getUser');
const models = require('./models/');

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema')));
const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, './resolvers'))
);

const pubsub = new PubSub();

// const schema = makeExecutableSchema({
//
// });
//
// const schemaWithMiddleWare = applyMiddleware(schema, IsAuthenticatedMiddleware);

let user;
const server = new GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [IsAuthenticatedMiddleware],
  context: async ({ request, response, connection }) => {
    if (connection) {
      return {
        models,
        pubsub,
        user: connection.context.validUser,
      };
    } else {
      user = (await getUser(request, response)) || null;
      return {
        user,
        models,
        pubsub,
      };
    }
  },
});

server.express.use('/files', express.static('files'));

models.sequelize.sync({}).then(() => {
  server.start(
    {
      port: 4000,
      subscriptions: {
        onConnect: async ({ token }, webSocket) => {
          const user = await validateToken(token);
          if (!user) {
            throw new ApolloError('Token not found');
          }
          const validUser = await models.User.findOne({
            where: { id: user },
            raw: true,
          });
          if (!validUser) {
            throw new AuthenticationError('Invalid User');
          }
          return {
            validUser,
          };
        },
      },
    },
    () => {
      console.info(`🚀 Server ready at http://localhost:4000`);
    }
  );
});
