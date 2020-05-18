import { ServiceSchema, Context } from 'moleculer';
import { MoleculerStorageMixin } from '../../src/moleculer-storage';
import crypto from 'crypto';

const testSchema: ServiceSchema = {
  name: 'file',
  mixins: [MoleculerStorageMixin({ provider: 'do' })],
  actions: {
    uploadFile: {
      handler(ctx: Context<any>) {
        return this.upload(ctx);
      },
    },
  },
};

export default testSchema;
