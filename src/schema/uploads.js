module.exports = `

scalar Upload


  type Query {
    uploads: [File]
  }
  type Mutation {
    uploadFile(file: Upload!): Boolean!
  }
`;
