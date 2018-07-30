function genCharArray(charA, charZ) {
    let a = [], i = charA.charCodeAt(0), j = charZ.charCodeAt(0);
    for (; i <= j; ++i) {
        a.push(String.fromCharCode(i));
    }
    return a;
}

function getSplittedVersion(version) {
    return version.split('-')[0].split('.');
}

function getPatchVersion(version) {
    const splittedVersion = getSplittedVersion(version);
    return splittedVersion.length > 2 ? splittedVersion.pop() : null;
}

function getTargetPatchVersion(version, targetPatch) {
    return `${getSplittedVersion(version).slice(0,2).join('.')}.${targetPatch}`;
}

function convert(version) {
    const patchVersion = getPatchVersion(version);
    const targetVersion = convertNumber(patchVersion);
    return getTargetPatchVersion(version, targetVersion);
}

function convertNumber(patchVersion) {
    const alphabet = genCharArray('A', 'Z');
    const alphabetSize = alphabet.length;
    const loopLetter = alphabet[alphabetSize - 1];

    if (!patchVersion)
        return patchVersion;

    const nbOfAlphabetLoop = Math.floor(patchVersion / alphabetSize);
    const lastLetterIndex = patchVersion % alphabetSize - 1;

    let targetVersion = "";
    if( nbOfAlphabetLoop > 0) {
        for (let idx = 0; idx < nbOfAlphabetLoop; idx++) {
            targetVersion += loopLetter;
        }
    }

    if (lastLetterIndex > -1) {
        targetVersion += alphabet[lastLetterIndex];
    }
    return targetVersion;
}

//console.log(convert(process.argv[2]));

module.exports = {
    convert: convert,
    convertNumber: convertNumber
};