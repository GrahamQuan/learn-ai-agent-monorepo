import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { env } from '../env';

const model = new ChatOpenAI({
  modelName: env.MODEL_NAME,
  apiKey: env.AI_SDK_KEY,
  temperature: 0.3,
  configuration: {
    baseURL: env.AI_SDK_BASE_URL,
  },
});

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个简洁、有帮助的中文助手，会用 1-2 句话回答用户问题，重点给出明确、有用的信息。'],
  new MessagesPlaceholder('history'),
  ['human', '{question}'],
]);

const simpleChain = prompt.pipe(model).pipe(new StringOutputParser());

const messageHistories = new Map();

const getMessageHistory = (sessionId: string) => {
  if (!messageHistories.has(sessionId)) {
    messageHistories.set(sessionId, new InMemoryChatMessageHistory());
  }
  return messageHistories.get(sessionId);
};

// 创建带消息历史的链
const chain = new RunnableWithMessageHistory({
  runnable: simpleChain,
  getMessageHistory: (sessionId) => getMessageHistory(sessionId),
  inputMessagesKey: 'question',
  historyMessagesKey: 'history',
});

// 测试：第一次对话
console.log('--- 第一次对话（提供信息） ---');
const result1 = await chain.invoke(
  {
    question: '我的名字是张三，我来自上海，我喜欢编程、跑步、阅读、做饭。',
  },
  {
    configurable: {
      sessionId: 'user-123',
    },
  },
);
console.log('问题: 我的名字是张三，我来自上海，我喜欢编程、跑步、阅读、做饭。');
console.log('回答:', result1);
console.log();

// 测试：第二次对话
console.log('--- 第二次对话（询问之前的信息） ---');
const result2 = await chain.invoke(
  {
    question: '我刚才说我来自哪里？',
  },
  {
    configurable: {
      sessionId: 'user-123',
    },
  },
);
console.log('问题: 我刚才说我来自哪里？');
console.log('回答:', result2);
console.log();

// 测试：第三次对话
console.log('--- 第三次对话（继续询问） ---');
const result3 = await chain.invoke(
  {
    question: '我的爱好是什么？',
  },
  {
    configurable: {
      sessionId: 'user-123',
    },
  },
);
console.log('问题: 我的爱好是什么？');
console.log('回答:', result3);
console.log();
