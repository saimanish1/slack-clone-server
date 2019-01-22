module.exports = (sequelize, DataTypes) => {
  const DirectMessage = sequelize.define('direct_message', {
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  DirectMessage.associate = models => {
    DirectMessage.belongsTo(models.User, {
      foreignKey: {
        name: 'receiverId',
        field: 'receiver_id',
      },
    });
    DirectMessage.belongsTo(models.Team, {
      foreignKey: {
        name: 'teamId',
        field: 'team_id',
      },
    });

    DirectMessage.belongsTo(models.User, {
      foreignKey: {
        name: 'senderId',
        field: 'sender_id',
      },
    });
  };

  return DirectMessage;
};
