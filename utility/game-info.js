const fs = require('fs');

module.exports = {
    getWords() {
        return fs.readFileSync('./files/dictionary.txt').toString().split("\n");
    },
    getTemplates() {
        return fs.readFileSync('./files/templates.txt').toString().split("\n");
    },
    getTemplateSolves(templates, words) {
        const templateSolves = new Array();
        for (var i = 0; i < templates.length; i++) {
            // every solve for this specific template
        
            // getting every solve for this template
            for (var j = 0; j < words.length; j++) {
                var solvesDone = new Array();
                if (words[j].length < templates[i].length) {
                    continue;
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
        
                        if (templateSolves[words[j].length] == undefined) {
                            templateSolves[words[j].length] = new Map();
                        }
                        if (templateSolves[words[j].length].get(currentPrompt)== undefined) {
                            templateSolves[words[j].length].set(currentPrompt, 1);
                        }
                        else {
                            templateSolves[words[j].length].set(currentPrompt, templateSolves[words[j].length].get(currentPrompt) + 1);
                        }
                    }
                }
            }
        }
        return templateSolves;
    },
}