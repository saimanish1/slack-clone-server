const { ApolloError } = require('apollo-server');

module.exports = {
  Mutation: {
    createTeam: async (parent, args, { models, user }) => {
      try {
        if (await models.Team.find({ where: { name: args.name } })) {
          throw new ApolloError(
            'Team with provided name already exists',
            'DUPLICATE_TEAM_NAME'
          );
        }
        const response = await models.sequelize.transaction(async () => {
          const team = await models.Team.create({ ...args });
          await models.Channel.create({
            name: 'general',
            public: true,
            teamId: team.id,
          });
          await models.Member.create({
            teamId: team.id,
            userId: user,
            admin: true,
          });
          return team;
        });
        return {
          ok: true,
          team: response,
        };
      } catch (err) {
        return err;
      }
    },
    addTeamMember: async (parent, { email, teamId }, { models, user }) => {
      try {
        const memberPromise = models.Member.findOne(
          { where: { teamId, userId: user } },
          { raw: true }
        );
        const userToAddPromise = models.User.findOne(
          { where: { email } },
          { raw: true }
        );
        const [member, userToAdd] = await Promise.all([
          memberPromise,
          userToAddPromise,
        ]);

        if (!member.admin) {
          throw new ApolloError(
            "You don't have authorization to invite people"
          );
        }
        if (!userToAdd) {
          throw new ApolloError('userToAdd not found');
        }
        if (user === userToAdd.id) {
          throw new ApolloError("You can't invite yourself ");
        }
        await models.Member.create({ userId: userToAdd.id, teamId });
        return {
          ok: true,
        };
      } catch (err) {
        console.log(err);
        return err;
      }
    },
  },
  Query: {
    async getAllTeamMembers(parent, { teamId }, { models, user }) {
      const response = await models.sequelize.query(
        'select u.id,u.username from users as u join members as m on m.user_id=u.id where m.team_id = :teamId and m.user_id != :currentUserId',
        {
          replacements: { teamId: parseInt(teamId), currentUserId: user },
          raw: true,
          model: models.User,
          mapToModel: true,
        }
      );
      return response;
    },
  },
  Team: {
    channels: async ({ id }, args, { models, user }, info) => {
      try {
        return await models.Channel.findAll({ where: { teamId: id } });
      } catch (e) {
        return e;
      }
    },
    directMessageMembers: async ({ id }, args, { models, user }) => {
      const response = await models.sequelize.query(
        'select  users.id,users.username from users join direct_messages as dm on (users.id = dm.sender_id) or (users.id = dm.receiver_id) where (:currentUserId = dm.sender_id or :currentUserId = dm.receiver_id) and dm.team_id = :teamId and users.id != :currentUserId group by users.id',
        {
          replacements: { currentUserId: user, teamId: id },
          model: models.User,
          raw: true,
          mapToModel: true,
        }
      );
      return response;
    },
  },
};
