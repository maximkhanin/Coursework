const logFileName = 'log.txt';

const fs = require('fs');
const logFile = fs.createWriteStream(logFileName);
const util = require('util');
const em = require('./evaluationModule');

function writeLog() {
    logFile.write(util.format.apply(null, arguments) + '\n');
}

em.setLogFunction(writeLog);

const n = undefined;
const initialMatrix = [
    [1, n, n, 1, n, n, 1, 0, 1, 1, n, n, 0, 1, n, n, 0, n, n, n, 0, n, n, n, 0, 1, 0],
    [0, 1, n, 0, n, 0, n, 1, 0, 1, n, 0, n, 1, 1, n, n, 1, n, 1, 1, n, 1, 0, 0, 0, 0],
    [0, n, 0, n, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, n, 0, 0, 0, n, 0, 0, 0, 0, n, 0, 1, 0],
    [1, 0, 0, n, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 1, 0, 0, 0, n, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
    [n, 0, 1, 0, n, 1, 0, 0, n, n, 1, 0, 0, 0, 0, 0, 0, n, 0, 0, 1, 1, 0, 1, 1, 1, n]
];
writeLog("Initial matrix:\n" + em.matrixToString(initialMatrix));

const filledMatrix = em.fillMatrix(initialMatrix);
if (filledMatrix === false) {
    writeLog("Cannot fill nulls");
}
