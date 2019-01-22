import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';
import models from '../src/models';

dotenv.config();

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema')));
const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, './resolvers'))
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // context: {
  // },
  context: async ({ req, res }) => {
    return {
      models,
      SECRET: process.env.SECRET,
      SECRET2: process.env.SECRET2,
      req,
      res,
    };
  },
});
const app = express();
// app.use(addUser);

server.applyMiddleware({ app, path: '/graphql' });

models.sequelize.sync().then(() => {
  app.listen({ port: 4000 }, () => {
    console.log(
      `🚀 Server ready at http://localhost:4000${server.graphqlPath}`
    );
  });
});
