module.exports = `



type Team {
    id: ID!,
    name: String!
    directMessageMembers: [User!]!,
    channels: [Channel!]!
    admin: Boolean!
}

type CreateTeamResponse {
    ok: Boolean!,
    errors: [Error!]
    team: Team!
}    



type VoidResponse {
    ok:Boolean!
    
}

type Mutation {
    createTeam(name: String!):CreateTeamResponse!
    addTeamMember(email:String!, teamId:ID!): VoidResponse!
}


`;
