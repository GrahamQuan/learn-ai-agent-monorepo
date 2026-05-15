import 'cheerio';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const cheerioLoader = new CheerioWebBaseLoader('https://paulgraham.com/start.html', {
  selector: 'html > body > table > tbody > tr > td:nth-child(3) > table:nth-of-type(1) > tbody > tr > td > p > font',
});

const documents = await cheerioLoader.load();

console.log(documents);

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // 每个分块的字符数
  chunkOverlap: 50, // 分块之间的重叠字符数
  separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''], // 分割符，优先使用段落分隔
});

const splitDocuments = await textSplitter.splitDocuments(documents);

// console.log(documents);
console.log(splitDocuments);
