const axios = require('axios');
const version = require('./convertNumToAlphaVersion');
const config = require('./config');
axios.defaults.headers.common['PRIVATE-TOKEN'] = config.PRIVATE_TOKEN;
const RELEASED_VERSIONS_REST_API = config.RELEASED_VERSIONS_REST_API;

function getReleasedVersions(callback) {
    let versions = null;
    axios.get(RELEASED_VERSIONS_REST_API)
        .then(response => {
            let lastVersions = {};
            for (let i = 0; i < 2; i++) {
                lastVersions[response.data[i]] = null;
            }
            for (let i = 2; i < response.data.length && Object.keys(lastVersions).length < 9; i++) {
                const v = response.data[i];
                const split = v.split("-")[0].split(".");
                if (split.length === 3) {
                    const fixVersion = +split.pop();
                    const majorMinor = split.join(".");
                    if (!Object.keys(lastVersions).includes(majorMinor)) {
                        lastVersions[majorMinor] = fixVersion;
                    } else if (lastVersions[majorMinor] < fixVersion) {
                        lastVersions[majorMinor] = fixVersion;
                    }
                }
            }
            versions = Object.keys(lastVersions).map(key => {
                if (lastVersions[key]) {
                    return `${key}.${version.convertNumber(lastVersions[key])}`;
                }
                return key;
            });
            callback(versions);
        });
}

module.exports = {
    getReleasedVersions: getReleasedVersions
};