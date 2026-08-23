import { model } from './ai-models/model';

const response = await model.invoke(`
  Introduce yourself.
  return with 2 languages: English and Simplified Chinese.
`);

console.log(response.content);
