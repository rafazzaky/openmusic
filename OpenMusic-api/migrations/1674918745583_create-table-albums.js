/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('albums', {
    id: {
      type: 'VARCHAR(80)',
      notNull: true,
      primaryKey: true,
    },
    name: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    year: {
      type: 'INTEGER',
      notNull: true,
    },
    inserted_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint(
    'songs',
    'fk_album.album_id_albums.id',
    'FOREIGN KEY ("albumId") REFERENCES albums(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('albums');
};
