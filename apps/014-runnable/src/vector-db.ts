import { MilvusClient } from '@zilliz/milvus2-sdk-node';
export const COLLECTION_NAME = 'conversations';

export const vectorDatabaseClient = new MilvusClient({
  address: 'localhost:19530',
});
