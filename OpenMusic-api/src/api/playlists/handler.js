/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistsService, songsService, validator) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(req, h) {
    this._validator.validatePlaylistPayload(req.payload);
    const { name } = req.payload;
    const { id: credentialId } = req.auth.credentials;

    const playlistId = await this._playlistsService.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(req, h) {
    const { id: credentialId } = req.auth.credentials;
    const playlists = await this._playlistsService.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async getPlaylistByIdHandler(req, h) {
    const { id } = req.params;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(id, credentialId);

    const playlist = await this._playlistsService.getPlaylistById(id);
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistByIdHandler(req, h) {
    const { id: playlistId } = req.params;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(
      playlistId,
      credentialId,
    );
    await this._playlistsService.deletePlaylistById(playlistId);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  // Playlist Song

  async postPlaylistSongHandler(req, h) {
    this._validator.validatePlaylistSongPayload(req.payload);
    const { playlistId } = req.params;
    const { songId } = req.payload;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(
      playlistId,
      credentialId,
    );
    await this._songsService.getSongById(songId);

    await this._playlistsService.addSongToPlaylist(playlistId, songId);

    // add activity "add" to playlistActivity
    const action = 'add';
    await this._playlistsService.addActivityToPlaylist(
      playlistId,
      songId,
      credentialId,
      action,
    );

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsHandler(req, h) {
    const { playlistId } = req.params;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(
      playlistId,
      credentialId,
    );

    const playlist = await this._playlistsService.getSongsFromPlaylist(
      playlistId,
    );
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistSongByIdHandler(req, h) {
    const { playlistId } = req.params;
    const { songId } = req.payload;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(
      playlistId,
      credentialId,
    );
    await this._playlistsService.deleteSongFromPlaylist(playlistId, songId);

    // add activity "delete" to playlistActivity
    const action = 'delete';
    await this._playlistsService.addActivityToPlaylist(
      playlistId,
      songId,
      credentialId,
      action,
    );

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    };
  }

  // Playlist activities

  async getPlaylistActivitiesHandler(req, h) {
    const { id: playlistId } = req.params;
    const { id: credentialId } = req.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(
      playlistId,
      credentialId,
    );

    const activities = await this._playlistsService.getPlaylistActivities(
      playlistId,
    );
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
