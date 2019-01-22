const {
  ApolloServer,
  PubSub,
  ApolloError,
  AuthenticationError,
} = require('apollo-server');
const { makeExecutableSchema } = require('graphql-tools');
const { applyMiddleware } = require('graphql-middleware');

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

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const schemaWithMiddleWare = applyMiddleware(schema, IsAuthenticatedMiddleware);

let user;
const server = new ApolloServer({
  schema: schemaWithMiddleWare,
  context: async ({ req, res, connection }) => {
    if (connection) {
      return {
        models,
        pubsub,
        user: connection.context.validUser,
      };
    } else {
      user = (await getUser(req, res)) || null;
      return {
        user,
        models,
        pubsub,
      };
    }
  },

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
});

models.sequelize.sync({}).then(() => {
  server.listen({ port: 4000 }, () => {
    console.info(
      `🚀 Server ready at http://localhost:4000${server.graphqlPath}`
    );
  });
});
