const fs = require('fs');

const data = require('./questions.json');

for (let q of data) {
    // Fix duplicate keys in options
    const keys = [];
    const newOptions = [];
    let currentKeyObj = null;
    
    // First remove any options that are just question text overflow
    // Usually if there are more than 4, the first one is the overflow
    if (q.options.length > 4) {
        if (q.options[0].key === 'a' && q.options[1].key === 'a') {
            q.text += " " + q.options[0].text;
            q.options.shift();
        }
    }
    
    // Re-assign keys a, b, c, d
    const validKeys = ['a', 'b', 'c', 'd'];
    q.options = q.options.slice(0, 4).map((opt, i) => {
        return {
            key: validKeys[i],
            text: opt.text.replace(/^[a-d]\)\s*/i, '').trim()
        };
    });
}

fs.writeFileSync('./questions.fixed.json', JSON.stringify(data, null, 2));
console.log("Fixed JSON written to questions.fixed.json");