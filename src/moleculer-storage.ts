import { Response, StorageManager } from '@ltv/storage';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { Context, ServiceSchema } from 'moleculer';
import slugify from 'slugify';
import { PassThrough } from 'stream';
import { generateFilename, getStorageConfig } from './utils';

function randomName() {
  return 'unnamed_' + Date.now() + '.png';
}

export interface MoleculerStorageMixinOptions {
  provider?: 'do' | 's3' | 'gcs' | 'local';
  database?: {
    enabled: boolean;
    name?: string;
    uri?: string;
    table?: string;
  };
}

export interface StorageFile {
  id?: string;
  createdBy?: string;
  path?: string;
  originalPath?: string;
  isPrivate?: boolean;
  provider?: string;
  region?: string;
  bucket?: string;
  filename?: string;
  encoding?: string;
  mimetype?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UploadOptions {}

export function MoleculerStorageMixin(options?: MoleculerStorageMixinOptions): ServiceSchema {
  options = options || { provider: 's3' };
  const { provider, database = { enabled: true } } = options;
  let mixins: ServiceSchema[] = [];
  let adapter: any;
  let collection!: string;
  let dbSettings = {};
  if (database && database.enabled) {
    const DbService = require('moleculer-db');
    const MongoDBAdapter = require('moleculer-db-adapter-mongo');
    mixins = [...mixins, DbService];
    adapter = new MongoDBAdapter(
      process.env.STORAGE_MONGODB_URL || database.uri,
      { useUnifiedTopology: true },
      process.env.STORAGE_MONGODB_NAME || database.name || 'storage'
    );
    collection = database.table || 'files';
    dbSettings = {
      fields: {
        id: { type: 'string', readonly: true, primaryKey: true, secure: true, columnName: '_id' },
        createdBy: { type: 'string' },

        path: { type: 'string' },
        originalPath: { type: 'string' },
        isPrivate: { type: 'boolean', default: 'true' },

        provider: { type: 'string' },
        region: { type: 'string' },
        bucket: { type: 'string' },

        filename: { type: 'string' },
        encoding: { type: 'string' },
        mimetype: { type: 'string' },

        createdAt: { type: 'number', updateable: false, default: Date.now },
        updatedAt: { type: 'number', readonly: true, updateDefault: Date.now },
      },
    };
  }
  const storageCfg = getStorageConfig(provider || 's3');
  const serviceSchema: ServiceSchema = {
    name: 'storage',
    mixins,
    adapter,
    collection,
    settings: {
      storage: storageCfg,
      ...dbSettings,
    },
    actions: {
      // create: { visibility: 'protected' },
      // list: { visibility: 'protected' },
      // find: { visibility: 'protected' },
      // get: { visibility: 'protected' },
      // update: { visibility: 'protected' },
      // remove: { visibility: 'protected' },
    },
    methods: {
      /**
       *
       * Get a disk storage
       *
       * @param {String} name - the disk name
       *
       * @Returns {Object} - A storage instance with the associated driver
       */
      disk(name): Storage {
        return name ? this.storage.disk(name) : this.storage.disk();
      },

      async upload<P = any, M extends object = {}>(ctx: Context<P, M>, options?: UploadOptions) {
        const pt = new PassThrough();
        let meta: any = ctx.meta;
        if (meta.$fileInfo) {
          meta = meta.$fileInfo;
        }
        const filename = generateFilename(meta.filename || randomName());
        (ctx.params as any).pipe(pt);
        const resp: Response<ManagedUpload.SendData> = await this.storage.put(filename, pt, {});
        const { Key, Bucket } = resp.raw;
        const inserted = await this.adapter.insert({
          path: Key,
          originalPath: slugify(meta.filename || randomName(), '_'),
          isPrivate: false,
          provider,
          region: process.env.STORAGE_REGION,
          filename,
          encoding: meta.encoding,
          mimetype: meta.mimetype,
          bucket: Bucket,
        });
        return inserted;
      },
    },

    async created() {
      // TODO: If there is no default provider, will use local
      const storageConfig = (this.settings && this.settings.storage) || {};
      const storage = new StorageManager(storageConfig);
      this.storage = storage.disk();
    },
  };
  return serviceSchema;
}
