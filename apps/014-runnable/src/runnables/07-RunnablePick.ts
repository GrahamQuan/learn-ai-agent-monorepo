import { RunnablePick, RunnableSequence } from '@langchain/core/runnables';

type InputData = {
  name: string;
  age: number;
  city: string;
  country: string;
  email: string;
  phone: string;
};

const inputData: InputData = {
  name: '张三',
  age: 19,
  city: '上海',
  country: '中国',
  email: 'zhangsan@example123.com',
  phone: '+86-13800138001',
};

const chain = RunnableSequence.from([
  (input: InputData) => ({
    ...input,
    fullInfo: `${input.name}，${input.age}岁，来自${input.city}`,
  }),
  new RunnablePick(['name', 'fullInfo']),
]);

const result = await chain.invoke(inputData);
console.log(result);
