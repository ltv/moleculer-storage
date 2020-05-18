import { getStorageConfig, generateFilename } from '../utils';

describe('utils', () => {
  it('should export getStorageConfig', () => {
    expect(getStorageConfig).toBeTruthy();
  });

  it('Should throw error if one of configuration is missed', () => {
    const dummyEnv = {
      STORAGE_ENDPOINT: undefined,
      STORAGE_ACCESS_KEY: 'dummy_value',
      STORAGE_SECRET_KEY: 'dummy_value',
      STORAGE_REGION: 'dummy_value',
      STORAGE_DEFAULT_BUCKET_NAME: 'dummy_value',
      STORAGE_CDN: 'dummy_value',
      STORAGE_MONGODB_URL: 'dummy_value',
    };
    process.env = { ...process.env, ...dummyEnv };
    expect(() => {
      getStorageConfig();
    }).toThrowError();
  });

  it('should return correct configuration', () => {
    // set env
    const dummyEnv = {
      STORAGE_ENDPOINT: 'dummy_value',
      STORAGE_ACCESS_KEY: 'dummy_value',
      STORAGE_SECRET_KEY: 'dummy_value',
      STORAGE_REGION: 'dummy_value',
      STORAGE_DEFAULT_BUCKET_NAME: 'dummy_value',
      STORAGE_CDN: 'dummy_value',
      STORAGE_MONGODB_URL: 'dummy_value',
    };
    process.env = { ...process.env, ...dummyEnv };

    const provider = 'do';
    const config = getStorageConfig(provider);

    expect(config).toEqual({
      default: provider,
      disks: {
        [provider]: {
          driver: provider,
          config: {
            key: expect.any(String),
            secret: expect.any(String),
            endpoint: expect.any(String),
            bucket: expect.any(String),
            region: expect.any(String),
          },
        },
      },
    });
  });

  it('should return default configuration if not provide any provider', () => {
    const provider = 's3';
    const config = getStorageConfig();
    expect(config).toEqual({
      default: provider,
      disks: {
        [provider]: {
          driver: provider,
          config: {
            key: expect.any(String),
            secret: expect.any(String),
            endpoint: expect.any(String),
            bucket: expect.any(String),
            region: expect.any(String),
          },
        },
      },
    });
  });

  it('should generate slugged filename', () => {
    const originalFilename = 'Có phải không vậy nhỉ?.png';
    const slugged = generateFilename(originalFilename);
    expect(slugged).toContain('co_phai_khong_vay_nhi.png');
  });
});
