const ml_pca = require('ml-pca');
const ml_kmeans = require('ml-kmeans');

module.exports = {
    setLogFunction, matrixToString, isFillable, clustering, fillMatrix
};

let writeLog;

function setLogFunction(func) {
    writeLog = func;
}

function matrixToString(matrix) {
    let str = "";
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[0].length; j++) {
            if (matrix[i][j] === undefined) {
                str += "n";
            } else {
                str += matrix[i][j];
            }
            str += ", "
        }
        str = str.slice(0, str.length - 2) + "\n";
    }
    return str;
}

//function that takes matrix and return true if there is fully completed questions, else false
function isFillable(matrix) {
    const nResponses = matrix.length;
    const nFeatures = matrix[0].length;
    for (let featureIndex = 0; featureIndex < nFeatures; featureIndex++) {
        let isFeatureFull = true;
        for (let responseIndex = 0; responseIndex < nResponses; responseIndex++) {
            if (matrix[responseIndex][featureIndex] === undefined) {
                isFeatureFull = false;
                break;
            }
        }
        if (isFeatureFull) {
            return true;
        }
    }
    return false;
}

//function that takes matrix and return optimal clustering
function clustering(matrix) {
    const n = matrix.length;
    let kmeansResult = ml_kmeans(matrix, 1);
    const error1 = kmeansResult.centroids[0].error;
    let k;
    for (k = 2; k <= n; k++) {
        kmeansResult = ml_kmeans(matrix, k);
        let errork = 0;
        for (let i = 0; i < k; i++) {
            errork += kmeansResult.centroids[i].error;
        }
        if (errork / error1 < 0.35) {
            break;
        }
    }
    return kmeansResult;
}

//function that takes matrix with nulls and return filled matrix (without nulls) if it possible, else false
function fillMatrix(initialMatrix) {
    if (!isFillable(initialMatrix)) {
        writeLog("No features with complete filled answers");
        return false;
    }
    //array of filled features
    const filledFeatures = [];
    for (let feature = 0; feature < initialMatrix[0].length; feature++) {
        let isFilled = true;
        for (let response = 0; response < initialMatrix.length; response++) {
            if (initialMatrix[response][feature] === undefined) {
                isFilled = false;
                break;
            }
        }
        if (isFilled) {
            filledFeatures.push(feature);
        }
    }

    //create matrix with only filled features
    const onlyFilledMatrix = [];
    for (let i = 0; i < initialMatrix.length; i++) {
        onlyFilledMatrix[i] = new Array(filledFeatures.length);
    }
    for (const featureIndex in filledFeatures) {
        for (let response = 0; response < initialMatrix.length; response++) {
            onlyFilledMatrix[response][featureIndex] = initialMatrix[response][filledFeatures[featureIndex]];
        }
    }
    writeLog("Created matrix with only filled features (" + onlyFilledMatrix[0].length + " features)");
    writeLog(matrixToString(onlyFilledMatrix));

    // number of experts must be more than number of features
    if (onlyFilledMatrix.length <= onlyFilledMatrix[0].length){
        writeLog("Number of experts must be more than number of features");
        return false;
    }

    //PCA
    const pca = new ml_pca(onlyFilledMatrix);
    let nAxis = 0;
    let proportion = 0;
    const explainedVariance = pca.getExplainedVariance();
    for (const i in explainedVariance) {
        proportion += explainedVariance[i];
        nAxis++;
        if (proportion >= 0.90) {
            break;
        }
    }
    const pcaMatrix = pca.predict(onlyFilledMatrix);
    for (const i in onlyFilledMatrix) {
        pcaMatrix[i] = pcaMatrix[i].slice(0, nAxis);
    }
    writeLog("Was chosen " + nAxis + " from " + explainedVariance.length + " PCA axis");
    writeLog("PCA matrix:");
    writeLog(matrixToString(pcaMatrix));

    //k-means
    let kmeansResult = clustering(pcaMatrix);
    for (let i = 0; i < 10; i++) {
        const kmeansResultTmp = clustering(pcaMatrix);
        if (kmeansResultTmp.centroids.length < kmeansResult.centroids.length) {
            kmeansResult = kmeansResultTmp;
        }
    }
    writeLog("Was created " + kmeansResult.centroids.length + " clusters");
    writeLog(kmeansResult.clusters);
    writeLog("");

    const clusters = kmeansResult.clusters;
    const k = kmeansResult.centroids.length;
    const responsesByClusters = new Array(k);
    for (let i = 0; i < k; i++) {
        responsesByClusters[i] = [];
    }
    for (const i in clusters) {
        responsesByClusters[clusters[i]].push(i);
    }

    //fill nulls
    const filledMatrix = new Array(initialMatrix.length);
    for (let i = 0; i < initialMatrix.length; i++) {
        filledMatrix[i] = initialMatrix[i].slice(0, initialMatrix[i].length);
    }
    for (const clusterIndex in responsesByClusters) {
        const cluster = responsesByClusters[clusterIndex];
        for (let feature = 0; feature < filledMatrix[0].length; feature++) {
            const answeredResponses = [];
            const nullsResponses = [];
            for (const responseIndex in cluster) {
                const response = cluster[responseIndex];
                if (filledMatrix[response][feature] === undefined) {
                    nullsResponses.push(response);
                } else {
                    answeredResponses.push(response);
                }
            }
            if (nullsResponses.length === 0 || answeredResponses.length === 0) {
                continue;
            }
            let average = 0;
            for (const responseIndex in answeredResponses) {
                average += filledMatrix[answeredResponses[responseIndex]][feature];
            }
            average = Math.round(average / answeredResponses.length);
            for (const responseIndex in nullsResponses) {
                filledMatrix[nullsResponses[responseIndex]][feature] = average;
            }
        }
    }
    writeLog("Was created filled matrix");
    writeLog(matrixToString(filledMatrix));
    return filledMatrix;
}
