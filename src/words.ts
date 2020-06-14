import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: fs.createReadStream(__dirname + '/assets/words.txt'),
  crlfDelay: Infinity
});

const words: string[] = [];
rl.on('line', (line) => {
    words.push(line);
});

export default words;
