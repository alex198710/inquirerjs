function formatPatchVersions(patchVersions, nbLines) {
    let res = '||Versions / Patchs||commité||\n';

    for (let i = 0 ; i < patchVersions.length && (nbLines ? i < nbLines : true); i++) {
        const v = patchVersions[i];
        res +=  `|${v}|(/)|\n`;
    }

    return res;
}

module.exports = {
    formatPatchVersions: formatPatchVersions
};