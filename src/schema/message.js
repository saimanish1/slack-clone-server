module.exports = `
type Message {
    id: ID!,
    text: String!,
    user: User!,
    channel: Channel!,
    created_at:String!,
    url: String,
    filetype:String
}



type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

type Query {
    messages(channelId:ID!):[Message!]
}

type Subscription{
    newChannelMessage(channelId:ID!):Message!
}

type Mutation {
    createMessage(channelId: ID!, text: String, file:Upload): Boolean!
}
`;
