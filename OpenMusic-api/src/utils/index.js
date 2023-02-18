/* eslint-disable camelcase */
const albumsMapDbToModel = ({
  cover_url, inserted_at, updated_at, ...args
}) => ({
  ...args,
  coverUrl: cover_url,
  insertedAt: inserted_at,
  updatedAt: updated_at,
});

const songsMapDbToModel = ({ inserted_at, updated_at, ...args }) => ({
  ...args,
  insertedAt: inserted_at,
  updatedAt: updated_at,
});

const activitiesMapDbToModel = ({
  user_id, song_id, action, time,
}) => ({
  username: user_id,
  title: song_id,
  action,
  time,
});

module.exports = { albumsMapDbToModel, songsMapDbToModel, activitiesMapDbToModel };
