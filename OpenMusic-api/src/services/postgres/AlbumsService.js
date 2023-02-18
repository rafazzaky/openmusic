/* eslint-disable no-underscore-dangle */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async isAlbumExist(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async likeTheAlbum(id, userId) {
    await this.isAlbumExist(id);

    const result = await this._pool.query({
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [id, userId],
    });

    let message = '';
    if (!result.rowCount) {
      const resultInsert = await this._pool.query({
        text: 'INSERT INTO user_album_likes (album_id, user_id) VALUES($1, $2) RETURNING id',
        values: [id, userId],
      });

      if (!resultInsert.rowCount) {
        throw new InvariantError('Gagal menyukai album');
      }
      message = 'Berhasil menyukai album';
    } else {
      const resultDelete = await this._pool.query({
        text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
        values: [id, userId],
      });

      if (!resultDelete.rowCount) {
        throw new InvariantError('Gagal membatalkan menyukai album');
      }
      message = 'Batal menyukai album';
    }
    await this._cacheService.delete(`user_album_likes:${id}`);
    return message;
  }

  async getAlbumLikesById(id) {
    try {
      const source = 'cache';
      const likes = await this._cacheService.get(`user_album_likes:${id}`);
      return { likes: +likes, source };
    } catch (error) {
      await this.isAlbumExist(id);

      const result = await this._pool.query({
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id],
      });

      const likes = result.rowCount;
      await this._cacheService.set(`user_album_likes:${id}`, likes);
      const source = 'server';

      return { likes, source };
    }
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year FROM albums WHERE id=$1',
      values: [id],
    };
    const querySongs = {
      text: 'SELECT id, title, performer FROM songs WHERE "albumId" = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    const songs = await this._pool.query(querySongs);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return {
      ...result.rows[0],
      songs: songs.rows,
    };
  }

  async updateAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name=$1, year=$2, updated_at=$3 WHERE id=$4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async editAlbumCoverById(id, fileLocation) {
    await this._pool.query({
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [fileLocation, id],
    });
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id=$1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = AlbumsService;
