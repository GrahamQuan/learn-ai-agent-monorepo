import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableLambda, RunnableMap } from '@langchain/core/runnables';

const addOne = RunnableLambda.from((input: { num: number }) => input.num + 1);
const multiplyTwo = RunnableLambda.from((input: { num: number }) => input.num * 2);
const square = RunnableLambda.from((input: { num: number }) => input.num * input.num);

const greetTemplate = PromptTemplate.fromTemplate('你好，{name}！');
const weatherTemplate = PromptTemplate.fromTemplate('今天天气{weather}。');

// 创建 RunnableMap，并行执行多个 runnable
const runnableMap = RunnableMap.from({
  // 数学运算
  add: addOne,
  multiply: multiplyTwo,
  square: square,

  // prompt 格式化
  greeting: greetTemplate,
  weather: weatherTemplate,
});

// 测试输入
const input: { name: string; weather: string; num: number } = {
  name: '张三',
  weather: '晴天',
  num: 5,
};

// 执行 RunnableMap
const result = await runnableMap.invoke(input);
console.log(result);
