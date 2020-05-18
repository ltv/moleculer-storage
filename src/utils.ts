import { StorageManagerConfig } from '@ltv/storage';
import slugify from 'slugify';

export function getStorageConfig(driver?: 'do' | 's3' | 'gcs' | 'local'): StorageManagerConfig {
  driver = driver || 's3';
  const {
    STORAGE_ENDPOINT,
    STORAGE_ACCESS_KEY,
    STORAGE_SECRET_KEY,
    STORAGE_DEFAULT_BUCKET_NAME,
    STORAGE_REGION,
  } = process.env;
  const config: { [key: string]: string | undefined } = {
    key: STORAGE_ACCESS_KEY,
    secret: STORAGE_SECRET_KEY,
    endpoint: STORAGE_ENDPOINT,
    bucket: STORAGE_DEFAULT_BUCKET_NAME,
    region: STORAGE_REGION,
  };
  assertConfig(config);
  return {
    default: driver,
    disks: {
      [driver]: {
        driver,
        config,
      },
    },
  };
}

export function assertConfig(config: { [key: string]: string | undefined }) {
  const configMap: { [key: string]: string } = {
    key: 'STORAGE_ACCESS_KEY',
    secret: 'STORAGE_SECRET_KEY',
    endpoint: 'STORAGE_ENDPOINT',
    bucket: 'STORAGE_DEFAULT_BUCKET_NAME',
    region: 'STORAGE_REGION',
  };
  const keys = Object.keys(config);
  const len = keys.length;
  for (let i = 0; i < len; i++) {
    const cfgKey = keys[i];
    const cfgValue = config[cfgKey];
    const envKey = configMap[cfgKey];
    if (!cfgValue) {
      throw new Error(`[${envKey}] is required, currently it's ${cfgValue}`);
    }
  }
}

function lpad(str: string, padString: string = '0', length: number = 2): string {
  while (str.length < length) str = padString + str;
  return str;
}

export function generateFilename(originalFilename: string) {
  const slugged: string = slugify(originalFilename || '', '_').toLowerCase();
  const curDt = new Date();
  const month = lpad(`${curDt.getUTCMonth() + 1}`); // months from 1-12
  const day = lpad(`${curDt.getUTCDate()}`);
  const year = curDt.getUTCFullYear();
  const hours = lpad(`${curDt.getUTCHours()}`);
  const minutes = lpad(`${curDt.getUTCMinutes()}`);
  const seconds = lpad(`${curDt.getUTCSeconds()}`);
  return `${year}/${month}/${day}/${hours}${minutes}${seconds}/${slugged}`;
}
