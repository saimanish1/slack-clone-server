module.exports = `
type DirectMessage {
    id: ID!,
    text: String!,
    sender:User!,
    receiverId: ID!
}



type Query {
    directMessages(teamId:ID!, otherUserId:ID!):[DirectMessage!]!
    getAllTeamMembers(teamId:ID!): [User!]
}
type Subscription{
    newDirectMessage(teamId:ID!, userId:ID!):DirectMessage!
}



type Mutation {
    createDirectMessage(receiverId: ID!, text: String!, ,teamId:ID!): Boolean!
}

`;
