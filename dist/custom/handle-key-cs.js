const decryptKey = {
    key: "",
    fileId: ""
};

const getDecryptKey = (fileId, callback) =>  {
    const xhrobj = new XMLHttpRequest();
    xhrobj.open('GET','https://secdocs-api.689cloud.com/api/file/video/encrypted-key/' + fileId);
    xhrobj.setRequestHeader("X-Api-Key", "7e0720ab886c4a5dac10db15e40d6f8f");
    xhrobj.setRequestHeader("X-App-Id", "23bd53ebbebe4d9885fa076afd67ffcc");
    xhrobj.send();
    xhrobj.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === "success") {
            const jsonResponse = JSON.parse(xhrobj.responseText);
            console.log(jsonResponse);
            if(jsonResponse.status === 200) {
                callback(jsonResponse.data);
            } else {
                callback("");
            }
        }
    }
}

const _base64ToArrayBuffer = (string) => {
    var binary_string = window.atob(string);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

const decryptKeyFile = (request, callback) => {
    const encryptedBytes = request.response;

    const parts = request.url.split('/');
    const fileId = parts[parts.length - 2];

    if (fileId !== decryptKey.fileId) {
        decryptKey.fileId = fileId;
        console.log(fileId);
        return getDecryptKey(fileId, function(response) {
            // a string
            decryptKey.key = response;
            const pwUtf8 = _base64ToArrayBuffer(response);
            // console.log('pwUtf8', pwUtf8);

            const iv = pwUtf8;

            return crypto.subtle.importKey('raw', pwUtf8, {name: "AES-CBC"}, false, ['decrypt'])
                .then(function (key) {
                    //returns the symmetric key
                    // console.log('key', key);

                    return crypto.subtle.decrypt({name: "AES-CBC", iv}, key, encryptedBytes)
                        .then(function (decrypted) {
                            // console.log('decryptKeyFile', decrypted);
                            return callback(decrypted);
                        }).catch(function (err) {
                            console.error(err);
                        });
                }).catch(function (err) {
                    console.error(err);
                });
        });
    } else {

        const pwUtf8 = _base64ToArrayBuffer(decryptKey.key);
        // console.log('pwUtf8', pwUtf8);

        const iv = pwUtf8;

        return crypto.subtle.importKey('raw', pwUtf8, {name: "AES-CBC"}, false, ['decrypt'])
            .then(function (key) {
                //returns the symmetric key
                // console.log('key', key);

                return crypto.subtle.decrypt({name: "AES-CBC", iv}, key, encryptedBytes)
                    .then(function (decrypted) {
                        // console.log('decryptKeyFile', decrypted);
                        return callback(decrypted);
                    }).catch(function (err) {
                        console.error(err);
                    });
            }).catch(function (err) {
                console.error(err);
            });
    }
}

/**
 * Handle responses for key data and convert the key data to the correct format
 * for the decryption step later
 *
 * @param {Object} segment - a simplified copy of the segmentInfo object
 *                           from SegmentLoader
 * @param {Array} objects - objects to add the key bytes to.
 * @param {Function} finishProcessingFn - a callback to execute to continue processing
 *                                        this request
 */


const customHandleKeyResponse = (segment, objects, finishProcessingFn, request) => {
    if (request.response.byteLength !== 16 && request.response.byteLength !== 32) {
        return finishProcessingFn({
            status: request.status,
            message: 'Invalid HLS key at URL: ' + request.uri,
            code: REQUEST_ERRORS.FAILURE,
            xhr: request
        }, segment);
    }

    if (request.response.byteLength === 32) {
        decryptKeyFile(request, function(response) {
            if (response.byteLength !== 16) {
                return finishProcessingFn({
                    status: request.status,
                    message: 'Invalid HLS key at URL: ' + request.uri,
                    code: REQUEST_ERRORS.FAILURE,
                    xhr: request
                }, segment);
            }

            const decode = String.fromCharCode.apply(null, new Uint8Array(response));
            const deContent = btoa(decode);
            // console.log("deContent: ", deContent);

            const decode16 = String.fromCharCode.apply(null, new Uint16Array(response));
            // console.log('decode16', decode16);

            const buf = new ArrayBuffer(decode16.length * 2); // 2 bytes for each char
            const bufView = new Uint16Array(buf);
            for (let i = 0, strLen = decode16.length; i < strLen; i++) {
                bufView[i] = decode16.charCodeAt(i);
            }
            // console.log("buf ", buf);

            // response = buf;

            const view = new DataView(buf);
            const bytes = new Uint32Array([view.getUint32(0), view.getUint32(4), view.getUint32(8), view.getUint32(12)]);

            for (let i = 0; i < objects.length; i++) {
                objects[i].bytes = bytes;
            }

            return finishProcessingFn(null, segment);
        });
    } else {

        const response = request.response;

        const decode = String.fromCharCode.apply(null, new Uint8Array(response));
        const deContent = btoa(decode);
        // console.log("deContent: ", deContent);

        const decode16 = String.fromCharCode.apply(null, new Uint16Array(response));
        // console.log('decode16', decode16);

        const buf = new ArrayBuffer(decode16.length * 2); // 2 bytes for each char
        const bufView = new Uint16Array(buf);
        for (let i = 0, strLen = decode16.length; i < strLen; i++) {
            bufView[i] = decode16.charCodeAt(i);
        }
        // console.log("buf ", buf);

        // response = buf;

        const view = new DataView(buf);
        const bytes = new Uint32Array([view.getUint32(0), view.getUint32(4), view.getUint32(8), view.getUint32(12)]);

        for (let i = 0; i < objects.length; i++) {
            objects[i].bytes = bytes;
        }

        return finishProcessingFn(null, segment);
    }
};

export default customHandleKeyResponse;
