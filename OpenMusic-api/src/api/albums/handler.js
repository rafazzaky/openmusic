/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(
    albumsService,
    albumsValidator,
    storageService,
    uploadsValidator,
  ) {
    this._albumsService = albumsService;
    this._albumsValidator = albumsValidator;
    this._storageService = storageService;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postAlbumHandler(req, h) {
    this._albumsValidator.validateAlbumPayload(req.payload);

    const albumId = await this._albumsService.addAlbum(req.payload);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(req) {
    const { id } = req.params;
    const album = await this._albumsService.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(req, h) {
    this._albumsValidator.validateAlbumPayload(req.payload);
    const { id } = req.params;

    await this._albumsService.updateAlbumById(id, req.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(req, h) {
    const { id } = req.params;
    await this._albumsService.deleteAlbumById(id);
    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadImageHandler(req, h) {
    const { id } = req.params;
    const { cover } = req.payload;

    await this._albumsService.isAlbumExist(id);
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/albums/covers/${filename}`;
    await this._albumsService.editAlbumCoverById(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postLikesAlbumHandler(req, h) {
    const { id } = req.params;
    const { id: credentialId } = req.auth.credentials;

    const message = await this._albumsService.likeTheAlbum(id, credentialId);
    const response = h.response({
      status: 'success',
      message,
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesByIdHandler(req, h) {
    const { id } = req.params;
    const { likes, source } = await this._albumsService.getAlbumLikesById(id);
    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    response.header('X-Data-Source', source);
    response.code(200);
    return response;
  }
}

module.exports = AlbumsHandler;
