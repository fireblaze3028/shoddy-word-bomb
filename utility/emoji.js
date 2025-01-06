

module.exports = {
    promptToEmoji(prompt) {
        var finalString = "";
    
        for (var char of prompt.split("")) {
            // temporary fix, will fix properly later
            if (char == "\n") {
                continue;
            }
            if (char == "-") {
                finalString += ":asterisk: ";
            }
            else {
                finalString += ":regional_indicator_" + char + ": ";
            }
        }
    
        return finalString.trimEnd();
    },
    
    numberToEmoji(num) {
        var finalString = "";
        var numChars = (num + '').split("");
    
        for (var char of numChars) {
            switch (char) {
                case "0":
                    finalString += ":zero:";
                    break;
                case "1":
                    finalString += ":one:";
                    break;
                case "2":
                    finalString += ":two:";
                    break;
                case "3":
                    finalString += ":three:";
                    break;
                case "4":
                    finalString += ":four:";
                    break;
                case "5":
                    finalString += ":five:";
                    break;
                case "6":
                    finalString += ":six:";
                    break;
                case "7":
                    finalString += ":seven:";
                    break;
                case "8":
                    finalString += ":eight:";
                    break;
                case "9":
                    finalString += ":nine:";
                    break;
    
            }
        }
    
        return finalString;
    },
}