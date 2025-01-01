const fs = require('fs');

module.exports = {
    getWords() {
        return fs.readFileSync('./files/dictionary.txt').toString().split("\n");
    },
    getTemplates() {
        return fs.readFileSync('./files/templates.txt').toString().split("\n");
    },
    getTemplateSolves(templates, words) {
        const templateSolves = new Map();
        for (var i = 0; i < templates.length; i++) {
            // every solve for this specific template
        
            // getting every solve for this template
            for (var j = 0; j < words.length; j++) {
                var solvesDone = new Array();
                if (words[j].length < templates[i].length) {
                    continue;
                }
                // count the number of occurrences of letters of the word
                const letterCount = new Map();
                for (var c of words[j]) {
                    if (!letterCount.has(c)) letterCount.set(c, 0);
                    letterCount.set(c, letterCount.get(c) + 1);
                }
                // for every position that the template can fit into the word
                for (var k = 0; k <= words[j].length - templates[i].length; k++) {
                    // for every char in the template
                    var currentPrompt = "";
                    for (var l = k; l < k + templates[i].length; l++) {
                        if (templates[i].charAt(l - k) == '.') {
                            currentPrompt += words[j].charAt(l);
                        }
                        else {
                            currentPrompt += '-';
                        }
                    }
        
                    // if we already have a solve for this in our word, discount it
                    if (!solvesDone.includes(currentPrompt)) {
                        solvesDone[solvesDone.length] = currentPrompt;
        
                        if (templateSolves.get(currentPrompt) === undefined) {
                            templateSolves.set(currentPrompt, new Map());
                        }
                        if (templateSolves.get(currentPrompt).get(words[j].length) === undefined) {
                            templateSolves.get(currentPrompt).set(words[j].length, new Array());
                        }
                        templateSolves.get(currentPrompt).get(words[j].length).push(words[j]);
                    }
                }
            }
        }
        return templateSolves;
    },
    binarySearchWord(word, words, low, high) {
        if (low >= high) return low;
        if (word > words[Math.floor((low + high) / 2)]) {
            return module.exports.binarySearchWord(word, words, Math.ceil((low + high) / 2), high);
        }
        return module.exports.binarySearchWord(word, words, low, Math.floor((low + high) / 2));
    }
}