module.exports = `
type Channel {
    id: ID!,
    name: String!,
    messages: [Message!]!,
    users: [User!]!
    public: Boolean!
}

type CreateChannelResponse {
    ok: Boolean!
    channel: Channel
    errors: [Error]
}

type Mutation {
    createChannel(teamId: ID!, name: String!, public: Boolean=false): CreateChannelResponse!
}
`;
