import { MilvusClient } from '@zilliz/milvus2-sdk-node';

export const COLLECTION_NAME: string = 'conversations';
export const MILVUS_ADDRESS: string = 'localhost:19530';

export const vectorDatabaseClient = new MilvusClient({
  address: MILVUS_ADDRESS,
});
