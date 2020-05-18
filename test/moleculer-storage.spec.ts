import { ServiceBroker } from 'moleculer';
import * as request from 'supertest';
import TestService from './services/test.service';
const path = require('path');
const ApiService = require('moleculer-web');

function setup(settings: any = {}, brokerSettings: any = {}) {
  const broker = new ServiceBroker(
    Object.assign({}, { nodeID: undefined, logger: false }, brokerSettings)
  );

  broker.createService(TestService);

  const service = broker.createService(ApiService, {
    name: 'gateway',
    settings,
  });
  const server = service.server;

  return [broker, service, server];
}

/**
 * Dummy test
 */
describe('moleculer-storage', () => {
  let broker: ServiceBroker;
  let service: any;
  let server: any;
  const imgPath = path.resolve(__dirname, 'assets', 'images', 'ltv_logo.png');

  beforeAll(() => {
    [broker, service, server] = setup({
      routes: [
        {
          path: '/upload',
          bodyParsers: {
            json: false,
            // urlencoded: { extended: false },
          },
          aliases: {
            'POST /file': 'multipart:file.uploadFile',
          },
          busboyConfig: {
            limits: {
              files: 1,
            },
          },
        },
      ],
    });
    return broker.start();
  });

  afterAll(() => broker.stop());
  it('works if true is truthy', () => {
    expect(true).toBeTruthy();
  });

  it('GET /', () => {
    return request(server)
      .get('/')
      .then((res) => {
        expect(res.status).toBe(404);
        expect(res.header['content-type']).toBe('application/json; charset=utf-8');
        expect(res.body).toEqual({
          code: 404,
          message: 'Not found',
          name: 'NotFoundError',
          type: 'NOT_FOUND',
        });
      });
  });

  it('Should upload file correctly', () => {
    return request(server)
      .post('/upload/file')
      .attach('file', imgPath)
      .then((res) => {
        expect(res.body).toEqual([
          {
            path: expect.any(String),
            originalPath: expect.any(String),
            isPrivate: expect.any(Boolean),
            provider: 'do',
            region: expect.any(String),
            filename: expect.any(String),
            encoding: expect.any(String),
            mimetype: expect.any(String),
            bucket: expect.any(String),
            _id: expect.any(String),
          },
        ]);
      });
  });
});
